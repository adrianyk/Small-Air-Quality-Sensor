#include <Adafruit_GPS.h>
#include <HardwareSerial.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>


/*remember to include:
    lib_deps = 
    adafruit/Adafruit GPS Library
  in platformio.ini
*/
//BLE Setup
BLEServer* pServer = nullptr;
BLECharacteristic* pCharacteristic = nullptr;
bool deviceConnected = false;
//BLE Callback
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
  }
  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
  }
};

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

HardwareSerial GPS_Serial(1);

Adafruit_GPS GPS(&GPS_Serial);

// Timekeeping variables
uint32_t timer = millis();
uint32_t timer_ave = millis();

int32_t lon=0;
int32_t lat=0;
u_int16_t count=0;

void setup() {
  Serial.begin(115200);
  
  // Initialize GPS
  GPS_Serial.begin(9600, SERIAL_8N1, 16, 17);
  //RX from esp(16)- TX gps
  //TX from esp(17)- RX gps
  
  // Configure GPS output
  GPS.sendCommand(PMTK_SET_NMEA_OUTPUT_RMCGGA); // Get time + position data
  GPS.sendCommand(PMTK_SET_NMEA_UPDATE_1HZ);    // 1 update per second
  GPS.sendCommand(PGCMD_ANTENNA);               // Antenna status
  
  Serial.println("Waiting for GPS fix...");

  //BLE
  BLEDevice::init("ESP32 BLE_2");
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
  // Read data from GPS
  char c = GPS.read();
  String msg;
  
  
  // If we got a new NMEA sentence, parse it
  if (GPS.newNMEAreceived()) {
    if (!GPS.parse(GPS.lastNMEA())) return;
  }

  // Get Lat and Long every 5s
  
  // Print data every minute
    if (GPS.fix) {
      //take reading every second
      if (millis()-timer_ave>1000){
        //Serial.println("5sec");
        timer_ave = millis();
        Serial.print(GPS.latitudeDegrees, 6); Serial.print(", "); Serial.println(GPS.longitudeDegrees, 6);
        lon=lon+GPS.longitudeDegrees*1e6;
        lat=lat+GPS.latitudeDegrees*1e6;
        count++;
      
      }
      // Print data every second
      if (millis() - timer > 10000) {
        timer = millis();

         if (deviceConnected) {

          msg = "T:" + String(GPS.hour) + "/"+ String(GPS.minute)+'/'+String(GPS.seconds);
          pCharacteristic->setValue(msg.c_str());
          pCharacteristic->notify();
          delay(1000);
          Serial.println("---------------------");
          Serial.print("GPS Time: ");
          Serial.printf("%02d:%02d:%02d", GPS.hour, GPS.minute, GPS.seconds);
          Serial.println();

          msg = "D:" + String(GPS.day) + "/"+ String(GPS.month)+'/'+String(GPS.year);
          pCharacteristic->setValue(msg.c_str());
          pCharacteristic->notify();
          delay(1000);
          Serial.print("Date: ");
          Serial.printf("%02d/%02d/%02d", GPS.day, GPS.month, GPS.year);
          Serial.println();

          msg = "la:"+ String((lat/1e6)/count,6);
          pCharacteristic->setValue(msg.c_str());
          pCharacteristic->notify();
          delay(1000);
          msg = "lo:"+ String((lon/1e6)/count,6);
          pCharacteristic->setValue(msg.c_str());
          pCharacteristic->notify();
          delay(1000);
          Serial.print("Location: ");
          Serial.print(((lat/1e6)/count), 6); Serial.print(", "); Serial.println(((lon/1e6)/count), 6);
          lon=0;
          lat=0;
          count=0;
          Serial.println("---------------------");
        }
      
    
      }
    }
    else {
      if (millis() - timer > 1000) {
        timer = millis();
        Serial.println("No GPS fix yet...");
        if (deviceConnected) {

        msg = "No GPS fix yet...";
        pCharacteristic->setValue(msg.c_str());
        pCharacteristic->notify();
        delay(100);
        msg = "...";
        pCharacteristic->setValue(msg.c_str());
        pCharacteristic->notify();
        delay(100);
        }
      }
    }
  
}