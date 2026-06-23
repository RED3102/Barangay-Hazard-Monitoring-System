// ============================================================
// FLOOD NODE — WiFi Version
// Combines HW-038 (touch) + HC-SR04 (proximity, 5ft mount)
// into a single 0-100% flood risk value sent as "water"
// ============================================================

#include <NewPing.h>
#include <WiFi.h>
#include <HTTPClient.h>

#define WIFI_SSID           "red"
#define WIFI_PASSWORD       "123red456"
#define SERVER_URL          "https://hazard-backend-8dtj.onrender.com/api/readings"

#define WATER_PWR           26
#define WATER_AO            34
#define TRIG                5
#define ECHO                18
#define MAX_DIST            400

// ── 5ft mounting profile ──────────────────────────────────
#define MOUNT_HEIGHT_CM      152   // 5ft — sensor height above normal water level
#define WARN_RISE_CM         91    // 3ft — water risen this much = warning band starts

// ── Risk percentage bands ─────────────────────────────────
// rise = 0cm              -> ~15%   (Safe:     10-20%)
// rise = WARN_RISE_CM     -> ~35%   (Warning:  30-40%)
// rise = MOUNT_HEIGHT_CM  -> 100%   (Critical: 50-100%)
#define SAFE_PERCENT         15.0
#define WARN_PERCENT         35.0
#define CRITICAL_PERCENT     100.0

#define WATER_THRESHOLD      30    // hazard trigger on combined flood risk %
#define DISTANCE_THRESHOLD   15    // legacy raw cm safety check (near-touch)
#define SEND_INTERVAL_MS     60000
#define COOLDOWN_MS          10000

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

// ── HW-038 — boosted sensitivity for small wetness ─────────
// sqrt curve makes small raw readings register meaningfully
// instead of being squashed near zero by a linear scale
float readWaterPercent() {
  digitalWrite(WATER_PWR, HIGH);
  delay(100);
  long total = 0;
  for (int i = 0; i < 20; i++) {
    total += analogRead(WATER_AO);
    delay(10);
  }
  digitalWrite(WATER_PWR, LOW);

  float average  = total / 20.0;
  float fraction = average / 4095.0;
  if (fraction < 0.0) fraction = 0.0;
  if (fraction > 1.0) fraction = 1.0;

  float boosted = sqrt(fraction) * 100.0;   // non-linear sensitivity boost
  return boosted;
}

// ── HC-SR04 raw distance reading (cm) ──────────────────────
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

// ── Convert distance -> flood risk % using 5ft mount profile ─
float distanceToPercent(float distanceCm) {
  if (distanceCm >= 999) return SAFE_PERCENT;  // sensor error, assume baseline

  float rise = MOUNT_HEIGHT_CM - distanceCm;
  if (rise < 0)               rise = 0;
  if (rise > MOUNT_HEIGHT_CM) rise = MOUNT_HEIGHT_CM;

  if (rise <= WARN_RISE_CM) {
    // Safe -> Warning band
    return SAFE_PERCENT + (rise / WARN_RISE_CM) * (WARN_PERCENT - SAFE_PERCENT);
  } else {
    // Warning -> Critical band
    float remainingRise  = rise - WARN_RISE_CM;
    float remainingRange = MOUNT_HEIGHT_CM - WARN_RISE_CM;
    return WARN_PERCENT + (remainingRise / remainingRange) * (CRITICAL_PERCENT - WARN_PERCENT);
  }
}

void sendData(float floodRisk, float distance, String hazard) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost. Reconnecting...");
    connectWiFi();
  }

  String payload = "{\"node\":\"flood_node\","
    "\"water\":"     + String(floodRisk, 1) +
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
  Serial.println("Mount height: " + String(MOUNT_HEIGHT_CM) + "cm (5ft)");
  connectWiFi();
  Serial.println("SYSTEM READY");
}

void loop() {
  float waterPercent    = readWaterPercent();
  float distance        = readDistance();
  float distancePercent = distanceToPercent(distance);

  // Combined flood risk — either sensor crossing into danger raises the value
  float floodRisk = max(waterPercent, distancePercent);

  Serial.print("HW-038: ");
  Serial.print(waterPercent, 1);
  Serial.print("% | Distance: ");
  Serial.print(distance, 1);
  Serial.print("cm (");
  Serial.print(distancePercent, 1);
  Serial.print("%) | Combined Flood Risk: ");
  Serial.print(floodRisk, 1);
  Serial.println("%");

  String hazard = "none";
  if (floodRisk > WATER_THRESHOLD || distance < DISTANCE_THRESHOLD)
    hazard = "flood";

  unsigned long now = millis();

  if (hazard != "none" && (now - lastHazardTime >= COOLDOWN_MS)) {
    Serial.println("*** HAZARD: flood ***");
    sendData(floodRisk, distance, hazard);
    lastHazardTime = now;
    lastSendTime   = now;
  } else if (hazard == "none" && (now - lastSendTime >= SEND_INTERVAL_MS)) {
    Serial.println("Scheduled heartbeat");
    sendData(floodRisk, distance, hazard);
    lastSendTime = now;
  }
}