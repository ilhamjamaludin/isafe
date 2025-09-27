export type UserRole = 'admin' | 'worker' | 'viewer';

export interface CustomUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt: Date;
  // Worker-specific fields
  assignedSensorId?: string;  // ESP32 device ID that is assigned to this worker
  isActive?: boolean;         // Whether worker is currently active/working
  lastActiveTime?: Date;      // Last time worker was active
}

export interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Worker-Sensor Assignment
export interface WorkerSensorAssignment {
  id: string;
  workerId: string;
  workerEmail: string;
  workerName?: string;
  sensorId: string;
  assignedAt: Date;
  assignedBy: string; // Admin user ID who made the assignment
  isActive: boolean;
  notes?: string;
}

// Worker Activity Session
export interface WorkerActivitySession {
  id: string;
  workerId: string;
  workerEmail: string;
  sensorId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in milliseconds
  totalAlerts: number;
  safetyScore?: number; // calculated safety score for the session
  averagePostureAngle?: number;
  maxWeight?: number;
  environmentalData?: {
    avgTemperature: number;
    avgHumidity: number;
    avgPressure: number;
  };
}
