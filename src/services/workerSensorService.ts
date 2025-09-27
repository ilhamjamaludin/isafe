'use client';

import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { WorkerSensorAssignment, WorkerActivitySession, CustomUser } from '@/types/user';
import { ESP32Data, SensorHistoryRecord } from '@/types/esp32';

export class WorkerSensorService {
  
  // Utility function to remove undefined values from objects before Firestore save
  private cleanDataForFirestore(data: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
  }
  
  // Assign sensor to worker
  async assignSensorToWorker(
    workerId: string, 
    workerEmail: string,
    workerName: string,
    sensorId: string, 
    assignedBy: string,
    notes?: string
  ): Promise<WorkerSensorAssignment> {
    try {
      // First check if sensor is already assigned
      const existingAssignment = await this.getSensorAssignment(sensorId);
      if (existingAssignment && existingAssignment.isActive) {
        throw new Error('Sensor is already assigned to another worker');
      }

      // Check if worker already has a sensor assigned
      const workerAssignment = await this.getWorkerAssignment(workerId);
      if (workerAssignment && workerAssignment.isActive) {
        throw new Error('Worker already has a sensor assigned');
      }

      const assignment: Omit<WorkerSensorAssignment, 'id'> = {
        workerId,
        workerEmail,
        workerName,
        sensorId,
        assignedAt: new Date(),
        assignedBy,
        isActive: true,
        ...(notes && { notes }) // Only include notes if it's not undefined/empty
      };

      const docRef = await addDoc(collection(db, 'workerSensorAssignments'), 
        this.cleanDataForFirestore({
          ...assignment,
          assignedAt: Timestamp.fromDate(assignment.assignedAt)
        })
      );

      // Update worker record with assigned sensor
      await updateDoc(doc(db, 'users', workerId), {
        assignedSensorId: sensorId,
        updatedAt: Timestamp.now()
      });

      return { id: docRef.id, ...assignment };
    } catch (error) {
      console.error('Error assigning sensor to worker:', error);
      throw error;
    }
  }

  // Unassign sensor from worker
  async unassignSensorFromWorker(workerId: string): Promise<void> {
    try {
      // Get current assignment
      const assignment = await this.getWorkerAssignment(workerId);
      if (!assignment) {
        throw new Error('No sensor assignment found for this worker');
      }

      // Deactivate assignment
      await updateDoc(doc(db, 'workerSensorAssignments', assignment.id), {
        isActive: false,
        unassignedAt: Timestamp.now()
      });

      // Remove sensor from worker record
      await updateDoc(doc(db, 'users', workerId), {
        assignedSensorId: null,
        isActive: false,
        updatedAt: Timestamp.now()
      });

      // End any active session
      await this.endWorkerSession(workerId);
    } catch (error) {
      console.error('Error unassigning sensor from worker:', error);
      throw error;
    }
  }

  // Get sensor assignment by sensor ID
  async getSensorAssignment(sensorId: string): Promise<WorkerSensorAssignment | null> {
    try {
      const q = query(
        collection(db, 'workerSensorAssignments'),
        where('sensorId', '==', sensorId),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return null;
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        assignedAt: doc.data().assignedAt.toDate()
      } as WorkerSensorAssignment;
    } catch (error) {
      console.error('Error getting sensor assignment:', error);
      throw error;
    }
  }

  // Get worker assignment by worker ID
  async getWorkerAssignment(workerId: string): Promise<WorkerSensorAssignment | null> {
    try {
      const q = query(
        collection(db, 'workerSensorAssignments'),
        where('workerId', '==', workerId),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return null;
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        assignedAt: doc.data().assignedAt.toDate()
      } as WorkerSensorAssignment;
    } catch (error) {
      console.error('Error getting worker assignment:', error);
      throw error;
    }
  }

  // Get all active assignments
  async getAllActiveAssignments(): Promise<WorkerSensorAssignment[]> {
    try {
      // Simple query without orderBy to avoid composite index requirement
      const q = query(
        collection(db, 'workerSensorAssignments'),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      const assignments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        assignedAt: doc.data().assignedAt.toDate()
      })) as WorkerSensorAssignment[];

      // Sort in JavaScript instead of Firestore
      return assignments.sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime());
    } catch (error) {
      console.error('Error getting all assignments:', error);
      throw error;
    }
  }

  // Start worker session (when worker starts working)
  async startWorkerSession(workerId: string, workerEmail: string, sensorId: string): Promise<WorkerActivitySession> {
    try {
      // End any existing active session
      await this.endWorkerSession(workerId);

      const session: Omit<WorkerActivitySession, 'id'> = {
        workerId,
        workerEmail,
        sensorId,
        startTime: new Date(),
        totalAlerts: 0
      };

      const docRef = await addDoc(collection(db, 'workerActivitySessions'),
        this.cleanDataForFirestore({
          ...session,
          startTime: Timestamp.fromDate(session.startTime)
        })
      );

      // Update worker as active
      await updateDoc(doc(db, 'users', workerId), {
        isActive: true,
        lastActiveTime: Timestamp.now()
      });

      return { id: docRef.id, ...session };
    } catch (error) {
      console.error('Error starting worker session:', error);
      throw error;
    }
  }

  // End worker session
  async endWorkerSession(workerId: string): Promise<void> {
    try {
      // Find active session
      const q = query(
        collection(db, 'workerActivitySessions'),
        where('workerId', '==', workerId),
        where('endTime', '==', null)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const sessionDoc = querySnapshot.docs[0];
        const sessionData = sessionDoc.data();
        const endTime = new Date();
        const duration = endTime.getTime() - sessionData.startTime.toDate().getTime();

        // Update session with end time and calculated metrics
        await updateDoc(doc(db, 'workerActivitySessions', sessionDoc.id), {
          endTime: Timestamp.fromDate(endTime),
          duration: duration
        });
      }

      // Update worker as inactive
      await updateDoc(doc(db, 'users', workerId), {
        isActive: false,
        lastActiveTime: Timestamp.now()
      });
    } catch (error) {
      console.error('Error ending worker session:', error);
      throw error;
    }
  }

  // Save sensor data for worker (called periodically with real-time data)
  async saveSensorDataForWorker(workerId: string, deviceId: string, sensorData: ESP32Data): Promise<void> {
    try {
      // Validate sensor data before processing
      if (!sensorData || !sensorData.sensors) {
        console.warn('Invalid sensor data provided:', sensorData);
        return;
      }

      // Use the actual ESP32 device ID passed as parameter
      // Save to sensor history with worker ID
      const historyRecord: Omit<SensorHistoryRecord, 'timestamp'> & { timestamp: Timestamp } = {
        deviceId, // Use actual ESP32/sensor device ID
        timestamp: Timestamp.now(),
        sensors: sensorData.sensors,
        workerId: workerId
      };

      await addDoc(collection(db, 'sensorHistory'), 
        this.cleanDataForFirestore(historyRecord)
      );

      // Update current session with latest data
      const q = query(
        collection(db, 'workerActivitySessions'),
        where('workerId', '==', workerId),
        where('endTime', '==', null)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const sessionDoc = querySnapshot.docs[0];
        
        // Calculate alerts from sensor data with null checks
        let newAlerts = 0;
        if (sensorData.sensors.imu?.angle_over_limit) newAlerts++;
        if (sensorData.sensors.loadcell?.overweight) newAlerts++;
        if (sensorData.sensors.emg?.over_threshold) newAlerts++;
        
        const currentData = sessionDoc.data();
        
        await updateDoc(doc(db, 'workerActivitySessions', sessionDoc.id), 
          this.cleanDataForFirestore({
            totalAlerts: (currentData.totalAlerts || 0) + newAlerts,
            lastSensorData: sensorData,
            updatedAt: Timestamp.now()
          })
        );
      }

      // Update worker's last active time
      await updateDoc(doc(db, 'users', workerId), {
        lastActiveTime: Timestamp.now()
      });
    } catch (error) {
      console.error('Error saving sensor data for worker:', error);
      throw error;
    }
  }

  // Get worker's activity sessions
  async getWorkerActivitySessions(workerId: string, limit = 50): Promise<WorkerActivitySession[]> {
    try {
      // Simple query without orderBy to avoid composite index requirement
      const q = query(
        collection(db, 'workerActivitySessions'),
        where('workerId', '==', workerId)
      );
      const querySnapshot = await getDocs(q);
      
      const sessions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime?.toDate()
      })) as WorkerActivitySession[];

      // Sort in JavaScript and limit results
      return sessions
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting worker sessions:', error);
      throw error;
    }
  }

  // Get available (unassigned) sensors
  async getAvailableSensors(allSensorIds: string[]): Promise<string[]> {
    try {
      const assignments = await this.getAllActiveAssignments();
      const assignedSensorIds = assignments.map(a => a.sensorId);
      return allSensorIds.filter(id => !assignedSensorIds.includes(id));
    } catch (error) {
      console.error('Error getting available sensors:', error);
      throw error;
    }
  }

  // Calculate worker statistics
  async calculateWorkerStats(workerId: string, days = 30): Promise<{
    totalSessions: number;
    totalWorkingTime: number; // in hours
    averageSessionTime: number; // in hours
    totalAlerts: number;
    safetyScore: number;
  }> {
    try {
      const sessions = await this.getWorkerActivitySessions(workerId, 100);
      const recentSessions = sessions.filter(s => {
        const daysAgo = (Date.now() - s.startTime.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= days;
      });

      if (recentSessions.length === 0) {
        return {
          totalSessions: 0,
          totalWorkingTime: 0,
          averageSessionTime: 0,
          totalAlerts: 0,
          safetyScore: 100
        };
      }

      const totalWorkingTime = recentSessions.reduce((acc, session) => {
        return acc + (session.duration || 0);
      }, 0) / (1000 * 60 * 60); // Convert to hours

      const totalAlerts = recentSessions.reduce((acc, session) => {
        return acc + (session.totalAlerts || 0);
      }, 0);

      const averageSessionTime = totalWorkingTime / recentSessions.length;
      
      // Simple safety score calculation (100 - alerts per hour)
      const alertsPerHour = totalWorkingTime > 0 ? totalAlerts / totalWorkingTime : 0;
      const safetyScore = Math.max(0, Math.min(100, 100 - (alertsPerHour * 5)));

      return {
        totalSessions: recentSessions.length,
        totalWorkingTime,
        averageSessionTime,
        totalAlerts,
        safetyScore: Math.round(safetyScore)
      };
    } catch (error) {
      console.error('Error calculating worker stats:', error);
      throw error;
    }
  }
}
