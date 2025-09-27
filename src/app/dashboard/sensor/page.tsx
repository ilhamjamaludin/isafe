'use client';

import React, { useState } from 'react';
import { Wifi, WifiOff, Settings, MapPin, Battery, Signal, Thermometer, Droplets, Activity, Zap } from 'lucide-react';
import { useESP32Data } from '@/hooks/useESP32';

export default function SensorPage() {
  const [filter, setFilter] = useState('all');
  const { devices, loading, controlActuator } = useESP32Data();

  // Transform ESP32 data to sensor data
  const sensorData = React.useMemo(() => {
    return devices.map(device => {
      const timeSinceLastSeen = Date.now() - (device.lastSeen * 1000);
      const isStale = timeSinceLastSeen > 60000; // More than 1 minute is stale
      
      let status = device.isOnline ? 'online' : 'offline';
      if (device.isOnline && isStale) {
        status = 'warning';
      }

      // Simulate battery and signal strength based on sensor data
      // In real implementation, these would come from the ESP32
      const battery = device.data ? Math.max(20, 100 - Math.floor(timeSinceLastSeen / 60000)) : 0;
      const signalStrength = device.isOnline ? Math.max(30, 95 - Math.floor(timeSinceLastSeen / 30000)) : 0;

      return {
        id: device.deviceId,
        name: `ESP32 ${device.deviceId}`,
        location: `Zone ${device.deviceId} - Manufacturing`,
        status,
        battery: Math.min(100, battery),
        signalStrength: Math.min(100, signalStrength),
        lastSeen: getTimeAgo(new Date(device.lastSeen * 1000)),
        connectedWorkers: device.isOnline ? 1 : 0,
        data: device.data,
        rawDevice: device
      };
    });
  }, [devices]);

  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'offline': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return Wifi;
      case 'offline': return WifiOff;
      case 'warning': return Wifi;
      default: return Wifi;
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 50) return 'text-green-600';
    if (battery > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSignalColor = (signal: number) => {
    if (signal > 70) return 'text-green-600';
    if (signal > 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredData = filter === 'all' 
    ? sensorData 
    : sensorData.filter(sensor => sensor.status === filter);

  const stats = {
    total: sensorData.length,
    online: sensorData.filter(s => s.status === 'online').length,
    offline: sensorData.filter(s => s.status === 'offline').length,
    warning: sensorData.filter(s => s.status === 'warning').length,
  };

  const handleActuatorControl = async (deviceId: string, actuator: string, currentValue: boolean) => {
    try {
      await controlActuator(deviceId, actuator, !currentValue);
    } catch (error) {
      console.error('Failed to control actuator:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sensor Management</h1>
        <p className="text-gray-600 mt-2">Monitor and manage sensor network status</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sensors</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Settings className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Online</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.online}</p>
            </div>
            <Wifi className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Warning</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.warning}</p>
            </div>
            <Wifi className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Offline</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.offline}</p>
            </div>
            <WifiOff className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Actions and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Sensor Status</h3>
          <div className="flex items-center space-x-4">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sensors</option>
              <option value="online">Online</option>
              <option value="warning">Warning</option>
              <option value="offline">Offline</option>
            </select>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Add Sensor
            </button>
          </div>
        </div>
      </div>

      {/* Sensors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((sensor) => {
          const StatusIcon = getStatusIcon(sensor.status);
          return (
            <div key={sensor.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <StatusIcon className={`h-5 w-5 ${sensor.status === 'online' ? 'text-green-600' : sensor.status === 'offline' ? 'text-red-600' : 'text-yellow-600'}`} />
                    <h4 className="font-semibold text-gray-900">{sensor.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">ID: {sensor.id}</p>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    {sensor.location}
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sensor.status)}`}>
                  {sensor.status.charAt(0).toUpperCase() + sensor.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Battery className={`h-4 w-4 ${getBatteryColor(sensor.battery)}`} />
                  <span className="text-sm text-gray-600">
                    Battery: <span className={`font-medium ${getBatteryColor(sensor.battery)}`}>{sensor.battery}%</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Signal className={`h-4 w-4 ${getSignalColor(sensor.signalStrength)}`} />
                  <span className="text-sm text-gray-600">
                    Signal: <span className={`font-medium ${getSignalColor(sensor.signalStrength)}`}>{sensor.signalStrength}%</span>
                  </span>
                </div>
              </div>

              {/* Environmental Data */}
              {sensor.data && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Environmental Data</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center">
                      <Thermometer className="h-3 w-3 text-red-500 mr-1" />
                      <span>{sensor.data.sensors.bme680.temperature_c.toFixed(1)}°C</span>
                    </div>
                    <div className="flex items-center">
                      <Droplets className="h-3 w-3 text-blue-500 mr-1" />
                      <span>{sensor.data.sensors.bme680.humidity_pct.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center">
                      <Activity className="h-3 w-3 text-purple-500 mr-1" />
                      <span>Gas: {sensor.data.sensors.bme680.gas_kohm.toFixed(1)}kΩ</span>
                    </div>
                    <div className="flex items-center">
                      <Zap className="h-3 w-3 text-green-500 mr-1" />
                      <span>EMG: {sensor.data.sensors.emg.raw}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actuator Controls */}
              {sensor.data && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Actuator Controls</h5>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(sensor.data.actuators).map(([actuator, value]) => (
                      <button
                        key={actuator}
                        onClick={() => handleActuatorControl(sensor.id, actuator, value)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          value
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {actuator}: {value ? 'ON' : 'OFF'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Connected Workers: <span className="font-medium text-gray-900">{sensor.connectedWorkers}</span></span>
                  <span className="text-gray-500">{sensor.lastSeen}</span>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                  Configure
                </button>
                <button className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                  Details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
