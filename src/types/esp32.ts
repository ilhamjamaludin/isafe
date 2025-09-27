export interface ESP32Actuators {
  blue: boolean;
  buzzer: boolean;
  green: boolean;
  red: boolean;
  vibration: boolean;
  yellow: boolean;
}

export interface BME680Data {
  gas_kohm: number;
  humidity_pct: number;
  pressure_hpa: number;
  temperature_c: number;
}

export interface EMGData {
  over_threshold: boolean;
  raw: number;
}

export interface IMUData {
  angle_duration_ms: number;
  angle_over_limit: boolean;
  pitch_deg: number;
  roll_deg: number;
}

export interface LoadcellData {
  overweight: boolean;
  weight_g: number;
}

export interface ESP32Sensors {
  bme680: BME680Data;
  emg: EMGData;
  imu: IMUData;
  loadcell: LoadcellData;
  ts: number; // timestamp
}

export interface ESP32Data {
  actuators: ESP32Actuators;
  sensors: ESP32Sensors;
}

export interface ESP32Registry {
  [deviceId: string]: boolean;
}

export interface ESP32LiveData {
  [deviceId: string]: ESP32Data;
}

export interface ESP32Status {
  deviceId: string;
  isOnline: boolean;
  lastSeen: number;
  data: ESP32Data;
}

// Historical data for Firestore
export interface SensorHistoryRecord {
  deviceId: string;
  timestamp: Date;
  sensors: ESP32Sensors;
  workerId?: string; // if assigned to a worker
}

export interface AlertRecord {
  id: string;
  deviceId: string;
  type: 'posture' | 'overweight' | 'emg' | 'environmental';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
  workerId?: string;
  sensorData: Partial<ESP32Sensors>;
}
