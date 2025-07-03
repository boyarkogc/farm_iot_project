/*
 * Example Arduino sketch for Farm IoT LoRa Communication
 * 
 * This sketch demonstrates how to set up an Arduino with LoRa capabilities
 * to communicate with the Raspberry Pi gateway.
 * 
 * Hardware:
 * - Arduino (Uno, Nano, Pro Mini, etc.)
 * - LoRa module (RFM95/96/97/98, SX1276/77/78/79)
 * - Sensors (temperature, humidity, soil moisture, etc.)
 * 
 * Dependencies:
 * - RadioHead library (http://www.airspayce.com/mikem/arduino/RadioHead/)
 */

#include <SPI.h>
#include <RH_RF95.h>
#include <ArduinoJson.h>

// Pin definitions for LoRa module
#define RFM95_CS 10
#define RFM95_RST 9
#define RFM95_INT 2

// LoRa frequency - must match gateway configuration
#define RF95_FREQ 915.0

// Unique ID for this device
#define DEVICE_ID "arduino_sensor_1"
#define DEVICE_LOCATION "north_field"

// Sensor pins
#define TEMP_SENSOR_PIN A0
#define SOIL_MOISTURE_PIN A1

// Initialize RadioHead driver
RH_RF95 rf95(RFM95_CS, RFM95_INT);

// Time between transmissions (in milliseconds)
const long TRANSMIT_INTERVAL = 5 * 60 * 1000;  // 5 minutes
unsigned long lastTransmitTime = 0;

void setup() {
  // Initialize serial
  Serial.begin(9600);
  while (!Serial) delay(100);  // Wait for serial console (remove in battery operation)
  
  Serial.println("Arduino LoRa Farm IoT Sensor");
  
  // Initialize LoRa module
  pinMode(RFM95_RST, OUTPUT);
  digitalWrite(RFM95_RST, HIGH);
  
  // Manual reset
  digitalWrite(RFM95_RST, LOW);
  delay(10);
  digitalWrite(RFM95_RST, HIGH);
  delay(10);
  
  // Initialize radio
  if (!rf95.init()) {
    Serial.println("LoRa radio init failed");
    while (1);  // Don't proceed, loop forever
  }
  Serial.println("LoRa radio init OK!");
  
  // Set frequency
  if (!rf95.setFrequency(RF95_FREQ)) {
    Serial.println("setFrequency failed");
    while (1);
  }
  Serial.print("Set Freq to: "); Serial.println(RF95_FREQ);
  
  // Set transmitter power - can be from 5 to 23 dBm
  rf95.setTxPower(17);
  
  // Set up other LoRa parameters to match gateway settings
  // Defaults after init are: 434.0MHz, 13dBm, Bw = 125 kHz, Cr = 4/5, Sf = 128chips/symbol, CRC on
  
  Serial.println("Setup complete. Starting sensor readings...");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Check if it's time to send data
  if (currentTime - lastTransmitTime >= TRANSMIT_INTERVAL || lastTransmitTime == 0) {
    sendSensorData();
    lastTransmitTime = currentTime;
  }
  
  // Check for any incoming messages (if implementing bidirectional communication)
  if (rf95.available()) {
    uint8_t buf[RH_RF95_MAX_MESSAGE_LEN];
    uint8_t len = sizeof(buf);
    
    if (rf95.recv(buf, &len)) {
      Serial.print("Received: ");
      Serial.println((char*)buf);
      
      // Process command if needed
      processCommand((char*)buf);
    }
  }
  
  // Small delay to prevent excessive CPU usage
  delay(100);
}

void sendSensorData() {
  // Read sensor data
  float temperature = readTemperature();
  float soilMoisture = readSoilMoisture();
  
  // Create JSON document
  StaticJsonDocument<200> jsonDoc;
  
  // Add data to JSON document
  jsonDoc["device_id"] = DEVICE_ID;
  jsonDoc["location"] = DEVICE_LOCATION;
  jsonDoc["temperature"] = temperature;
  jsonDoc["soil_moisture"] = soilMoisture;
  jsonDoc["timestamp"] = getTimestamp();  // If no RTC, the gateway will add timestamp
  
  // Serialize JSON to string
  char jsonBuffer[200];
  serializeJson(jsonDoc, jsonBuffer);
  
  Serial.print("Sending data: ");
  Serial.println(jsonBuffer);
  
  // Send data via LoRa
  rf95.send((uint8_t*)jsonBuffer, strlen(jsonBuffer));
  rf95.waitPacketSent();
  
  // Optional - wait for a reply
  uint8_t buf[RH_RF95_MAX_MESSAGE_LEN];
  uint8_t len = sizeof(buf);
  
  if (rf95.waitAvailableTimeout(1000)) { 
    if (rf95.recv(buf, &len)) {
      Serial.print("Got reply: ");
      Serial.println((char*)buf);
      Serial.print("RSSI: ");
      Serial.println(rf95.lastRssi(), DEC);    
    } else {
      Serial.println("Receive failed");
    }
  } else {
    Serial.println("No reply received");
  }
}

// Read temperature from sensor
float readTemperature() {
  // Replace with your actual temperature sensor code
  int rawValue = analogRead(TEMP_SENSOR_PIN);
  
  // Example conversion for TMP36 sensor
  float voltage = rawValue * (5.0 / 1023.0);
  float temperatureC = (voltage - 0.5) * 100;
  
  return temperatureC;
}

// Read soil moisture from sensor
float readSoilMoisture() {
  // Replace with your actual soil moisture sensor code
  int rawValue = analogRead(SOIL_MOISTURE_PIN);
  
  // Example conversion (adjust based on your sensor)
  // Assuming 0 = completely dry, 1023 = completely wet
  float moisturePercentage = map(rawValue, 0, 1023, 0, 100);
  
  return moisturePercentage;
}

// Get timestamp (if you have an RTC module)
unsigned long getTimestamp() {
  // If you have a Real Time Clock module, add code to get timestamp
  // Otherwise, the gateway will add the timestamp
  return 0;  // Return 0 to signal gateway to add timestamp
}

// Process incoming commands
void processCommand(char* command) {
  // Example: processing JSON commands
  StaticJsonDocument<200> jsonDoc;
  DeserializationError error = deserializeJson(jsonDoc, command);
  
  if (error) {
    Serial.print("deserializeJson() failed: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Process commands based on the content
  if (jsonDoc.containsKey("command")) {
    const char* cmd = jsonDoc["command"];
    
    if (strcmp(cmd, "get_data") == 0) {
      // Send data immediately
      sendSensorData();
    }
    else if (strcmp(cmd, "set_interval") == 0) {
      // Change the transmit interval
      if (jsonDoc.containsKey("value")) {
        TRANSMIT_INTERVAL = jsonDoc["value"];
        Serial.print("New interval set: ");
        Serial.println(TRANSMIT_INTERVAL);
      }
    }
    // Add more commands as needed
  }
}