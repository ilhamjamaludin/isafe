'use client';

import React from 'react';
import { useESP32Data } from '@/hooks/useESP32';
import { Wifi, WifiOff, Thermometer, Droplets, Activity, Battery } from 'lucide-react';

export default function ESP32Debug() {
  const { devices, loading, error } = useESP32Data();

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border">
        <div className="animate-pulse text-sm text-gray-600">Loading ESP32 data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-50 rounded-lg shadow-lg p-4 border border-red-200">
        <div className="text-sm text-red-700">ESP32 Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border max-w-sm">
      <div className="p-3 border-b bg-gray-50 rounded-t-lg">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
          <Activity className="h-4 w-4 mr-2 text-blue-600" />
          ESP32 Debug ({devices.length} devices)
        </h3>
      </div>
      <div className="p-3 max-h-80 overflow-y-auto">
        {devices.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            No ESP32 devices detected
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map(device => (
              <div key={device.deviceId} className="border rounded-lg p-3 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{device.deviceId}</span>
                  <div className="flex items-center">
                    {device.isOnline ? (
                      <Wifi className="h-3 w-3 text-green-500" />
                    ) : (
                      <WifiOff className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`ml-1 text-xs ${device.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                      {device.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                
                {device.data && (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="flex items-center">
                        <Thermometer className="h-3 w-3 text-red-500 mr-1" />
                        <span>{device.data.sensors.bme680.temperature_c.toFixed(1)}°C</span>
                      </div>
                      <div className="flex items-center">
                        <Droplets className="h-3 w-3 text-blue-500 mr-1" />
                        <span>{device.data.sensors.bme680.humidity_pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>IMU: Pitch {device.data.sensors.imu.pitch_deg.toFixed(1)}°, Roll {device.data.sensors.imu.roll_deg.toFixed(1)}°</div>
                      <div>EMG: {device.data.sensors.emg.raw} {device.data.sensors.emg.over_threshold ? '⚠️' : '✅'}</div>
                      <div>Weight: {device.data.sensors.loadcell.weight_g}g {device.data.sensors.loadcell.overweight ? '⚠️' : '✅'}</div>
                      <div>Posture: {device.data.sensors.imu.angle_over_limit ? '⚠️ Poor' : '✅ Good'}</div>
                    </div>

                    <div className="mt-2 pt-2 border-t">
                      <div className="text-xs text-gray-500">
                        Actuators: {Object.entries(device.data.actuators)
                          .filter(([_, active]) => active)
                          .map(([name]) => name)
                          .join(', ') || 'None active'}
                      </div>
                    </div>
                  </>
                )}
                
                <div className="text-xs text-gray-400 mt-2">
                  Last seen: {new Date(device.lastSeen * 1000).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
