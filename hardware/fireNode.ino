#include <WiFi.h>
#include <HTTPClient.h>

#define WIFI_SSID        "Chua_Deco"
#define WIFI_PASSWORD    "C@rd1nMig0"
#define SERVER_URL       "https://backend-production-f78d.up.railway.app/api/readings"

// Gas Sensor (Smoke) Pin
#define SMOKE_PIN 35

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

float readTemperature() {
  // Replace with DHT11/22 code if using external sensor
  return 25.0 + (random(0, 100) / 10.0); 
}

int readSmoke() {
  return analogRead(SMOKE_PIN);
}

void setup() {
  Serial.begin(115200);
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();

  if (millis() - lastSendTime > SEND_INTERVAL_MS) {
    int smoke = readSmoke();
    float temp = readTemperature();

    Serial.printf("Smoke: %d, Temp: %.2f\n", smoke, temp);

    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    // Manually building JSON string to avoid ArduinoJson dependency
    String json = "{\"node\":\"fire_node\",\"smoke\":" + String(smoke) + ",\"temperature\":" + String(temp, 2) + "}";

    int httpResponseCode = http.POST(json);
    Serial.println("Response: " + String(httpResponseCode));
    http.end();
    
    lastSendTime = millis();
  }
}