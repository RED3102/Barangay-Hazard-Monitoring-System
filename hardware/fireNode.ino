// FIRE NODE — WiFi Version (Updated — supports unique NODE_ID)
// Change NODE_ID for each unit deployed in a different home
// ============================================================
 
#include <DHT.h>
#include <WiFi.h>
#include <HTTPClient.h>
 
// ---- CHANGE THIS FOR EACH HOME ----
#define NODE_ID             "fire_node_001"
// Examples:
//   "fire_node_001"  — House 1
//   "fire_node_002"  — House 2
//   "fire_node_blk4_lot12" — Block 4, Lot 12
// -----------------------------------
 
#define WIFI_SSID           "Chua_Deco_IoT"
#define WIFI_PASSWORD       "C@rd1nMig0"
#define SERVER_URL          "https://hazard-backend-8dtj.onrender.com/api/readings"
 
#define MQ2_PIN             35
#define DHTPIN              4
#define DHTTYPE             DHT22
#define SMOKE_THRESHOLD     100
#define TEMP_THRESHOLD      40
#define SEND_INTERVAL_MS    60000
#define COOLDOWN_MS         10000
 
DHT dht(DHTPIN, DHTTYPE);
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
 
int readSmoke() {
  int total = 0;
  for (int i = 0; i < 10; i++) {
    total += analogRead(MQ2_PIN);
    delay(10);
  }
  return total / 10;
}
 
float readTemperature() {
  float temp = dht.readTemperature();
  if (isnan(temp)) return 0;
  return temp;
}
 
void sendData(int smoke, float temperature, String hazard) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost. Reconnecting...");
    connectWiFi();
  }
  String payload = "{\"node\":\"" + String(NODE_ID) + "\",\"water\":0"
    ",\"smoke\":"       + String(smoke) +
    ",\"distance\":0,\"vib\":0"
    ",\"temperature\":" + String(temperature) +
    ",\"hazard\":\""    + hazard + "\"}";
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
  dht.begin();
  Serial.println("=== FIRE NODE START === ID: " + String(NODE_ID));
  connectWiFi();
  Serial.println("SYSTEM READY");
}
 
void loop() {
  int   smoke       = readSmoke();
  float temperature = readTemperature();
  String hazard = "none";
  if (temperature > 60 || smoke > 300) {
    hazard = "fire";
  } else if (temperature > TEMP_THRESHOLD || smoke > SMOKE_THRESHOLD) {
    hazard = "fire";
  }
  unsigned long now = millis();
  if (hazard != "none" && (now - lastHazardTime >= COOLDOWN_MS)) {
    Serial.println("*** FIRE HAZARD DETECTED ***");
    Serial.println("  Node:        " + String(NODE_ID));
    Serial.println("  Smoke:       " + String(smoke));
    Serial.println("  Temperature: " + String(temperature) + " C");
    sendData(smoke, temperature, hazard);
    lastHazardTime = now;
    lastSendTime   = now;
  } else if (hazard == "none" && (now - lastSendTime >= SEND_INTERVAL_MS)) {
    Serial.println("Heartbeat | Node: " + String(NODE_ID) +
                   " | Smoke: " + String(smoke) +
                   " | Temp: " + String(temperature) + " C");
    sendData(smoke, temperature, hazard);
    lastSendTime = now;
  }
}