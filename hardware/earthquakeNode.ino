#include <Wire.h>
#include <MPU6050.h>
#include <WiFi.h>
#include <HTTPClient.h>

#define WIFI_SSID        "Chua_Deco"
#define WIFI_PASSWORD    "C@rd1nMig0"
#define SERVER_URL       "https://backend-production-f78d.up.railway.app/api/readings"

#define CHECK_WINDOW_MS  500
#define SEND_INTERVAL_MS 5000  // Send every 5 seconds for real-time monitoring
#define CALIBRATION_SAMPLES 100

MPU6050 mpu;

float baselineVib = 0;
unsigned long lastSendTime = 0;

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
  Wire.begin();
  
  Serial.println("Initializing MPU6050...");
  mpu.initialize();
  if (!mpu.testConnection()) {
    Serial.println("MPU6050 connection failed");
    while (1);
  }

  calibrate();
  connectWiFi();
}

float readVibration() {
  long maxMag = 0;
  unsigned long start = millis();
  while (millis() - start < CHECK_WINDOW_MS) {
    int16_t ax, ay, az, gx, gy, gz;
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
    long mag = abs(ax) + abs(ay) + abs(az);
    if (mag > maxMag) maxMag = mag;
    delay(10);
  }

  // Calculate vibration as the deviation from the baseline
  float currentVib = (float)maxMag - baselineVib;
  
  // Scale it to a 0-10 range for the backend
  float normalizedVib = (currentVib / 16384.0) * 5.0;
  
  if (normalizedVib < 0) normalizedVib = 0; // Ignore negative noise
  return normalizedVib;
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();

  float vib = readVibration();
  
  // Show in serial for debugging
  Serial.print("Current Vibration Level: ");
  Serial.println(vib);

  if (millis() - lastSendTime > SEND_INTERVAL_MS || vib > 2.0) {
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    // Manually building JSON string to avoid ArduinoJson dependency
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
