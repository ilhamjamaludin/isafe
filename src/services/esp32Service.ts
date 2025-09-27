'use client';

import { ref, onValue, off, set } from 'firebase/database';
import { collection, addDoc, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { realtimeDb, db } from '@/lib/firebase';
import { ESP32LiveData, ESP32Status, SensorHistoryRecord, AlertRecord, ESP32Data } from '@/types/esp32';
import { WorkerSensorService } from './workerSensorService';

export class ESP32Service {
  private listeners: Map<string, () => void> = new Map();
  private workerSensorService: WorkerSensorService;

  constructor() {
    this.workerSensorService = new WorkerSensorService();
  }

  // Utility function to remove undefined values from objects before Firestore save
  private cleanDataForFirestore(data: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
  }

  // Listen to all live ESP32 data
  subscribeToLiveData(callback: (data: ESP32Status[]) => void): () => void {
    const liveRef = ref(realtimeDb, 'live');
    const registryRef = ref(realtimeDb, 'registry');
    
    const unsubscribeLive = onValue(liveRef, (snapshot) => {
      const liveData: ESP32LiveData = snapshot.val() || {};
      
      // Also get registry status
      onValue(registryRef, (registrySnapshot) => {
        const registry = registrySnapshot.val() || {};
        
        const esp32Statuses: ESP32Status[] = Object.keys(liveData).map(deviceId => ({
          deviceId,
          isOnline: registry[deviceId] || false,
          lastSeen: liveData[deviceId]?.sensors?.ts || 0,
          data: liveData[deviceId]
        }));
        
        callback(esp32Statuses);
      });
    });

    return () => {
      off(liveRef);
      off(registryRef);
    };
  }

  // Listen to specific device
  subscribeToDevice(deviceId: string, callback: (status: ESP32Status | null) => void): () => void {
    const deviceRef = ref(realtimeDb, `live/${deviceId}`);
    const registryRef = ref(realtimeDb, `registry/${deviceId}`);
    
    let deviceData: ESP32Data | null = null;
    let isOnline = false;
    
    const updateCallback = () => {
      if (deviceData) {
        callback({
          deviceId,
          isOnline,
          lastSeen: deviceData.sensors.ts,
          data: deviceData
        });
      } else {
        callback(null);
      }
    };

    const unsubscribeDevice = onValue(deviceRef, (snapshot) => {
      deviceData = snapshot.val();
      updateCallback();
    });

    const unsubscribeRegistry = onValue(registryRef, (snapshot) => {
      isOnline = snapshot.val() || false;
      updateCallback();
    });

    return () => {
      off(deviceRef);
      off(registryRef);
    };
  }

  // Control actuators
  async setActuator(deviceId: string, actuator: string, value: boolean): Promise<void> {
    const actuatorRef = ref(realtimeDb, `live/${deviceId}/actuators/${actuator}`);
    await set(actuatorRef, value);
  }

  // Save sensor data to Firestore for historical analysis
  async saveSensorHistory(deviceId: string, data: ESP32Data, workerId?: string): Promise<void> {
    // Validate data before processing
    if (!data || !data.sensors) {
      console.warn('Invalid ESP32 data provided for history:', data);
      return;
    }

    const historyRecord: Omit<SensorHistoryRecord, 'timestamp'> & { timestamp: Timestamp } = {
      deviceId,
      timestamp: Timestamp.now(),
      sensors: data.sensors,
      workerId
    };

    await addDoc(collection(db, 'sensorHistory'), 
      this.cleanDataForFirestore(historyRecord)
    );
    
    // If there's a worker assigned, also save to worker-specific history
    if (workerId) {
      try {
        await this.workerSensorService.saveSensorDataForWorker(workerId, deviceId, data);
      } catch (error) {
        console.error('Error saving worker sensor data:', error);
      }
    }
  }

  // Check and save data for active worker assignments
  async processWorkerSensorData(devices: ESP32Status[]): Promise<void> {
    try {
      // Get all active assignments
      const activeAssignments = await this.workerSensorService.getAllActiveAssignments();
      
      for (const assignment of activeAssignments) {
        const sensorDevice = devices.find(d => d.deviceId === assignment.sensorId);
        
        if (sensorDevice && sensorDevice.isOnline && sensorDevice.data) {
          // Save sensor data with worker context
          await this.workerSensorService.saveSensorDataForWorker(
            assignment.workerId,
            sensorDevice.deviceId, // Pass actual ESP32 device ID
            sensorDevice.data
          );
          
          // Generate alerts for this worker
          await this.checkAndCreateAlerts(
            assignment.sensorId,
            sensorDevice.data,
            assignment.workerId
          );
        }
      }
    } catch (error) {
      console.error('Error processing worker sensor data:', error);
    }
  }

  // Generate alerts based on sensor data
  async checkAndCreateAlerts(deviceId: string, data: ESP32Data, workerId?: string): Promise<AlertRecord[]> {
    const alerts: AlertRecord[] = [];
    const now = new Date();

    // Validate sensor data
    if (!data || !data.sensors) {
      console.warn('Invalid ESP32 data provided for alerts:', data);
      return alerts;
    }

    // Posture alert (IMU)
    if (data.sensors.imu?.angle_over_limit) {
      alerts.push({
        id: `${deviceId}-posture-${now.getTime()}`,
        deviceId,
        type: 'posture',
        severity: (data.sensors.imu.angle_duration_ms || 0) > 300000 ? 'critical' : 'high', // 5 minutes
        title: 'Poor Posture Detected',
        description: `Device ${deviceId} detected poor posture. Angle duration: ${Math.round((data.sensors.imu.angle_duration_ms || 0) / 1000)}s`,
        timestamp: now,
        resolved: false,
        workerId,
        sensorData: { imu: data.sensors.imu }
      });
    }

    // Overweight alert
    if (data.sensors.loadcell?.overweight) {
      alerts.push({
        id: `${deviceId}-overweight-${now.getTime()}`,
        deviceId,
        type: 'overweight',
        severity: 'high',
        title: 'Overweight Detected',
        description: `Device ${deviceId} detected overweight condition. Weight: ${data.sensors.loadcell.weight_g || 'N/A'}g`,
        timestamp: now,
        resolved: false,
        workerId,
        sensorData: { loadcell: data.sensors.loadcell }
      });
    }

    // EMG alert
    if (data.sensors.emg?.over_threshold) {
      alerts.push({
        id: `${deviceId}-emg-${now.getTime()}`,
        deviceId,
        type: 'emg',
        severity: 'medium',
        title: 'High Muscle Activity',
        description: `Device ${deviceId} detected high EMG activity. Raw value: ${data.sensors.emg.raw || 'N/A'}`,
        timestamp: now,
        resolved: false,
        workerId,
        sensorData: { emg: data.sensors.emg }
      });
    }

    // Environmental alerts
    const temp = data.sensors.bme680?.temperature_c;
    const humidity = data.sensors.bme680?.humidity_pct;
    
    if (temp !== undefined && (temp > 35 || temp < 15)) {
      alerts.push({
        id: `${deviceId}-temp-${now.getTime()}`,
        deviceId,
        type: 'environmental',
        severity: temp > 40 || temp < 10 ? 'high' : 'medium',
        title: 'Temperature Alert',
        description: `Device ${deviceId} detected extreme temperature: ${temp.toFixed(1)}°C`,
        timestamp: now,
        resolved: false,
        workerId,
        sensorData: { bme680: data.sensors.bme680 }
      });
    }

    if (humidity !== undefined && (humidity > 80 || humidity < 20)) {
      alerts.push({
        id: `${deviceId}-humidity-${now.getTime()}`,
        deviceId,
        type: 'environmental',
        severity: 'low',
        title: 'Humidity Alert',
        description: `Device ${deviceId} detected extreme humidity: ${humidity.toFixed(1)}%`,
        timestamp: now,
        resolved: false,
        workerId,
        sensorData: { bme680: data.sensors.bme680 }
      });
    }

    // Save alerts to Firestore
    for (const alert of alerts) {
      await addDoc(collection(db, 'alerts'), 
        this.cleanDataForFirestore({
          ...alert,
          timestamp: Timestamp.fromDate(alert.timestamp)
        })
      );
    }

    return alerts;
  }

  // Get historical data
  async getHistoricalData(deviceId?: string, limit_count = 100): Promise<SensorHistoryRecord[]> {
    try {
      let q;
      
      if (deviceId) {
        // Simple query without orderBy to avoid composite index requirement
        q = query(
          collection(db, 'sensorHistory'),
          where('deviceId', '==', deviceId)
        );
      } else {
        // For all data, we can use orderBy since it's only one field
        q = query(
          collection(db, 'sensorHistory'),
          orderBy('timestamp', 'desc'),
          limit(limit_count)
        );
      }

      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as SensorHistoryRecord[];

      // If we had deviceId filter, sort and limit in JavaScript
      if (deviceId) {
        return records
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, limit_count);
      }

      return records;
    } catch (error) {
      console.error('Error getting historical data:', error);
      throw error;
    }
  }

  // Calculate posture statistics
  calculatePostureStats(data: SensorHistoryRecord[]): {
    averageAngle: number;
    totalAlerts: number;
    goodPosturePercentage: number;
  } {
    if (data.length === 0) {
      return { averageAngle: 0, totalAlerts: 0, goodPosturePercentage: 100 };
    }

    const angles = data.map(record => Math.abs(record.sensors.imu.pitch_deg));
    const averageAngle = angles.reduce((sum, angle) => sum + angle, 0) / angles.length;
    const totalAlerts = data.filter(record => record.sensors.imu.angle_over_limit).length;
    const goodPosturePercentage = ((data.length - totalAlerts) / data.length) * 100;

    return {
      averageAngle,
      totalAlerts,
      goodPosturePercentage
    };
  }

  // Cleanup listeners
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}
