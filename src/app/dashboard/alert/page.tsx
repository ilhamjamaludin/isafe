'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, X, Eye, Thermometer, Activity } from 'lucide-react';
import { useESP32Alerts } from '@/hooks/useESP32';
import { useAuth } from '@/contexts/AuthContext';

export default function AlertPage() {
  const [filter, setFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const { alerts } = useESP32Alerts();
  const { user } = useAuth();

  // Add status and additional metadata to alerts from hook
  const alertData = React.useMemo(() => {
    const allAlerts = alerts.map((alert, index) => ({
      ...alert,
      status: alert.resolved ? 'resolved' : (index % 3 === 0 ? 'acknowledged' : 'active'),
      workerName: alert.workerId ? `Worker ${alert.workerId}` : null,
      sensorId: alert.deviceId
    }));
    
    // Filter alerts for workers to show only their own alerts
    if (user?.role === 'worker') {
      return allAlerts.filter(alert => alert.workerId === user.uid);
    }
    
    return allAlerts;
  }, [alerts, user]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-100';
      case 'acknowledged': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'posture': return AlertTriangle;
      case 'overweight': return Activity;
      case 'emg': return Activity;
      case 'environmental': return Thermometer;
      case 'sensor': return Clock;
      case 'system': return CheckCircle;
      default: return AlertTriangle;
    }
  };

  const filteredData = alertData.filter(alert => {
    const statusMatch = filter === 'all' || alert.status === filter;
    const severityMatch = severityFilter === 'all' || alert.severity === severityFilter;
    return statusMatch && severityMatch;
  });

  const stats = {
    total: alertData.length,
    active: alertData.filter(a => a.status === 'active').length,
    acknowledged: alertData.filter(a => a.status === 'acknowledged').length,
    resolved: alertData.filter(a => a.status === 'resolved').length,
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString();
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Alert Management</h1>
        <p className="text-sm md:text-base text-gray-700 mt-2">
          {user?.role === 'worker' 
            ? 'View your safety alerts in real-time' 
            : 'Monitor and manage safety alerts in real-time'}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm text-gray-700 truncate">Total Alerts</p>
              <p className="text-xl md:text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-blue-600 flex-shrink-0" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm text-gray-700 truncate">Active</p>
              <p className="text-xl md:text-3xl font-bold text-red-600 mt-1">{stats.active}</p>
            </div>
            <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-red-600 flex-shrink-0" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm text-gray-700 truncate">Acknowledged</p>
              <p className="text-xl md:text-3xl font-bold text-yellow-600 mt-1">{stats.acknowledged}</p>
            </div>
            <Clock className="h-6 w-6 md:h-8 md:w-8 text-yellow-600 flex-shrink-0" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm text-gray-700 truncate">Resolved</p>
              <p className="text-xl md:text-3xl font-bold text-green-600 mt-1">{stats.resolved}</p>
            </div>
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">Alert History</h3>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-4">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto text-gray-800"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
            <select 
              value={severityFilter} 
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto text-gray-800"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="warning">Warning</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Worker Info Box */}
      {user?.role === 'worker' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm text-blue-800 font-medium">Worker View</p>
              <p className="text-sm text-blue-700 mt-1">
                You are viewing only alerts related to your assigned sensor and activities.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-3 md:space-y-4">
        {filteredData.map((alert) => {
          const TypeIcon = getTypeIcon(alert.type);
          return (
            <div key={alert.id} className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-3 md:space-y-0">
                <div className="flex items-start space-x-3 md:space-x-4 flex-1">
                  <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)} flex-shrink-0`}>
                    <TypeIcon className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-2 mb-1">
                      <h4 className="text-base md:text-lg font-semibold text-gray-900 truncate">{alert.title}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)} self-start md:self-auto`}>
                        {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm md:text-base text-gray-800 mb-2 leading-relaxed">{alert.description}</p>
                    <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-4 text-xs md:text-sm text-gray-700">
                      {alert.workerName && (
                        <span className="truncate">Worker: <span className="font-medium text-gray-700">{alert.workerName}</span></span>
                      )}
                      <span className="truncate">Device: <span className="font-medium text-gray-700">{alert.deviceId}</span></span>
                      <span className="hidden md:inline truncate">{formatTime(alert.timestamp)}</span>
                      <span className="truncate">({getTimeAgo(alert.timestamp)})</span>
                    </div>
                    {alert.sensorData && (
                      <div className="mt-2 text-xs text-gray-800 bg-gray-50 rounded p-2">
                        <strong>Sensor Data:</strong>{' '}
                        {alert.type === 'posture' && alert.sensorData.imu && (
                          <span>Pitch: {alert.sensorData.imu.pitch_deg.toFixed(1)}°, Roll: {alert.sensorData.imu.roll_deg.toFixed(1)}°</span>
                        )}
                        {alert.type === 'overweight' && alert.sensorData.loadcell && (
                          <span>Weight: {alert.sensorData.loadcell.weight_g}g</span>
                        )}
                        {alert.type === 'emg' && alert.sensorData.emg && (
                          <span>EMG Raw: {alert.sensorData.emg.raw}</span>
                        )}
                        {alert.type === 'environmental' && alert.sensorData.bme680 && (
                          <span>Temp: {alert.sensorData.bme680.temperature_c.toFixed(1)}°C, Humidity: {alert.sensorData.bme680.humidity_pct.toFixed(1)}%</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end space-x-2 md:space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                    {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                  </span>
                  <div className="flex space-x-1">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    {alert.status === 'active' && (
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
