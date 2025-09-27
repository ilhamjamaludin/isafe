'use client';

import { useState, useEffect, useCallback } from 'react';
import { WorkerSensorService } from '@/services/workerSensorService';
import { WorkerSensorAssignment, WorkerActivitySession, CustomUser } from '@/types/user';
import { useESP32Data } from '@/hooks/useESP32';

const workerSensorService = new WorkerSensorService();

export const useWorkerSensorAssignments = () => {
  const [assignments, setAssignments] = useState<WorkerSensorAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedAssignments = await workerSensorService.getAllActiveAssignments();
      setAssignments(fetchedAssignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const assignSensor = useCallback(async (
    workerId: string,
    workerEmail: string,
    workerName: string,
    sensorId: string,
    assignedBy: string,
    notes?: string
  ) => {
    try {
      setError(null);
      const newAssignment = await workerSensorService.assignSensorToWorker(
        workerId, workerEmail, workerName, sensorId, assignedBy, notes
      );
      setAssignments(prev => [newAssignment, ...prev]);
      return newAssignment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign sensor';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const unassignSensor = useCallback(async (workerId: string) => {
    try {
      setError(null);
      await workerSensorService.unassignSensorFromWorker(workerId);
      setAssignments(prev => prev.filter(a => a.workerId !== workerId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unassign sensor';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    assignments,
    loading,
    error,
    assignSensor,
    unassignSensor,
    refetch: fetchAssignments
  };
};

export const useWorkerSensor = (workerId: string) => {
  const [assignment, setAssignment] = useState<WorkerSensorAssignment | null>(null);
  const [sessions, setSessions] = useState<WorkerActivitySession[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalWorkingTime: 0,
    averageSessionTime: 0,
    totalAlerts: 0,
    safetyScore: 100
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkerData = useCallback(async () => {
    if (!workerId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch assignment
      const workerAssignment = await workerSensorService.getWorkerAssignment(workerId);
      setAssignment(workerAssignment);
      
      // Fetch sessions
      const workerSessions = await workerSensorService.getWorkerActivitySessions(workerId);
      setSessions(workerSessions);
      
      // Calculate stats
      const workerStats = await workerSensorService.calculateWorkerStats(workerId);
      setStats(workerStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch worker data');
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchWorkerData();
  }, [fetchWorkerData]);

  const startSession = useCallback(async (workerEmail: string, sensorId: string) => {
    try {
      setError(null);
      const newSession = await workerSensorService.startWorkerSession(workerId, workerEmail, sensorId);
      setSessions(prev => [newSession, ...prev]);
      return newSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [workerId]);

  const endSession = useCallback(async () => {
    try {
      setError(null);
      await workerSensorService.endWorkerSession(workerId);
      await fetchWorkerData(); // Refresh data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end session';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [workerId, fetchWorkerData]);

  return {
    assignment,
    sessions,
    stats,
    loading,
    error,
    startSession,
    endSession,
    refetch: fetchWorkerData
  };
};

export const useAvailableSensors = () => {
  const { devices: esp32Devices } = useESP32Data();
  const [availableSensors, setAvailableSensors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailableSensors = async () => {
      try {
        setLoading(true);
        setError(null);
        const allSensorIds = esp32Devices.map(device => device.deviceId);
        const available = await workerSensorService.getAvailableSensors(allSensorIds);
        setAvailableSensors(available);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch available sensors');
      } finally {
        setLoading(false);
      }
    };

    if (esp32Devices.length > 0) {
      fetchAvailableSensors();
    }
  }, [esp32Devices]);

  return {
    availableSensors,
    allSensors: esp32Devices.map(device => device.deviceId),
    loading,
    error
  };
};

// Hook to automatically save sensor data for active workers
export const useWorkerDataSync = () => {
  const { devices: esp32Devices } = useESP32Data();

  useEffect(() => {
    let isActive = true;
    
    const processData = async () => {
      if (!isActive) return;
      
      try {
        // Get all active assignments
        const assignments = await workerSensorService.getAllActiveAssignments();
        
        // For each active assignment, save current sensor data
        for (const assignment of assignments) {
          const sensorDevice = esp32Devices.find(d => d.deviceId === assignment.sensorId);
          
          if (sensorDevice && sensorDevice.isOnline && sensorDevice.data) {
            try {
              // Additional validation before saving
              if (sensorDevice.data.sensors && 
                  typeof sensorDevice.data.sensors === 'object') {
                await workerSensorService.saveSensorDataForWorker(
                  assignment.workerId,
                  sensorDevice.deviceId, // Pass actual ESP32 device ID
                  sensorDevice.data
                );
              } else {
                console.warn('Invalid sensor data structure for device:', assignment.sensorId);
              }
            } catch (error) {
              console.error('Error saving sensor data for worker:', assignment.workerId, error);
            }
          }
        }
      } catch (error) {
        console.error('Error processing worker data sync:', error);
      }
    };

    // Process immediately and then set interval
    if (esp32Devices.length > 0) {
      processData();
    }

    const saveInterval = setInterval(processData, 10000); // Save every 10 seconds

    return () => {
      isActive = false;
      clearInterval(saveInterval);
    };
  }, [esp32Devices]);
};

// Hook for getting worker's assigned sensor data
export const useWorkerSensorData = (workerId?: string) => {
  const [assignment, setAssignment] = useState<WorkerSensorAssignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!workerId) {
        setLoading(false);
        return;
      }

      try {
        const workerAssignment = await workerSensorService.getWorkerAssignment(workerId);
        setAssignment(workerAssignment);
      } catch (error) {
        console.error('Error fetching worker assignment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [workerId]);

  return { assignment, loading };
};

// Hook for getting worker statistics
export const useWorkerStats = (workerId?: string, days = 7) => {
  const [stats, setStats] = useState<{
    totalSessions: number;
    totalWorkingTime: number;
    averageSessionTime: number;
    totalAlerts: number;
    safetyScore: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!workerId) {
        setLoading(false);
        return;
      }

      try {
        const workerStats = await workerSensorService.calculateWorkerStats(workerId, days);
        setStats(workerStats);
      } catch (error) {
        console.error('Error fetching worker stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [workerId, days]);

  return { stats, loading };
};
