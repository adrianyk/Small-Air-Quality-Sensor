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

//BLE Setup
BLEServer* pServer = nullptr;
BLECharacteristic* pCharacteristic = nullptr;
bool deviceConnected = false;

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

//SD Card
#define CS_PIN 5
File file;

//PMS5003
#define RXD2 34
#define TXD2 17
#define PM_BAUD 9600

//SHT85
HardwareSerial PMserial(2);
Adafruit_SHT31 sht31 = Adafruit_SHT31();

//BLE Callback
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
  }
  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
  }
};

//PMS5003 Parser
bool readPMSData(uint16_t* pm1_std, uint16_t* pm25_std, uint16_t* pm10_std,
                 uint16_t* pm1_env, uint16_t* pm25_env, uint16_t* pm10_env) {
  static uint8_t buffer[32];

  while (PMserial.available() >= 32) {
    if (PMserial.read() == 0x42) {
      if (PMserial.peek() == 0x4D) {
        buffer[0] = 0x42;
        buffer[1] = PMserial.read();  // 0x4D

        for (int i = 2; i < 32; i++) {
          buffer[i] = PMserial.read();
        }

        // Validate checksum
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
  }

  return false;
}


void setup() {
  Serial.begin(115200);

  //PMS5003
  Wire.begin();
  PMserial.begin(PM_BAUD, SERIAL_8N1, RXD2, TXD2);

  //SHT85
  if (!sht31.begin(0x44)) {
    Serial.println("Could not find SHT31 sensor!");
  }

  //BLE
  BLEDevice::init("ESP32 BLE");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService* pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();
  pServer->getAdvertising()->start();

  Serial.println("BLE Server is running...");
}

void loop() {
  String msg;

  pinMode(19, OUTPUT);
  digitalWrite(19, HIGH);
  
  float temp = sht31.readTemperature();
  float humidity = sht31.readHumidity();

  uint16_t pm1_std = 0, pm25_std = 0, pm10_std = 0;
  uint16_t pm1_env = 0, pm25_env = 0, pm10_env = 0;
  bool pmValid = readPMSData(&pm1_std, &pm25_std, &pm10_std, &pm1_env, &pm25_env, &pm10_env);

  if (!isnan(temp) && !isnan(humidity)) {
    Serial.println("Environmental Data:");
    Serial.printf("Temp: %.1f C, Hum: %.1f %%\n", temp, humidity);

    if (deviceConnected) {

      msg = "T:" + String(temp, 1) + "C";
      pCharacteristic->setValue(msg.c_str());
      pCharacteristic->notify();
      delay(10);

      msg = "H:" + String(humidity, 1) + "%";
      pCharacteristic->setValue(msg.c_str());
      pCharacteristic->notify();
      delay(10);
    }
  
  }

if (pmValid) {
  Serial.println("PM Data (Standard):");
  Serial.printf("PM1.0: %d, PM2.5: %d, PM10: %d\n", pm1_std, pm25_std, pm10_std);

  Serial.println("PM Data (Atmospheric):");
  Serial.printf("PM1.0: %d, PM2.5: %d, PM10: %d\n", pm1_env, pm25_env, pm10_env);

  if (deviceConnected) {

    msg = "STD_PM1:" + String(pm1_std);
    pCharacteristic->setValue(msg.c_str());
    pCharacteristic->notify();
    delay(10);

    msg = "STD_PM2.5:" + String(pm25_std);
    pCharacteristic->setValue(msg.c_str());
    pCharacteristic->notify();
    delay(10);

    msg = "STD_PM10:" + String(pm10_std);
    pCharacteristic->setValue(msg.c_str());
    pCharacteristic->notify();
    delay(10);

    msg = "ENV_PM1:" + String(pm1_env);
    pCharacteristic->setValue(msg.c_str());
    pCharacteristic->notify();
    delay(10);

    msg = "ENV_PM2.5:" + String(pm25_env);
    pCharacteristic->setValue(msg.c_str());
    pCharacteristic->notify();
    delay(10);

    msg = "ENV_PM10:" + String(pm10_env);
    pCharacteristic->setValue(msg.c_str());
    pCharacteristic->notify();
    delay(10);
  }
}


  else {
    Serial.println("Sensor read failed");
  }

  delay(2000); // 2 second interval

}

