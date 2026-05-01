#include <Wire.h>
#include <MPU6050.h>
#include <WiFi.h>
#include <HTTPClient.h>

#define WIFI_SSID        "Chua_Deco"
#define WIFI_PASSWORD    "C@rd1nMig0"
#define SERVER_URL       "https://backend-production-f78d.up.railway.app/api/readings"

#define CHECK_WINDOW_MS  500
#define SEND_INTERVAL_MS 5000  
#define CALIBRATION_SAMPLES 100

MPU6050 mpu;

float baselineVib = 0;
unsigned long lastSendTime = 0;
bool sensorFound = false;

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected! IP: " + WiFi.localIP().toString());
}

void calibrate() {
  Serial.println("Calibrating sensor... Keep it steady on the table.");
  long sumMag = 0;
  for (int i = 0; i < CALIBRATION_SAMPLES; i++) {
    int16_t ax, ay, az, gx, gy, gz;
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
    sumMag += (abs(ax) + abs(ay) + abs(az));
    delay(20);
  }
  baselineVib = (float)sumMag / CALIBRATION_SAMPLES;
  Serial.print("Baseline vibration (gravity + noise) detected: ");
  Serial.println(baselineVib);
}

void setup() {
  Serial.begin(115200);
  delay(1000); 
  Serial.println("\n--- Earthquake Node Starting ---");
  
  Wire.begin(21, 22);
  
  Serial.println("Checking MPU6050 connection...");
  mpu.initialize();
  
  if (mpu.testConnection()) {
    Serial.println("SUCCESS: MPU6050 found!");
    sensorFound = true;
    calibrate();
  } else {
    Serial.println("WARNING: Sensor NOT FOUND. Entering Timed Demo Mode.");
    baselineVib = 16384.0;
  }

  connectWiFi();
}

float readVibration() {
  if (!sensorFound) return 0; // Handled in loop demo
  
  long maxMag = 0;
  unsigned long start = millis();
  while (millis() - start < CHECK_WINDOW_MS) {
    int16_t ax, ay, az, gx, gy, gz;
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
    long mag = abs(ax) + abs(ay) + abs(az);
    if (mag > maxMag) maxMag = mag;
    delay(10);
  }

  float currentVib = (float)maxMag - baselineVib;
  float normalizedVib = (currentVib / 16384.0) * 5.0;
  if (normalizedVib < 0) normalizedVib = 0; 
  return normalizedVib;
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();

  // HANDS-FREE DEMO LOGIC (5-minute cycle)
  // 0-3 mins: Safe
  // 3-4 mins: EARTHQUAKE
  // 4-5 mins: Safe
  unsigned long currentMillis = millis();
  unsigned long cycleTime = currentMillis % 300000; 
  
  float vib = 0;
  bool isEarthquakeWindow = (cycleTime > 180000 && cycleTime < 240000);

  if (sensorFound) {
    vib = readVibration();
  }

  // Override with demo data if sensor is missing or if we are in the earthquake window
  if (!sensorFound || isEarthquakeWindow) {
    if (isEarthquakeWindow) {
      // Simulated Earthquake (High Risk)
      vib = 8.50 + (random(0, 100) / 100.0);
      if (currentMillis % 1000 < 100) Serial.println("!!! DEMO: SIMULATING EARTHQUAKE !!!");
    } else {
      // Simulated Safe Baseline
      vib = 0.35 + (random(0, 20) / 100.0);
    }
  }

  if (millis() - lastSendTime > SEND_INTERVAL_MS || vib > 2.0) {
    Serial.print("Current Vibration Level: ");
    Serial.println(vib);

    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    String json = "{\"node\":\"earthquake_node\",\"vib\":" + String(vib, 2) + "}";

    int httpResponseCode = http.POST(json);
    if (httpResponseCode > 0) {
      Serial.print("Data sent, response: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Error sending data: ");
      Serial.println(httpResponseCode);
    }
    http.end();
    lastSendTime = millis();
  }
}
