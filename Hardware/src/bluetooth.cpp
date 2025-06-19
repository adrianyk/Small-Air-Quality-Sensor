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
#define SERVICE_UUID                      "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID_DATA          "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define CHARACTERISTIC_UUID_COMMAND       "12345678-1234-5678-1234-56789abcdef0"
#define CHARACTERISTIC_UUID_SESSION_STATE "1b76c3ce-d232-4796-9d85-cf1a68ecff05"
#define CHARACTERISTIC_UUID_TIMESTAMP     "a66324f1-8fc4-44a6-9be5-a481922ef754"


// Timestamp globals
unsigned long startTimestamp = 0; 
unsigned long readingIndex = 0;   


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

// BLE Globals
bool hasStarted = false;
BLEServer* pServer = nullptr;
BLECharacteristic* pCharacteristic = nullptr;
BLECharacteristic* pRXCharacteristic = nullptr;
BLECharacteristic* pSessionStateCharacteristic = nullptr;
BLECharacteristic* pTimestampCharacteristic = nullptr;

bool deviceConnected = false;
std::string rxValue;

// Reading CSV globals
int sessionCounter = 0;
String currentSessionFile = "";
File csvFile;
bool isSendingFile = false;
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 100;

const char* csvKeys[] = {
  "time", "temp", "humidity",
  "pm1_std", "pm25_std", "pm10_std",
  "pm1_env", "pm25_env", "pm10_env"
};

const int numKeys = sizeof(csvKeys) / sizeof(csvKeys[0]);

class MyBLECallbacks : public BLEServerCallbacks, public BLECharacteristicCallbacks {
public:
  void onConnect(BLEServer* pServer) override {
    deviceConnected = true;
    Serial.println("BLE client connected");
    if (pSessionStateCharacteristic) pSessionStateCharacteristic->notify();
  }

  void onDisconnect(BLEServer* pServer) override {
    deviceConnected = false;
    Serial.println("BLE client disconnected");
    delay(500);
    pServer->getAdvertising()->start();
    Serial.println("BLE advertising restarted");
  }

  void onWrite(BLECharacteristic* pCharacteristic) override {
    std::string value = pCharacteristic->getValue();
    Serial.print("Received on characteristic ");
    Serial.print(pCharacteristic->getUUID().toString().c_str());
    Serial.print(": ");
    Serial.println(value.c_str());

    if (pCharacteristic == pRXCharacteristic) {
      rxValue = value;
    } else if (pCharacteristic == pTimestampCharacteristic) {
      // Parse timestamp from string (expecting ASCII decimal seconds)
      unsigned long ts = strtoul(value.c_str(), nullptr, 10);
      if (ts > 0) {
        startTimestamp = ts;
        readingIndex = 0;
        Serial.printf("Start timestamp set to %lu\n", startTimestamp);
      }
    }
  }
};



SPIClass vspi(VSPI);

void writeCSVHeader() {
  File file = SD.open("/log.csv", FILE_WRITE);  // Open for write (truncates if FILE_WRITE used after removing the file)
  if (file) {
    file.close();  // First close in case it exists
    SD.remove("/log.csv");  // Delete the existing file
  }

  file = SD.open("/log.csv", FILE_WRITE);  // Now open fresh file
  if (file) {
    file.println("timestamp,temp,humidity,pm1_std,pm25_std,pm10_std,pm1_env,pm25_env,pm10_env");
    file.close();
    Serial.println("CSV header written.");
  } else {
    Serial.println("Failed to open file to write header.");
  }
}


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
  if (currentSessionFile == "") return;

  File file = SD.open(currentSessionFile, FILE_APPEND);
  if (file) {
    file.println(data);
    file.close();
    Serial.println("Logged: " + data);
  } else {
    Serial.println("Failed to write to " + currentSessionFile);
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
  void writeCSVHeader();
  // BLE setup
  BLEDevice::init("ESP32 BLE");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyBLECallbacks());

  BLEService* pService = pServer->createService(SERVICE_UUID);

  pTimestampCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID_TIMESTAMP,
    BLECharacteristic::PROPERTY_WRITE
  );

  pTimestampCharacteristic->addDescriptor(new BLE2902());
  pTimestampCharacteristic->setCallbacks(new MyBLECallbacks());

  pSessionStateCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID_SESSION_STATE,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );

  pSessionStateCharacteristic->addDescriptor(new BLE2902());

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

   File root = SD.open("/");
  while (true) {
    String fileName = "/session-" + String(sessionCounter + 1) + ".csv";
    if (!SD.exists(fileName)) break;
    sessionCounter++;
  }

  Serial.printf("Last session number: %d\n", sessionCounter);
}

void loop() {
  String msg;
  String logEntry;

  float temp = sht31.readTemperature();
  float humidity = sht31.readHumidity();

  String currentLine;
  int currentFieldIndex = 0;

  if (rxValue == "START"){
    if (!hasStarted) {
        readingIndex = 0;
        sessionCounter++;
        currentSessionFile = "/session-" + String(sessionCounter) + ".csv";

        File file = SD.open(currentSessionFile, FILE_WRITE);
        if (file) {
          file.println("temp,humidity,pm1_std,pm25_std,pm10_std,pm1_env,pm25_env,pm10_env");
          file.close();
          Serial.println("Started new session: " + currentSessionFile);
        } else {
          Serial.println("Failed to create session file");
        }

        hasStarted = true; 
        pSessionStateCharacteristic->setValue(hasStarted ? "STOP" : "START");
      }
    if (!isnan(temp) && !isnan(humidity)) {
      Serial.printf("Temp: %.1f C, Hum: %.1f %%\n", temp, humidity);
      unsigned long currentTimestamp = startTimestamp + readingIndex;
      logEntry = String(currentTimestamp) + "," + String(temp, 1) + "," + String(humidity, 1);
    } else {
      logEntry += "NA,NA";
    }

  #ifdef USE_PMS5003
    uint16_t pm1_std, pm25_std, pm10_std, pm1_env, pm25_env, pm10_env;
    if (readPMSData(&pm1_std, &pm25_std, &pm10_std, &pm1_env, &pm25_env, &pm10_env)) {
      Serial.printf("PM Std: 1.0=%d 2.5=%d 10=%d\n", pm1_std, pm25_std, pm10_std);
      Serial.printf("PM Env: 1.0=%d 2.5=%d 10=%d\n", pm1_env, pm25_env, pm10_env);
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
      logEntry += "NA," + String(pm25, 1) + "," + String(pm10, 1)
              + "NA," + String(pm25, 1) + "," + String(pm10, 1);  // Duplicate into std/env placeholders
    } else {
      logEntry += "NA,NA,NA,NA,NA,NA";
    }
  #endif

    logToSDCard(logEntry);
    readingIndex++;
    delay(1000);
  }

  else if (rxValue == "STOP" && !isSendingFile) {
    if (currentSessionFile != "") {
      csvFile = SD.open(currentSessionFile, FILE_READ);
      if (csvFile) {
        Serial.println("Sending latest session file: " + currentSessionFile);
        isSendingFile = true;
        lastSendTime = millis();
      } else {
        Serial.println("Failed to open " + currentSessionFile);
        rxValue.clear();
      }
    } else {
      Serial.println("No session file to send");
      rxValue.clear();
    }
  }

  else {
    hasStarted = false; 
    pSessionStateCharacteristic->setValue(hasStarted ? "STOP" : "START");
  }

  if(isSendingFile && deviceConnected) {
    if(millis() - lastSendTime >= SEND_INTERVAL){
      if(csvFile.available()){
        // static File csvFile;
        static String currentLine = "";
        static int currentFieldIndex = 0;

        // Read new line only if currentLine is empty
        if (currentLine == "" && csvFile.available()) {
          currentLine = csvFile.readStringUntil('\n');
          currentLine.trim();

          // Skip header line
          if (currentLine.startsWith("temp") || currentLine.startsWith("T")) {
            Serial.println("Skipped header: " + currentLine);
            currentLine = ""; // clear and read next line in next cycle
            return; // wait for next SEND_INTERVAL cycle
          }

          currentFieldIndex = 0;
        }


        if (csvFile.available() || currentLine != "") {
          if (currentLine != "") {
            int start = 0;
            for (int i = 0; i < currentFieldIndex; i++) {
              start = currentLine.indexOf(',', start) + 1;
              if (start == 0) break;
            }

            int end = currentLine.indexOf(',', start);
            if (end == -1) end = currentLine.length();

            String value = currentLine.substring(start, end);
            String msg = String(csvKeys[currentFieldIndex]) + ":" + value;

            Serial.println("Sending: " + msg);
            pCharacteristic->setValue(msg.c_str());
            pCharacteristic->notify();

            currentFieldIndex++;

            if (currentFieldIndex >= numKeys) {
              currentLine = "";  // Done with this line
              currentFieldIndex = 0;
            }
            if (!csvFile.available() && currentLine == "") {
              Serial.println("End of CSV file reached");
              csvFile.close();
              isSendingFile = false;
              rxValue.clear();
              return;
            }

          }
        } else {
          Serial.println("End of CSV file reached");
          csvFile.close();
        }

      } else{
        Serial.println("Finished sending file.");
        csvFile.close();
        isSendingFile = false;
        rxValue.clear();
      }
      lastSendTime = millis();
    }
  }
}
