'use client';

import React from 'react';
import { Users, Activity, Wifi, AlertTriangle, TrendingUp, Shield, Thermometer, Droplets } from 'lucide-react';
import { useESP32Data, useESP32Alerts } from '@/hooks/useESP32';

export default function DashboardHome() {
  const { devices, loading: devicesLoading } = useESP32Data();
  const { alerts } = useESP32Alerts();

  // Calculate real-time statistics
  const onlineDevices = devices.filter(d => d.isOnline);
  const activeAlerts = alerts.filter(a => !a.resolved);
  const totalWorkers = 24; // This could come from user management
  
  // Calculate average safety score based on real sensor data
  const safetyScore = onlineDevices.length > 0 
    ? Math.round(onlineDevices.reduce((acc, device) => {
        let score = 100;
        if (device.data?.sensors.imu.angle_over_limit) score -= 30;
        if (device.data?.sensors.loadcell.overweight) score -= 20;
        if (device.data?.sensors.emg.over_threshold) score -= 15;
        if (device.data?.sensors.bme680.temperature_c > 35 || device.data?.sensors.bme680.temperature_c < 15) score -= 10;
        return acc + Math.max(score, 0);
      }, 0) / onlineDevices.length)
    : 95;

  const stats = [
    {
      title: 'Total Workers',
      value: totalWorkers.toString(),
      change: 'Connected workers',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Sensors',
      value: onlineDevices.length.toString(),
      change: `${devices.length - onlineDevices.length} offline`,
      icon: Wifi,
      color: onlineDevices.length === devices.length ? 'bg-green-500' : 'bg-yellow-500'
    },
    {
      title: 'Active Alerts',
      value: activeAlerts.length.toString(),
      change: 'Real-time monitoring',
      icon: AlertTriangle,
      color: activeAlerts.length > 0 ? 'bg-red-500' : 'bg-green-500'
    },
    {
      title: 'Safety Score',
      value: `${safetyScore}%`,
      change: 'Live calculation',
      icon: Shield,
      color: safetyScore >= 90 ? 'bg-green-500' : safetyScore >= 75 ? 'bg-yellow-500' : 'bg-red-500'
    }
  ];

  // Generate real-time activities from alerts and device status
  const recentActivities = React.useMemo(() => {
    const activities: Array<{
      id: string;
      type: string;
      message: string;
      time: string;
      severity: string;
    }> = [];

    // Add recent alerts
    alerts.slice(0, 3).forEach(alert => {
      activities.push({
        id: alert.id,
        type: 'alert',
        message: alert.description,
        time: getTimeAgo(alert.timestamp),
        severity: alert.severity === 'critical' || alert.severity === 'high' ? 'warning' : 'info'
      });
    });

    // Add device status changes
    devices.forEach(device => {
      const timeDiff = Date.now() - (device.lastSeen * 1000);
      if (timeDiff < 300000) { // Last 5 minutes
        activities.push({
          id: `device-${device.deviceId}`,
          type: 'sensor',
          message: `Device ${device.deviceId} ${device.isOnline ? 'came online' : 'went offline'}`,
          time: getTimeAgo(new Date(device.lastSeen * 1000)),
          severity: device.isOnline ? 'success' : 'warning'
        });
      }
    });

    return activities.slice(0, 4); // Show only 4 most recent
  }, [alerts, devices]);

  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }

  if (devicesLoading) {
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm md:text-base text-gray-600 mt-2">Welcome to the iSafe Admin Panel</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-gray-600 truncate">{stat.title}</p>
                  <p className="text-xl md:text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs md:text-sm text-gray-500 mt-1 truncate">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-2 md:p-3 rounded-lg flex-shrink-0`}>
                  <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activities and Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Recent Activities</h3>
          </div>
          <div className="p-4 md:p-6">
            <div className="space-y-3 md:space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-2 md:space-x-3">
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                    activity.severity === 'warning' ? 'bg-yellow-400' :
                    activity.severity === 'success' ? 'bg-green-400' :
                    activity.severity === 'info' ? 'bg-blue-400' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm text-gray-900 leading-relaxed">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Environmental Data */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Environmental Status</h3>
          </div>
          <div className="p-4 md:p-6">
            <div className="space-y-3 md:space-y-4">
              {onlineDevices.slice(0, 3).map(device => (
                <div key={device.deviceId} className="border rounded-lg p-3 md:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs md:text-sm font-medium text-gray-900 truncate">{device.deviceId}</span>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${device.isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {device.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  {device.data && (
                    <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                      <div className="flex items-center min-w-0">
                        <Thermometer className="h-3 w-3 md:h-4 md:w-4 text-red-500 mr-1 flex-shrink-0" />
                        <span className="truncate">{device.data.sensors.bme680.temperature_c.toFixed(1)}°C</span>
                      </div>
                      <div className="flex items-center min-w-0">
                        <Droplets className="h-3 w-3 md:h-4 md:w-4 text-blue-500 mr-1 flex-shrink-0" />
                        <span className="truncate">{device.data.sensors.bme680.humidity_pct.toFixed(1)}%</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-between text-xs text-gray-500 mt-1">
                        <span className="truncate">Posture: {device.data.sensors.imu.angle_over_limit ? 'Poor' : 'Good'}</span>
                        <span className="truncate">Weight: {device.data.sensors.loadcell.overweight ? 'Over' : 'Normal'}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {onlineDevices.length === 0 && (
                <div className="text-center text-gray-500 py-4 text-sm">
                  No devices online
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <button className="flex items-center space-x-2 md:space-x-3 p-3 md:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600 flex-shrink-0" />
            <span className="text-blue-900 font-medium text-sm md:text-base truncate">Add New Worker</span>
          </button>
          <button className="flex items-center space-x-2 md:space-x-3 p-3 md:p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
            <Wifi className="h-5 w-5 md:h-6 md:w-6 text-green-600 flex-shrink-0" />
            <span className="text-green-900 font-medium text-sm md:text-base truncate">Configure Sensor</span>
          </button>
          <button className="flex items-center space-x-2 md:space-x-3 p-3 md:p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors sm:col-span-2 md:col-span-1">
            <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-purple-600 flex-shrink-0" />
            <span className="text-purple-900 font-medium text-sm md:text-base truncate">Generate Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
