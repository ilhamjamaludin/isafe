'use client';

import { useState, useEffect, useCallback } from 'react';
import { ESP32Service } from '@/services/esp32Service';
import { ESP32Status, AlertRecord } from '@/types/esp32';

const esp32Service = new ESP32Service();

export const useESP32Data = () => {
  const [devices, setDevices] = useState<ESP32Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = esp32Service.subscribeToLiveData((data) => {
      setDevices(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      setLoading(false);
    };
  }, []);

  const controlActuator = useCallback(async (deviceId: string, actuator: string, value: boolean) => {
    try {
      await esp32Service.setActuator(deviceId, actuator, value);
    } catch (err) {
      setError(`Failed to control actuator: ${err}`);
    }
  }, []);

  return {
    devices,
    loading,
    error,
    controlActuator
  };
};

export const useESP32Device = (deviceId: string) => {
  const [device, setDevice] = useState<ESP32Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId) return;

    const unsubscribe = esp32Service.subscribeToDevice(deviceId, (data) => {
      setDevice(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      setLoading(false);
    };
  }, [deviceId]);

  return {
    device,
    loading,
    error
  };
};

export const useESP32Alerts = () => {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const { devices } = useESP32Data();

  useEffect(() => {
    const processDeviceAlerts = async () => {
      const newAlerts: AlertRecord[] = [];
      
      for (const deviceStatus of devices) {
        if (deviceStatus.isOnline && deviceStatus.data) {
          try {
            const deviceAlerts = await esp32Service.checkAndCreateAlerts(
              deviceStatus.deviceId, 
              deviceStatus.data
            );
            newAlerts.push(...deviceAlerts);
          } catch (error) {
            console.error(`Error processing alerts for ${deviceStatus.deviceId}:`, error);
          }
        }
      }
      
      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev]);
      }
    };

    if (devices.length > 0) {
      processDeviceAlerts();
    }
  }, [devices]);

  return { alerts };
};
