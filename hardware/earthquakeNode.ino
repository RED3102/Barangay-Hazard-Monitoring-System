// EARTHQUAKE NODE — WiFi Version (Updated)
// ============================================================
 
#include <Wire.h>
#include <MPU6050.h>
#include <WiFi.h>
#include <HTTPClient.h>
 
#define WIFI_SSID           "Chua_Deco"
#define WIFI_PASSWORD       "C@rd1nMig0"
#define SERVER_URL          "https://hazard-backend-8dtj.onrender.com/api/readings"
 
#define CHECK_WINDOW_MS     500
#define SEND_INTERVAL_MS    60000
#define COOLDOWN_MS         10000
#define CALIBRATION_SAMPLES 100
 
MPU6050 mpu;
 
float         baselineVib = 0;
unsigned long lastSendTime   = 0;
unsigned long lastHazardTime = 0;
 
void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (millis() - start > 15000) {
      Serial.println("\nWiFi timeout. Restarting...");
      ESP.restart();
    }
  }
  Serial.println("\nWiFi connected! IP: " + WiFi.localIP().toString());
}
 
void calibrate() {
  Serial.println("Calibrating — keep sensor still...");
  long sumMag = 0;
  for (int i = 0; i < CALIBRATION_SAMPLES; i++) {
    int16_t ax, ay, az, gx, gy, gz;
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
    sumMag += (abs(ax) + abs(ay) + abs(az));
    delay(20);
  }
  baselineVib = (float)sumMag / CALIBRATION_SAMPLES;
  Serial.print("Baseline set: ");
  Serial.println(baselineVib);
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
  float delta = (float)maxMag - baselineVib;
  if (delta < 3000) return 0.0;
  float vib = (delta / 40000.0) * 5.0;
  if (vib > 5.0) vib = 5.0;
  return vib;
}
 
void sendData(float vib, String hazard) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost. Reconnecting...");
    connectWiFi();
  }
  String payload =
    "{\"node\":\"earthquake_node\","
    "\"water\":0,\"smoke\":0,\"distance\":0,"
    "\"vib\":"         + String(vib, 2) +
    ",\"temperature\":0"
    ",\"hazard\":\""   + hazard + "\"}";
  Serial.println("Sending: " + payload);
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  int responseCode = http.POST(payload);
  if (responseCode > 0) {
    Serial.println("Response: " + String(responseCode));
    Serial.println(http.getString());
  } else {
    Serial.println("HTTP Error: " + String(responseCode));
  }
  http.end();
}
 
void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  mpu.initialize();
  if (mpu.testConnection()) {
    Serial.println("MPU-6050 connected");
    calibrate();
  } else {
    Serial.println("MPU-6050 not found — check wiring");
  }
  Serial.println("=== EARTHQUAKE NODE START ===");
  connectWiFi();
  Serial.println("SYSTEM READY");
}
 
void loop() {
  float vib     = readVibration();
  String hazard = (vib >= 3.0) ? "earthquake" : "none";
 
  Serial.print("VIB: ");
  Serial.println(vib, 2);
 
  unsigned long now = millis();
 
  if (hazard == "earthquake" && (now - lastHazardTime >= COOLDOWN_MS)) {
    Serial.println("*** EARTHQUAKE DETECTED ***");
    sendData(vib, hazard);
    lastHazardTime = now;
    lastSendTime   = now;
  } else if (hazard == "none" && (now - lastSendTime >= SEND_INTERVAL_MS)) {
    Serial.println("Scheduled heartbeat");
    sendData(vib, hazard);
    lastSendTime = now;
  }
}
 