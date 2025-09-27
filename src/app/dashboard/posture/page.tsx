'use client';

import React, { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, Filter } from 'lucide-react';
import { useESP32Data } from '@/hooks/useESP32';

export default function PosturePage() {
  const [filter, setFilter] = useState('all');
  const { devices, loading } = useESP32Data();

  // Transform ESP32 data to posture data
  const postureData = React.useMemo(() => {
    return devices.map((device, index) => {
      const angle = device.data ? Math.abs(device.data.sensors.imu.pitch_deg) : 0;
      const duration = device.data ? device.data.sensors.imu.angle_duration_ms : 0;
      
      let status = 'good';
      let alerts = 0;
      
      if (device.data?.sensors.imu.angle_over_limit) {
        if (duration > 300000) { // 5 minutes
          status = 'critical';
          alerts = Math.floor(duration / 60000); // One alert per minute over limit
        } else {
          status = 'warning';
          alerts = 1;
        }
      }

      return {
        id: index + 1,
        workerId: device.deviceId,
        workerName: `Worker ${device.deviceId}`,
        status,
        angle: Math.round(angle * 100) / 100,
        duration: formatDuration(duration),
        lastUpdate: getTimeAgo(new Date(device.lastSeen * 1000)),
        alerts,
        isOnline: device.isOnline,
        rawData: device.data
      };
    });
  }, [devices]);

  function formatDuration(ms: number): string {
    if (ms === 0) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

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
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return CheckCircle;
      case 'warning': return Clock;
      case 'critical': return AlertTriangle;
      default: return Activity;
    }
  };

  const filteredData = filter === 'all' 
    ? postureData 
    : postureData.filter(item => item.status === filter);

  const stats = {
    good: postureData.filter(item => item.status === 'good').length,
    warning: postureData.filter(item => item.status === 'warning').length,
    critical: postureData.filter(item => item.status === 'critical').length,
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
        <h1 className="text-3xl font-bold text-gray-900">Posture Monitoring</h1>
        <p className="text-gray-600 mt-2">Real-time worker posture analysis and alerts</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Workers</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{postureData.length}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Good Posture</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.good}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Warnings</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.warning}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.critical}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Worker Status</h3>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="good">Good</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bend Angle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alerts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Update
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((worker) => {
                const StatusIcon = getStatusIcon(worker.status);
                return (
                  <tr key={worker.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {worker.workerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {worker.workerId}
                        </div>
                        <div className="text-xs text-gray-400">
                          {worker.isOnline ? (
                            <span className="text-green-600">● Online</span>
                          ) : (
                            <span className="text-red-600">● Offline</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(worker.status)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {worker.status.charAt(0).toUpperCase() + worker.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{worker.angle}°</div>
                      {worker.rawData && (
                        <div className="text-xs text-gray-500">
                          Roll: {worker.rawData.sensors.imu.roll_deg.toFixed(1)}°
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{worker.duration}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {worker.alerts > 0 ? (
                          <span className="text-red-600 font-medium">{worker.alerts}</span>
                        ) : (
                          <span className="text-green-600">0</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{worker.lastUpdate}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
