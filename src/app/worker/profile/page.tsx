'use client';

import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Wifi, 
  WifiOff,
  Edit,
  Save,
  X,
  Activity,
  Clock,
  Target,
  Settings,
  Bell,
  Lock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerSensorData, useWorkerStats } from '@/hooks/useWorkerSensor';
import { useESP32Data } from '@/hooks/useESP32';
import { UserService } from '@/services/userService';

const userService = new UserService();

export default function WorkerProfilePage() {
  const { user, logout } = useAuth();
  const { assignment, loading: assignmentLoading } = useWorkerSensorData(user?.uid);
  const { stats } = useWorkerStats(user?.uid, 30); // Last 30 days
  const { devices } = useESP32Data();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [updating, setUpdating] = useState(false);
  const [notifications, setNotifications] = useState({
    safetyAlerts: true,
    breakReminders: true,
    shiftUpdates: false,
    weeklyReports: true
  });

  // Get sensor data for the assigned sensor
  const assignedSensor = assignment ? devices.find(d => d.deviceId === assignment.sensorId) : null;

  const handleUpdateProfile = async () => {
    if (!user || !displayName.trim()) return;
    
    try {
      setUpdating(true);
      await userService.updateUser(user.uid, { displayName: displayName.trim() });
      setIsEditing(false);
      // The user context will be updated automatically through Firebase auth state change
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getJoinedDate = () => {
    if (!user?.createdAt) return 'Unknown';
    return user.createdAt.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getTotalWorkingDays = () => {
    if (!user?.createdAt) return 0;
    const now = new Date();
    const joined = new Date(user.createdAt);
    const diffInDays = Math.floor((now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  if (assignmentLoading) {
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
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Manage your personal information and preferences</p>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
        </div>
        <div className="p-6">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {(user?.displayName || user?.email || '').charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            
            {/* Profile Details */}
            <div className="flex-1 space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your display name"
                    />
                    <button
                      onClick={handleUpdateProfile}
                      disabled={updating}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setDisplayName(user?.displayName || '');
                      }}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-medium text-gray-900">
                      {user?.displayName || 'No name set'}
                    </span>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 text-gray-500 hover:text-gray-700 rounded"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">{user?.email}</span>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-900 capitalize">{user?.role}</span>
                </div>
              </div>

              {/* Joined Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">{getJoinedDate()}</span>
                  <span className="text-sm text-gray-500">({getTotalWorkingDays()} days)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Assignment */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Assigned Sensor</h3>
        </div>
        <div className="p-6">
          {assignment ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {assignedSensor?.isOnline ? (
                    <Wifi className="h-6 w-6 text-green-500" />
                  ) : (
                    <WifiOff className="h-6 w-6 text-red-500" />
                  )}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{assignment.sensorId}</h4>
                    <p className="text-sm text-gray-600">
                      Assigned on {assignment.assignedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  assignedSensor?.isOnline 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {assignedSensor?.isOnline ? 'Online' : 'Offline'}
                </div>
              </div>

              {assignedSensor?.data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.abs(assignedSensor.data.sensors.imu.pitch_deg).toFixed(1)}°
                    </div>
                    <p className="text-sm text-gray-600">Current Tilt</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {(assignedSensor.data.sensors.loadcell.weight_g / 1000).toFixed(1)}kg
                    </div>
                    <p className="text-sm text-gray-600">Current Load</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {assignedSensor.data.sensors.bme680.temperature_c.toFixed(1)}°C
                    </div>
                    <p className="text-sm text-gray-600">Temperature</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <WifiOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900">No Sensor Assigned</h4>
              <p className="text-gray-600 mt-2">Contact your supervisor to get a sensor assigned.</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Summary */}
      {stats && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Performance Summary (Last 30 Days)</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalWorkingTime.toFixed(1)}h</div>
                <p className="text-sm text-gray-600">Total Hours</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalSessions}</div>
                <p className="text-sm text-gray-600">Work Sessions</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-8 w-8 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalAlerts}</div>
                <p className="text-sm text-gray-600">Safety Alerts</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Shield className={`h-8 w-8 ${
                    stats.safetyScore >= 90 ? 'text-green-500' :
                    stats.safetyScore >= 75 ? 'text-yellow-500' : 'text-red-500'
                  }`} />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.safetyScore}%</div>
                <p className="text-sm text-gray-600">Safety Score</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notification Preferences
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {key === 'safetyAlerts' && 'Safety Alerts'}
                    {key === 'breakReminders' && 'Break Reminders'}
                    {key === 'shiftUpdates' && 'Shift Updates'}
                    {key === 'weeklyReports' && 'Weekly Reports'}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {key === 'safetyAlerts' && 'Receive notifications for safety violations'}
                    {key === 'breakReminders' && 'Get reminded to take regular breaks'}
                    {key === 'shiftUpdates' && 'Notifications about shift changes'}
                    {key === 'weeklyReports' && 'Weekly performance and safety summaries'}
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, [key]: !value }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Security & Privacy
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Data Privacy</h4>
                <p className="text-xs text-gray-600">Your safety data is encrypted and secured</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Protected
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Account Status</h4>
                <p className="text-xs text-gray-600">Your account is active and verified</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={logout}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
