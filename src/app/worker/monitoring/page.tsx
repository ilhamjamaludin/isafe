'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  Thermometer, 
  Droplets, 
  Zap, 
  Scale, 
  Wifi, 
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Target,
  TrendingUp,
  Battery,
  Signal,
  Gauge
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerSensorData } from '@/hooks/useWorkerSensor';
import { useESP32Data } from '@/hooks/useESP32';

export default function WorkerMonitoringPage() {
  const { user } = useAuth();
  const { assignment, loading: assignmentLoading } = useWorkerSensorData(user?.uid);
  const { devices } = useESP32Data();
  

  // Get sensor data for the assigned sensor
  const assignedSensor = assignment ? devices.find(d => d.deviceId === assignment.sensorId) : null;
  const isOnline = assignedSensor?.isOnline || false;
  const sensorData = assignedSensor?.data;

  // Calculate real-time metrics
  const metrics = React.useMemo(() => {
    if (!sensorData) return null;

    const postureAngle = Math.abs(sensorData.sensors.imu.pitch_deg);
    const rollAngle = Math.abs(sensorData.sensors.imu.roll_deg);
    const maxAngle = Math.max(postureAngle, rollAngle);
    
    return {
      posture: {
        angle: maxAngle,
        status: sensorData.sensors.imu.angle_over_limit ? 'poor' : 'good',
        pitch: sensorData.sensors.imu.pitch_deg,
        roll: sensorData.sensors.imu.roll_deg
      },
      weight: {
        current: sensorData.sensors.loadcell.weight_g / 1000, // Convert to kg
        status: sensorData.sensors.loadcell.overweight ? 'overweight' : 'normal',
        threshold: 27 // kg
      },
      emg: {
        value: sensorData.sensors.emg.raw,
        status: sensorData.sensors.emg.over_threshold ? 'high' : 'normal',
        threshold: 700
      },
      environment: {
        temperature: sensorData.sensors.bme680.temperature_c,
        humidity: sensorData.sensors.bme680.humidity_pct,
        pressure: sensorData.sensors.bme680.pressure_hpa,
        gasResistance: sensorData.sensors.bme680.gas_kohm
      }
    };
  }, [sensorData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'normal': return 'text-green-600 bg-green-100 border-green-200';
      case 'poor':
      case 'high':
      case 'overweight': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getAngleColor = (angle: number) => {
    if (angle <= 15) return 'text-green-600';
    if (angle <= 30) return 'text-yellow-600';
    if (angle <= 45) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (value: number, max: number, reverse = false) => {
    const percentage = (value / max) * 100;
    if (reverse) {
      if (percentage <= 33) return 'bg-red-500';
      if (percentage <= 66) return 'bg-yellow-500';
      return 'bg-green-500';
    } else {
      if (percentage <= 33) return 'bg-green-500';
      if (percentage <= 66) return 'bg-yellow-500';
      return 'bg-red-500';
    }
  };

  if (assignmentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real-time Monitoring</h1>
          <p className="text-gray-600 mt-2">Live sensor data and safety monitoring</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-yellow-800">No Sensor Assigned</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>You need a sensor assigned to view real-time monitoring data. Contact your supervisor.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real-time Monitoring</h1>
          <p className="text-gray-600 mt-2">Live sensor data from {assignment.sensorId}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span className="text-sm font-medium">
              {isOnline ? 'Sensor Online' : 'Sensor Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      {!isOnline && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <WifiOff className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Sensor Disconnected</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>Your safety sensor is currently offline. Monitoring data is not available.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Data Cards */}
      {metrics && sensorData && (
        <>
          {/* Primary Safety Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Posture Monitor */}
            <div className={`bg-white rounded-lg border-2 p-6 ${getStatusColor(metrics.posture.status)}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Activity className="h-6 w-6 mr-3" />
                  <h3 className="text-lg font-semibold">Posture</h3>
                </div>
                {metrics.posture.status === 'good' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
              </div>
              
              <div className="space-y-3">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getAngleColor(metrics.posture.angle)}`}>
                    {metrics.posture.angle.toFixed(1)}°
                  </div>
                  <p className="text-sm text-gray-600">Current tilt angle</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Pitch:</span>
                    <span className="ml-1 font-medium">{metrics.posture.pitch.toFixed(1)}°</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Roll:</span>
                    <span className="ml-1 font-medium">{metrics.posture.roll.toFixed(1)}°</span>
                  </div>
                </div>

                {/* Angle indicator */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(metrics.posture.angle, 90)}`}
                    style={{ width: `${Math.min((metrics.posture.angle / 90) * 100, 100)}%` }}
                  ></div>
                </div>
                
                <p className="text-xs text-center text-gray-600">
                  Target: &lt; 45° for safe posture
                </p>
              </div>
            </div>

            {/* Weight Monitor */}
            <div className={`bg-white rounded-lg border-2 p-6 ${getStatusColor(metrics.weight.status)}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Scale className="h-6 w-6 mr-3" />
                  <h3 className="text-lg font-semibold">Load Weight</h3>
                </div>
                {metrics.weight.status === 'normal' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
              </div>
              
              <div className="space-y-3">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${metrics.weight.status === 'normal' ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.weight.current.toFixed(1)} kg
                  </div>
                  <p className="text-sm text-gray-600">Current load</p>
                </div>

                {/* Weight indicator */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(metrics.weight.current, metrics.weight.threshold)}`}
                    style={{ width: `${Math.min((metrics.weight.current / metrics.weight.threshold) * 100, 100)}%` }}
                  ></div>
                </div>
                
                <p className="text-xs text-center text-gray-600">
                  Safe limit: &lt; {metrics.weight.threshold} kg
                </p>
              </div>
            </div>

            {/* EMG Monitor */}
            <div className={`bg-white rounded-lg border-2 p-6 ${getStatusColor(metrics.emg.status)}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Zap className="h-6 w-6 mr-3" />
                  <h3 className="text-lg font-semibold">Muscle Activity</h3>
                </div>
                {metrics.emg.status === 'normal' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
              </div>
              
              <div className="space-y-3">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${metrics.emg.status === 'normal' ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.emg.value}
                  </div>
                  <p className="text-sm text-gray-600">EMG signal</p>
                </div>

                {/* EMG indicator */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(metrics.emg.value, 1024)}`}
                    style={{ width: `${Math.min((metrics.emg.value / 1024) * 100, 100)}%` }}
                  ></div>
                </div>
                
                <p className="text-xs text-center text-gray-600">
                  Alert threshold: {metrics.emg.threshold}
                </p>
              </div>
            </div>
          </div>

          {/* Environmental Conditions */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Gauge className="h-5 w-5 mr-2" />
                Environmental Conditions
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Temperature */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Thermometer className={`h-8 w-8 ${
                      metrics.environment.temperature > 35 || metrics.environment.temperature < 15 
                        ? 'text-red-500' : 'text-green-500'
                    }`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics.environment.temperature.toFixed(1)}°C
                  </div>
                  <p className="text-sm text-gray-600">Temperature</p>
                  <p className={`text-xs mt-1 ${
                    metrics.environment.temperature > 35 ? 'text-red-600' :
                    metrics.environment.temperature < 15 ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {metrics.environment.temperature > 35 ? 'Too Hot' :
                     metrics.environment.temperature < 15 ? 'Too Cold' : 'Comfortable'}
                  </p>
                </div>

                {/* Humidity */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Droplets className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics.environment.humidity.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600">Humidity</p>
                  <p className={`text-xs mt-1 ${
                    metrics.environment.humidity > 70 ? 'text-orange-600' :
                    metrics.environment.humidity < 30 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {metrics.environment.humidity > 70 ? 'High' :
                     metrics.environment.humidity < 30 ? 'Low' : 'Normal'}
                  </p>
                </div>

                {/* Pressure */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Gauge className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics.environment.pressure.toFixed(0)}
                  </div>
                  <p className="text-sm text-gray-600">hPa</p>
                  <p className="text-xs text-green-600 mt-1">Normal</p>
                </div>

                {/* Gas Resistance */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Activity className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics.environment.gasResistance.toFixed(1)}
                  </div>
                  <p className="text-sm text-gray-600">kΩ</p>
                  <p className="text-xs text-green-600 mt-1">Good</p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Alerts */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Active Alerts
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {/* Dynamic alert generation */}
                {metrics.posture.status === 'poor' && (
                  <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Poor Posture Detected</p>
                      <p className="text-xs text-red-600">Adjust your position to maintain proper alignment</p>
                    </div>
                  </div>
                )}
                
                {metrics.weight.status === 'overweight' && (
                  <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Weight Limit Exceeded</p>
                      <p className="text-xs text-red-600">Current load exceeds safe lifting limit</p>
                    </div>
                  </div>
                )}
                
                {metrics.emg.status === 'high' && (
                  <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">High Muscle Activity</p>
                      <p className="text-xs text-yellow-600">Consider taking a break to prevent fatigue</p>
                    </div>
                  </div>
                )}

                {metrics.posture.status === 'good' && metrics.weight.status === 'normal' && metrics.emg.status === 'normal' && (
                  <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-800">All Systems Normal</p>
                      <p className="text-xs text-green-600">You&apos;re working safely - keep it up!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* No Data Available */}
      {!sensorData && isOnline && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="text-center">
            <Gauge className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Waiting for Sensor Data</h3>
            <p className="text-gray-600 mt-2">Sensor is online but no data received yet.</p>
          </div>
        </div>
      )}
    </div>
  );
}
