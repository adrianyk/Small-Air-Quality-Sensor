 #define USE_PMS5003
// #define USE_SDS011

#include <Arduino.h>
#include <Wire.h>
#include <HardwareSerial.h>
#include <SPI.h>
#include <SD.h>
#include <Adafruit_SHT31.h>

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#ifdef USE_SDS011
#include <SDS011.h>
#endif

// BLE UUIDs
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID_DATA "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define CHARACTERISTIC_UUID_COMMAND "12345678-1234-5678-1234-56789abcdef0"

// SD Card (VSPI default pins)
#define SD_CS    15
#define SD_SCK   14
#define SD_MISO  25
#define SD_MOSI  13

#ifdef USE_SDS011
SDS011 sds;
#endif

// Sensor UART
#define RXD2 34
#define TXD2 17
#define PM_BAUD 9600
HardwareSerial PMserial(1);

// Sensor instances
Adafruit_SHT31 sht31 = Adafruit_SHT31();

BLEServer* pServer = nullptr;
BLECharacteristic* pCharacteristic = nullptr;
BLECharacteristic* pRXCharacteristic = nullptr;
bool deviceConnected = false;

std::string rxValue;

class MyBLECallbacks : public BLEServerCallbacks, public BLECharacteristicCallbacks {
public:
  // BLE Server (connection) events
  void onConnect(BLEServer* pServer) override {
    deviceConnected = true;
    Serial.println("BLE client connected");
  }

  void onDisconnect(BLEServer* pServer) override {
    deviceConnected = false;
    Serial.println("BLE client disconnected");
    delay(500);  // Small delay can help avoid immediate reconnect issues
    pServer->getAdvertising()->start();
    Serial.println("BLE advertising restarted");
  }

  // BLE Characteristic write event
  void onWrite(BLECharacteristic* pCharacteristic) override {
    rxValue = pCharacteristic->getValue();
    Serial.println(rxValue.c_str());
  }
};


SPIClass vspi(VSPI);

bool readPMSData(uint16_t* pm1_std, uint16_t* pm25_std, uint16_t* pm10_std,
                 uint16_t* pm1_env, uint16_t* pm25_env, uint16_t* pm10_env) {
  static uint8_t buffer[32];
  while (PMserial.available() >= 32) {
    if (PMserial.read() == 0x42 && PMserial.peek() == 0x4D) {
      buffer[0] = 0x42;
      buffer[1] = PMserial.read();  // 0x4D
      for (int i = 2; i < 32; i++) buffer[i] = PMserial.read();

      uint16_t sum = 0;
      for (int i = 0; i < 30; i++) sum += buffer[i];
      uint16_t receivedChecksum = (buffer[30] << 8) | buffer[31];

      if (sum == receivedChecksum) {
        *pm1_std  = (buffer[4]  << 8) | buffer[5];
        *pm25_std = (buffer[6]  << 8) | buffer[7];
        *pm10_std = (buffer[8]  << 8) | buffer[9];
        *pm1_env  = (buffer[10] << 8) | buffer[11];
        *pm25_env = (buffer[12] << 8) | buffer[13];
        *pm10_env = (buffer[14] << 8) | buffer[15];
        return true;
      }
    }
  }
  return false;
}

void logToSDCard(const String& data) {
  File file = SD.open("/log.csv", FILE_APPEND);
  if (file) {
    file.println(data);
    file.close();
    Serial.println("Logged: " + data);
  } else {
    Serial.println("Failed to open file for writing");
  }
}

void setup() {
  Serial.begin(115200);
  Wire.begin();
  #ifdef USE_PMS5003
    PMserial.begin(PM_BAUD, SERIAL_8N1, RXD2, TXD2);
  #endif

  #ifdef USE_SDS011
    sds.begin(&PMserial);  // reuse same serial if using SDS011
  #endif

  if (!sht31.begin(0x44)) {
    Serial.println("Could not find SHT31 sensor!");
    while (1) delay(1);
  }

  // VSPI bus init
  vspi.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  if (!SD.begin(SD_CS, vspi, 100000)) { // 4 MHz clock
    Serial.println("SD Card Mount Failed at 4MHz");
    return;
  }
  Serial.println("SD card initialized.");

  // BLE setup
  BLEDevice::init("ESP32 BLE");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyBLECallbacks());

  BLEService* pService = pServer->createService(SERVICE_UUID);

  // Data characteristic (read/notify)
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID_DATA,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );

  pCharacteristic->addDescriptor(new BLE2902());

  pRXCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID_COMMAND,
    BLECharacteristic::PROPERTY_WRITE
  );

  pRXCharacteristic->addDescriptor(new BLE2902());
  pRXCharacteristic->setCallbacks(new MyBLECallbacks());

  // Start the service AFTER adding both characteristics
  pService->start();
  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);  // optional, makes discovery more robust
  BLEDevice::startAdvertising();
  Serial.println("BLE Server is running...");
}

void loop() {
  String msg;
  String logEntry = String(millis());

  float temp = sht31.readTemperature();
  float humidity = sht31.readHumidity();

  if (rxValue == "START"){

    if (!isnan(temp) && !isnan(humidity)) {
      Serial.printf("Temp: %.1f C, Hum: %.1f %%\n", temp, humidity);
      if (deviceConnected) {
        pCharacteristic->setValue(("T:" + String(temp, 1) + "C").c_str());
        pCharacteristic->notify(); delay(1000);
        pCharacteristic->setValue(("H:" + String(humidity, 1) + "%").c_str());
        pCharacteristic->notify(); delay(1000);
      }
      logEntry += "," + String(temp, 1) + "," + String(humidity, 1);
    } else {
      logEntry += ",NA,NA";
    }

  #ifdef USE_PMS5003
    uint16_t pm1_std, pm25_std, pm10_std, pm1_env, pm25_env, pm10_env;
    if (readPMSData(&pm1_std, &pm25_std, &pm10_std, &pm1_env, &pm25_env, &pm10_env)) {
      Serial.printf("PM Std: 1.0=%d 2.5=%d 10=%d\n", pm1_std, pm25_std, pm10_std);
      Serial.printf("PM Env: 1.0=%d 2.5=%d 10=%d\n", pm1_env, pm25_env, pm10_env);
      if (deviceConnected) {
        pCharacteristic->setValue(("Standard PM1:" + String(pm1_std)).c_str()); pCharacteristic->notify(); delay(1000);
        pCharacteristic->setValue(("Standard PM2.5:" + String(pm25_std)).c_str()); pCharacteristic->notify(); delay(1000);
        pCharacteristic->setValue(("Standard PM10:" + String(pm10_std)).c_str()); pCharacteristic->notify(); delay(1000);
        pCharacteristic->setValue(("Env PM1:" + String(pm1_env)).c_str()); pCharacteristic->notify(); delay(1000);
        pCharacteristic->setValue(("Env PM2.5:" + String(pm25_env)).c_str()); pCharacteristic->notify(); delay(1000);
        pCharacteristic->setValue(("Env PM10:" + String(pm10_env)).c_str()); pCharacteristic->notify(); delay(1000);
      }
      logEntry += "," + String(pm1_std) + "," + String(pm25_std) + "," + String(pm10_std)
              + "," + String(pm1_env) + "," + String(pm25_env) + "," + String(pm10_env);
    } else {
      logEntry += ",NA,NA,NA,NA,NA,NA";
    }
  #endif

  #ifdef USE_SDS011
  float pm25, pm10;
  int err = sds.read(&pm25, &pm10);
    if (err) {
      Serial.printf("SDS011: PM2.5=%.1f PM10=%.1f\n", pm25, pm10);
      if (deviceConnected) {

        Serial.println("Device Connected");

        pCharacteristic->setValue(("PM25:" + String(pm25, 1)).c_str()); pCharacteristic->notify(); delay(1000);
        pCharacteristic->setValue(("PM10:" + String(pm10, 1)).c_str()); pCharacteristic->notify(); delay(1000);
      }
      logEntry += ",NA," + String(pm25, 1) + "," + String(pm10, 1)
              + ",NA," + String(pm25, 1) + "," + String(pm10, 1);  // Duplicate into std/env placeholders
    } else {
      logEntry += ",NA,NA,NA,NA,NA,NA";
    }
  #endif

    logToSDCard(logEntry);
    delay(3000);
  }


}
