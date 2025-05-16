#include <Adafruit_GPS.h>
#include <HardwareSerial.h>


/*remember to include:
    lib_deps = 
    adafruit/Adafruit GPS Library
  in platformio.ini
*/
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
  GPS_Serial.begin(9600, SERIAL_8N1, 26, 25);
  
  // Configure GPS output
  GPS.sendCommand(PMTK_SET_NMEA_OUTPUT_RMCGGA); // Get time + position data
  GPS.sendCommand(PMTK_SET_NMEA_UPDATE_1HZ);    // 1 update per second
  GPS.sendCommand(PGCMD_ANTENNA);               // Antenna status
  
  Serial.println("Waiting for GPS fix...");

}

void loop() {
  // Read data from GPS
  char c = GPS.read();
  
  // If we got a new NMEA sentence, parse it
  if (GPS.newNMEAreceived()) {
    if (!GPS.parse(GPS.lastNMEA())) return;
  }

  // Get Lat and Long every 5s
  
  // Print data every minute
    if (GPS.fix) {
      if (millis()-timer_ave>5000){
        //Serial.println("5sec");
        timer_ave = millis();
        Serial.print(GPS.latitudeDegrees, 6); Serial.print(", "); Serial.println(GPS.longitudeDegrees, 6);
        lon=lon+GPS.longitudeDegrees*1e6;
        lat=lat+GPS.latitudeDegrees*1e6;
        count++;
        //Serial.print((lat/1e6), 6); Serial.print(", "); Serial.println((lon/1e6), 6);
      
      }
      if (millis() - timer > 60000) {
        timer = millis();
        //Serial.println("60sec");
      // Print time from GPS (UTC)
        Serial.println("---------------------");
        Serial.print("GPS Time: ");
        Serial.printf("%02d:%02d:%02d", GPS.hour, GPS.minute, GPS.seconds);
        Serial.println();
        
        // Print date from GPS
        Serial.print("Date: ");
        Serial.printf("%02d/%02d/%02d", GPS.day, GPS.month, GPS.year);
        Serial.println();
        // Print location data
        Serial.print("Location: ");
        
        Serial.print(((lat/1e6)/count), 6); Serial.print(", "); Serial.println(((lon/1e6)/count), 6);
        lon=0;
        lat=0;
        count=0;
        Serial.println("---------------------");
    
      }}
    else {
      if (millis() - timer > 1000) {
        timer = millis();
        Serial.println("No GPS fix yet...");
      }
    }
  
}