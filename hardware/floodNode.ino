// FLOOD NODE — WiFi Version (Updated)
// ============================================================
 
#include <NewPing.h>
#include <WiFi.h>
#include <HTTPClient.h>
 
#define WIFI_SSID           "Chua_Deco"
#define WIFI_PASSWORD       "C@rd1nMig0"
#define SERVER_URL          "https://hazard-backend-8dtj.onrender.com/api/readings"
 
#define WATER_PWR           26
#define WATER_AO            34
#define TRIG                5
#define ECHO                18
#define MAX_DIST            400
 
#define WATER_THRESHOLD     30    // 30% submersion = flood warning
#define DISTANCE_THRESHOLD  15    // cm
#define SEND_INTERVAL_MS    60000
#define COOLDOWN_MS         10000
 
NewPing sonar(TRIG, ECHO, MAX_DIST);
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
 
float readWater() {
  digitalWrite(WATER_PWR, HIGH);
  delay(100);
  long total = 0;
  for (int i = 0; i < 20; i++) {
    total += analogRead(WATER_AO);
    delay(10);
  }
  digitalWrite(WATER_PWR, LOW);
  float average    = total / 20.0;
  float normalized = (average / 4095.0) * 100.0;
  if (normalized < 0.0)   normalized = 0.0;
  if (normalized > 100.0) normalized = 100.0;
  return normalized;
}
 
float readDistance() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long duration = pulseIn(ECHO, HIGH);
  float dist = duration * 0.034 / 2;
  if (dist <= 0 || dist > 400) return 999;
  return dist;
}
 
void sendData(float water, float distance, String hazard) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost. Reconnecting...");
    connectWiFi();
  }
  String payload = "{\"node\":\"flood_node\","
    "\"water\":"     + String(water, 1) +
    ",\"smoke\":0"
    ",\"distance\":" + String(distance, 1) +
    ",\"vib\":0,\"temperature\":0"
    ",\"hazard\":\""  + hazard + "\"}";
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
  pinMode(WATER_PWR, OUTPUT);
  digitalWrite(WATER_PWR, LOW);
  Serial.println("=== FLOOD NODE START ===");
  connectWiFi();
  Serial.println("SYSTEM READY");
}
 
void loop() {
  float water    = readWater();
  float distance = readDistance();
  Serial.print("Water: ");
  Serial.print(water, 1);
  Serial.print("% | Distance: ");
  Serial.print(distance, 1);
  Serial.println(" cm");
  String hazard = "none";
  if (water > WATER_THRESHOLD || distance < DISTANCE_THRESHOLD)
    hazard = "flood";
  unsigned long now = millis();
  if (hazard != "none" && (now - lastHazardTime >= COOLDOWN_MS)) {
    Serial.println("*** HAZARD: flood ***");
    sendData(water, distance, hazard);
    lastHazardTime = now;
    lastSendTime   = now;
  } else if (hazard == "none" && (now - lastSendTime >= SEND_INTERVAL_MS)) {
    Serial.println("Scheduled heartbeat");
    sendData(water, distance, hazard);
    lastSendTime = now;
  }
}