#include <WiFi.h>
#include <HTTPClient.h>

#define WIFI_SSID        "Chua_Deco"
#define WIFI_PASSWORD    "C@rd1nMig0"
#define SERVER_URL       "https://backend-production-f78d.up.railway.app/api/readings"

// Ultrasonic Sensor Pins
#define TRIG_PIN 5
#define ECHO_PIN 18
// Water Level Sensor Pin (Analog)
#define WATER_PIN 34

unsigned long lastSendTime = 0;
#define SEND_INTERVAL_MS 10000

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
}

float readDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH);
  float distance = duration * 0.034 / 2; // cm
  return distance;
}

int readWaterLevel() {
  return analogRead(WATER_PIN);
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();

  if (millis() - lastSendTime > SEND_INTERVAL_MS) {
    float dist = readDistance();
    int water = readWaterLevel();

    Serial.printf("Distance: %.2f cm, Water: %d\n", dist, water);

    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    // Manually building JSON string to avoid ArduinoJson dependency
    String json = "{\"node\":\"flood_node\",\"water\":" + String(water) + ",\"distance\":" + String(dist, 2) + "}";

    int httpResponseCode = http.POST(json);
    Serial.println("Response: " + String(httpResponseCode));
    http.end();
    
    lastSendTime = millis();
  }
}
