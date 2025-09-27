#include <WiFi.h>
#include <Wire.h>
#include <math.h>

#include <MPU9250_asukiaaa.h>
#include "HX711.h"
#include <Adafruit_Sensor.h>
#include "Adafruit_BME680.h"

// ===== Firebase =====
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"   // tokenStatusCallback
#include "addons/RTDBHelper.h"

// ==== WIFI & FIREBASE CREDENTIALS (ISI SENDIRI) ====
#define WIFI_SSID       "ASEPTAMPAN"
#define WIFI_PASSWORD   "asep123456"

#define API_KEY         "AIzaSyCQPMRnA6WF_wGAKN73D1mTU6B01KO7-3E"
#define DATABASE_URL    "https://isafeunej-default-rtdb.asia-southeast1.firebasedatabase.app"

// ===== Device ID / path =====
const char* DEVICE_ID = "esp32-01";
String liveBase = String("/live/") + DEVICE_ID;

// ===== Firebase objects =====
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ====== Sensor objects ======
Adafruit_BME680 bme;
MPU9250_asukiaaa mySensor;
HX711 scale;

// ====== Kalibrasi & status ======
float calibration_factor = -7050.0f;
float pitchOffset = 0.0f, rollOffset = 0.0f;
bool calibrated = false;

// ====== Pin mapping ======
#define DT_PIN       18   // HX711 DOUT
#define SCK_PIN      19   // HX711 SCK
#define EMG_PIN       2
#define RED_LED      14
#define BLUE_LED     27
#define YELLOW_LED   26
#define GREEN_LED    25
#define VIBRATION    33
#define BUZZER        4

// ====== Timer & ambang ======
unsigned long angleStartTime = 0;
bool angleTimerRunning = false;
const unsigned long angleDurationLimit = 25UL * 60UL * 1000UL; // 25 menit
const int emgThreshold = 700;

// ====== Variabel runtime untuk publish ======
float lastPitchRel = 0, lastRollRel = 0;
bool angleOverLimit = false;
unsigned long angleDurationMs = 0;

float lastWeight = 0;
bool overweight = false;

float lastTemp = 0, lastHum = 0, lastPress = 0, lastGasKOhm = 0;

int lastEMGRaw = 0;
bool emgOver = false;

// status aktuator (sinkron dengan digitalWrite)
bool redOn=false, blueOn=false, yellowOn=false, greenOn=false, buzzerOn=false, vibrationOn=false;

// ====== Prototipe ======
void HX711_Read();
void MPU9250_Read();
void BME680_Read();
void EMG_Read();
void updateActuators();
void publishRegistryOnce();
void publishLiveIfDue();

// publish interval
const unsigned long UPDATE_INTERVAL_MS = 1000;
unsigned long lastUpdateMs = 0;

void setActuator(int pin, bool on, bool &shadowVar) {
  digitalWrite(pin, on ? HIGH : LOW);
  shadowVar = on;
}

void setup() {
  Wire.begin();
  Serial.begin(115200);

  pinMode(EMG_PIN, INPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BLUE_LED, OUTPUT);
  pinMode(YELLOW_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(VIBRATION, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  // Matikan semua aktuator di awal
  setActuator(RED_LED, LOW, redOn);
  setActuator(BLUE_LED, LOW, blueOn);
  setActuator(YELLOW_LED, LOW, yellowOn);
  setActuator(GREEN_LED, LOW, greenOn);
  setActuator(VIBRATION, LOW, vibrationOn);
  setActuator(BUZZER, LOW, buzzerOn);

  // HX711
  scale.begin(DT_PIN, SCK_PIN);
  scale.set_scale(calibration_factor);
  scale.tare(); // nol-kan timbangan

  // MPU9250
  mySensor.setWire(&Wire);
  mySensor.beginAccel();
  mySensor.beginGyro();

  delay(2000);

  // BME680
  if (!bme.begin()) {
    Serial.println("BME680 tidak ditemukan, cek koneksi!");
    while (1) { delay(10); }
  }
  bme.setTemperatureOversampling(BME680_OS_8X);
  bme.setHumidityOversampling(BME680_OS_2X);
  bme.setPressureOversampling(BME680_OS_4X);
  bme.setIIRFilterSize(BME680_FILTER_SIZE_3);
  bme.setGasHeater(320, 150); // 320°C selama 150 ms

  angleStartTime = 0;
  angleTimerRunning = false;

  // ===== WiFi =====
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Menghubungkan WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.print("\nWiFi OK, IP: ");
  Serial.println(WiFi.localIP());

  // ===== Firebase setup =====
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // Anonymous sign-in
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase anonymous sign-up OK");
  } else {
    Serial.printf("SignUp gagal, alasan: %s\n", config.signer.signupError.message.c_str());
  }
  config.token_status_callback = tokenStatusCallback;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // registry/<device> = true
  publishRegistryOnce();

  Serial.println("Setup selesai.");
}

void loop() {
  HX711_Read();
  MPU9250_Read();
  BME680_Read();
  EMG_Read();

  publishLiveIfDue();

  delay(10);
}

// ====== MPU9250: postur/angle ======
void MPU9250_Read() {
  mySensor.accelUpdate();
  mySensor.gyroUpdate();

  float ax = mySensor.accelX();
  float ay = mySensor.accelY();
  float az = mySensor.accelZ();

  // perhitungan sudut (derajat)
  float pitch = atan2f(-ax, sqrtf(ay * ay + az * az)) * 180.0f / PI;
  float roll  = atan2f(ay, az) * 180.0f / PI;

  if (!calibrated) {
    pitchOffset = pitch;
    rollOffset = roll;
    calibrated = true;
    Serial.println("Kalibrasi selesai, posisi awal = 0°");
  }

  lastPitchRel = pitch - pitchOffset;
  lastRollRel  = roll  - rollOffset;

  Serial.print("Pitch (menunduk): ");
  Serial.print(lastPitchRel, 2);
  Serial.print(" °  |  Roll: ");
  Serial.print(lastRollRel, 2);
  Serial.println(" °");

  angleOverLimit = (fabsf(lastPitchRel) > 45.0f) || (fabsf(lastRollRel) > 45.0f);
  if (angleOverLimit) {
    setActuator(BLUE_LED, HIGH, blueOn);
    if (!angleTimerRunning) {
      angleStartTime = millis();
      angleTimerRunning = true;
    }
    angleDurationMs = millis() - angleStartTime;

    if (angleDurationMs >= angleDurationLimit) {
      setActuator(BUZZER, HIGH, buzzerOn);
      setActuator(VIBRATION, HIGH, vibrationOn);
    }
  } else {
    setActuator(BLUE_LED, LOW, blueOn);
    setActuator(BUZZER, LOW, buzzerOn);
    setActuator(VIBRATION, LOW, vibrationOn);
    angleTimerRunning = false;
    angleDurationMs = 0;
  }
}

// ====== BME680: lingkungan ======
void BME680_Read() {
  if (!bme.performReading()) {
    Serial.println("Gagal baca data BME680");
    return;
  }

  lastTemp = bme.temperature;
  lastHum = bme.humidity;
  lastPress = bme.pressure / 100.0;
  lastGasKOhm = bme.gas_resistance / 1000.0;

  Serial.print("Suhu: ");
  Serial.print(lastTemp);
  Serial.println(" *C");

  Serial.print("Kelembaban: ");
  Serial.print(lastHum);
  Serial.println(" %");

  Serial.print("Tekanan: ");
  Serial.print(lastPress);
  Serial.println(" hPa");

  Serial.print("Gas Resistance: ");
  Serial.print(lastGasKOhm);
  Serial.println(" KOhms");

  // LED hijau menyala bila suhu sekitar 37.0±0.5 °C
  setActuator(GREEN_LED, (fabsf(lastTemp - 37.0f) <= 0.5f), greenOn);
}

// ====== HX711: berat ======
void HX711_Read() {
  if (!scale.is_ready()) {
    // sensor belum siap, lewati siklus ini
    return;
  }

  long rawData = scale.read();      // jika butuh debug raw
  (void)rawData;                    // hindari warning
  lastWeight = scale.get_units(10); // rata-rata 10 bacaan

  Serial.print("Berat: ");
  Serial.print(lastWeight, 2);
  Serial.println(" gram");

  // LED merah jika >= 27000 gram (27 kg)
  overweight = (lastWeight >= 27000.0f);
  setActuator(RED_LED, overweight, redOn);
}

// ====== EMG: aktivitas otot ======
void EMG_Read() {
  lastEMGRaw = analogRead(EMG_PIN);
  Serial.print("EMG: ");
  Serial.println(lastEMGRaw);

  emgOver = (lastEMGRaw > emgThreshold);
  setActuator(YELLOW_LED, emgOver, yellowOn);
}

// ====== Publish ke Firebase ======
void publishRegistryOnce() {
  String regPath = String("/registry/") + DEVICE_ID;
  if (Firebase.ready()) {
    if (!Firebase.RTDB.setBool(&fbdo, regPath.c_str(), true)) {
      Serial.printf("Gagal set registry: %s\n", fbdo.errorReason().c_str());
    } else {
      Serial.println("Registry updated: true");
    }
  }
}

void publishLiveIfDue() {
  unsigned long now = millis();
  if (now - lastUpdateMs < UPDATE_INTERVAL_MS) return;
  lastUpdateMs = now;

  if (!Firebase.ready()) return;

  // siapkan JSON sesuai struktur yang diminta
  FirebaseJson root;
  root.set("ts", (int64_t) now);

  FirebaseJson imu;
  imu.set("pitch_deg", lastPitchRel);
  imu.set("roll_deg", lastRollRel);
  imu.set("angle_over_limit", angleOverLimit);
  imu.set("angle_duration_ms", (int64_t) angleDurationMs);
  root.set("sensors/imu", imu);

  FirebaseJson lc;
  lc.set("weight_g", lastWeight);
  lc.set("overweight", overweight);
  root.set("sensors/loadcell", lc);

  FirebaseJson bmej;
  bmej.set("temperature_c", lastTemp);
  bmej.set("humidity_pct", lastHum);
  bmej.set("pressure_hpa", lastPress);
  bmej.set("gas_kohm", lastGasKOhm);
  root.set("sensors/bme680", bmej);

  FirebaseJson emg;
  emg.set("raw", lastEMGRaw);
  emg.set("over_threshold", emgOver);
  root.set("sensors/emg", emg);

  FirebaseJson act;
  act.set("red", redOn);
  act.set("blue", blueOn);
  act.set("yellow", yellowOn);
  act.set("green", greenOn);
  act.set("buzzer", buzzerOn);
  act.set("vibration", vibrationOn);
  root.set("actuators", act);

  // kirim ke /live/<device-id>
  String livePath = liveBase; // "/live/esp32-01"
  if (!Firebase.RTDB.setJSON(&fbdo, livePath.c_str(), &root)) {
    Serial.printf("Gagal update live: %s\n", fbdo.errorReason().c_str());
  } else {
    Serial.println("Live updated");
  }
}
