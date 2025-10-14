'use client';

import React from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  Shield,
  Thermometer,
  Droplets,
  Zap,
  Wifi,
  WifiOff,
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  Battery,
  Target
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerSensorData, useWorkerStats } from '@/hooks/useWorkerSensor';
import { useESP32Data } from '@/hooks/useESP32';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const { assignment, loading: assignmentLoading } = useWorkerSensorData(user?.uid);
  const { devices } = useESP32Data();
  const { stats, loading: statsLoading } = useWorkerStats(user?.uid);

  // Get sensor data for the assigned sensor
  const assignedSensor = assignment ? devices.find(d => d.deviceId === assignment.sensorId) : null;
  const isOnline = assignedSensor?.isOnline || false;
  const sensorData = assignedSensor?.data;

  // Real-time safety metrics
  const safetyMetrics = React.useMemo(() => {
    if (!sensorData) return null;

    const postureStatus = sensorData.sensors.imu.angle_over_limit ? 'poor' : 'good';
    const weightStatus = sensorData.sensors.loadcell.overweight ? 'overweight' : 'normal';
    const emgStatus = sensorData.sensors.emg.over_threshold ? 'high' : 'normal';
    
    const temp = sensorData.sensors.bme680.temperature_c;
    const environmentStatus = (temp > 35 || temp < 15) ? 'extreme' : 'normal';

    // Calculate overall safety score
    let safetyScore = 100;
    if (postureStatus === 'poor') safetyScore -= 30;
    if (weightStatus === 'overweight') safetyScore -= 25;
    if (emgStatus === 'high') safetyScore -= 20;
    if (environmentStatus === 'extreme') safetyScore -= 15;

    return {
      safetyScore: Math.max(0, safetyScore),
      postureStatus,
      weightStatus,
      emgStatus,
      environmentStatus
    };
  }, [sensorData]);

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'normal': return 'text-green-600 bg-green-100';
      case 'poor':
      case 'high':
      case 'overweight': return 'text-red-600 bg-red-100';
      case 'extreme': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSafetyScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  if (assignmentLoading || statsLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.displayName || 'Worker'}!</h1>
          <p className="text-gray-600 mt-2">Your safety monitoring dashboard</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-yellow-800">No Sensor Assigned</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>You don&apos;t have a sensor assigned yet. Please contact your supervisor to get a sensor assigned for safety monitoring.</p>
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.displayName || 'Worker'}!</h1>
        <p className="text-gray-600 mt-2">Your safety monitoring dashboard</p>
      </div>

      {/* Connection Status */}
      <div className={`border rounded-lg p-4 ${isOnline ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {isOnline ? (
              <Wifi className="h-6 w-6 text-green-600" />
            ) : (
              <WifiOff className="h-6 w-6 text-red-600" />
            )}
          </div>
          <div className="ml-3">
            <h3 className={`text-lg font-medium ${isOnline ? 'text-green-800' : 'text-red-800'}`}>
              Sensor {isOnline ? 'Connected' : 'Disconnected'}
            </h3>
            <p className={`text-sm mt-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline 
                ? `Device ${assignment.sensorId} is monitoring your safety`
                : `Device ${assignment.sensorId} is offline - contact supervisor if needed`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Safety Overview Cards */}
      {safetyMetrics && sensorData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Safety Score */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Safety Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{safetyMetrics.safetyScore}%</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getSafetyScoreColor(safetyMetrics.safetyScore)}`}>
                  {safetyMetrics.safetyScore >= 85 ? 'Excellent' : safetyMetrics.safetyScore >= 70 ? 'Good' : 'Needs Attention'}
                </span>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Posture Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Posture</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {Math.abs(sensorData.sensors.imu.pitch_deg).toFixed(1)}° tilt
                </p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getStatusColor(safetyMetrics.postureStatus)}`}>
                  {safetyMetrics.postureStatus === 'good' ? 'Good Posture' : 'Poor Posture'}
                </span>
              </div>
              <div className={`p-3 rounded-lg ${safetyMetrics.postureStatus === 'good' ? 'bg-green-500' : 'bg-red-500'}`}>
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Weight Monitor */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Load</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {(sensorData.sensors.loadcell.weight_g / 1000).toFixed(1)} kg
                </p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getStatusColor(safetyMetrics.weightStatus)}`}>
                  {safetyMetrics.weightStatus === 'normal' ? 'Safe Load' : 'Overweight'}
                </span>
              </div>
              <div className={`p-3 rounded-lg ${safetyMetrics.weightStatus === 'normal' ? 'bg-green-500' : 'bg-red-500'}`}>
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Work Duration */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-sm text-gray-600">Today&apos;s Work</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {stats ? `${(stats.totalWorkingTime).toFixed(1)}h` : '0h'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {stats ? `${stats.totalSessions} sessions` : 'No sessions'}
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Environmental Data */}
      {sensorData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Environmental Conditions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Thermometer className="h-5 w-5 text-red-500 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Temperature</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-gray-900">
                      {sensorData.sensors.bme680.temperature_c.toFixed(1)}°C
                    </span>
                    <p className="text-xs text-gray-500">
                      {sensorData.sensors.bme680.temperature_c > 35 ? 'Too hot' : 
                       sensorData.sensors.bme680.temperature_c < 15 ? 'Too cold' : 'Comfortable'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Droplets className="h-5 w-5 text-blue-500 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Humidity</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-gray-900">
                      {sensorData.sensors.bme680.humidity_pct.toFixed(1)}%
                    </span>
                    <p className="text-xs text-gray-500">
                      {sensorData.sensors.bme680.humidity_pct > 70 ? 'High' : 
                       sensorData.sensors.bme680.humidity_pct < 30 ? 'Low' : 'Normal'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Zap className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Muscle Activity</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-gray-900">
                      {sensorData.sensors.emg.raw}
                    </span>
                    <p className="text-xs text-gray-500">
                      {sensorData.sensors.emg.over_threshold ? 'High strain' : 'Normal'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Statistics */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Weekly Performance</h3>
            </div>
            <div className="p-6">
              {stats ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Total Working Hours</span>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-gray-900">{stats.totalWorkingTime.toFixed(1)}h</span>
                      {getTrendIcon(stats.totalWorkingTime, 35)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Safety Score</span>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-gray-900">{stats.safetyScore}%</span>
                      {getTrendIcon(stats.safetyScore, 85)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Total Alerts</span>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-gray-900">{stats.totalAlerts}</span>
                      {getTrendIcon(10, stats.totalAlerts)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Work Sessions</span>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-gray-900">{stats.totalSessions}</span>
                      {getTrendIcon(stats.totalSessions, 5)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No statistics available yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
}
