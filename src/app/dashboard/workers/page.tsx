'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  UserCheck,
  AlertTriangle,
  Calendar,
  Mail,
  Clock,
  Wifi,
  WifiOff,
  Play,
  Square,
  Settings,
  Activity,
  Thermometer,
  X,
  Save
} from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { CustomUser, WorkerSensorAssignment } from '@/types/user';
import { useWorkerSensorAssignments, useAvailableSensors, useWorkerDataSync } from '@/hooks/useWorkerSensor';
import { useESP32Data } from '@/hooks/useESP32';

export default function WorkersPage() {
  const { user: currentUser } = useAuth();
  const { users: allUsers, loading, error, updateUser, deleteUser } = useUsers();
  
  // Filter users to get only workers
  const workers = allUsers.filter(user => user.role === 'worker');
  
  // Worker-Sensor integration hooks
  const { assignments, assignSensor, unassignSensor } = useWorkerSensorAssignments();
  const { devices: esp32Devices } = useESP32Data();
  const { availableSensors } = useAvailableSensors();
  
  // Enable automatic data syncing for active workers
  useWorkerDataSync();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [editingWorker, setEditingWorker] = useState<CustomUser | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSensorModal, setShowSensorModal] = useState(false);
  const [selectedWorkerForSensor, setSelectedWorkerForSensor] = useState<CustomUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedSensorId, setSelectedSensorId] = useState('');

  // Calculate time since registration for each worker
  const getTimeSince = (date: Date): string => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  // Helper functions
  const getWorkerAssignment = (workerId: string): WorkerSensorAssignment | undefined => {
    return assignments.find(a => a.workerId === workerId);
  };

  const getSensorData = (sensorId: string) => {
    return esp32Devices.find(d => d.deviceId === sensorId);
  };

  const isWorkerActive = (worker: CustomUser): boolean => {
    const assignment = getWorkerAssignment(worker.uid);
    if (!assignment) return false;
    
    const sensorData = getSensorData(assignment.sensorId);
    return sensorData?.isOnline || false;
  };

  // Filter workers based on search term
  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = 
      (worker.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: workers.length,
    assigned: workers.filter(w => getWorkerAssignment(w.uid)).length,
    active: workers.filter(w => isWorkerActive(w)).length,
    withSensors: assignments.length
  };

  const handleEdit = (worker: CustomUser) => {
    setEditingWorker(worker);
    setShowModal(true);
  };

  const handleDelete = async (worker: CustomUser) => {
    if (worker.uid === currentUser?.uid) {
      alert('You cannot delete your own account');
      return;
    }

    if (confirm(`Are you sure you want to delete ${worker.displayName || worker.email}?`)) {
      try {
        setActionLoading(true);
        await deleteUser(worker.uid);
      } catch (err) {
        console.error('Error deleting worker:', err);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleUpdateDisplayName = async (worker: CustomUser, newDisplayName: string) => {
    if (!newDisplayName.trim()) return;
    
    try {
      setActionLoading(true);
      await updateUser(worker.uid, { displayName: newDisplayName });
      setShowModal(false);
      setEditingWorker(null);
    } catch (err) {
      console.error('Error updating worker:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Sensor assignment handlers
  const handleAssignSensor = (worker: CustomUser) => {
    setSelectedWorkerForSensor(worker);
    setSelectedSensorId('');
    setShowSensorModal(true);
  };

  const handleSensorAssignment = async () => {
    if (!selectedWorkerForSensor || !selectedSensorId || !currentUser) return;
    
    try {
      setActionLoading(true);
      await assignSensor(
        selectedWorkerForSensor.uid,
        selectedWorkerForSensor.email,
        selectedWorkerForSensor.displayName || selectedWorkerForSensor.email,
        selectedSensorId,
        currentUser.uid,
        undefined // notes parameter - explicitly set as undefined for clarity
      );
      setShowSensorModal(false);
      setSelectedWorkerForSensor(null);
      setSelectedSensorId('');
    } catch (err) {
      console.error('Error assigning sensor:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassignSensor = async (worker: CustomUser) => {
    if (confirm(`Are you sure you want to unassign the sensor from ${worker.displayName || worker.email}?`)) {
      try {
        setActionLoading(true);
        await unassignSensor(worker.uid);
      } catch (err) {
        console.error('Error unassigning sensor:', err);
      } finally {
        setActionLoading(false);
      }
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
        <h1 className="text-3xl font-bold text-gray-900">Workers</h1>
        <p className="text-gray-600 mt-2">Manage worker accounts and profiles</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Workers</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <UserCheck className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">With Sensors</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.assigned}</p>
            </div>
            <Wifi className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Currently Active</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available Sensors</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{availableSensors.length}</p>
            </div>
            <Settings className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Worker List</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search workers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
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
                  Sensor Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Real-time Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWorkers.map((worker) => {
                const assignment = getWorkerAssignment(worker.uid);
                const sensorData = assignment ? getSensorData(assignment.sensorId) : null;
                const isActive = isWorkerActive(worker);
                
                return (
                  <tr key={worker.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {(worker.displayName || worker.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {worker.displayName || 'No Name Set'}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {worker.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Sensor Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assignment ? (
                        <div className="space-y-1">
                          <div className="flex items-center">
                            {sensorData?.isOnline ? (
                              <Wifi className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <WifiOff className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {assignment.sensorId}
                            </span>
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center ${
                            isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {isActive ? (
                              <><Activity className="h-3 w-3 mr-1" /> Active</>
                            ) : (
                              <><Square className="h-3 w-3 mr-1" /> Offline</>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No sensor assigned</span>
                      )}
                    </td>
                    
                    {/* Real-time Data */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sensorData && sensorData.data && sensorData.isOnline && sensorData.data.sensors ? (
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center">
                              <Thermometer className="h-3 w-3 text-red-500 mr-1" />
                              {sensorData.data.sensors.bme680?.temperature_c?.toFixed(1) || 'N/A'}°C
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Posture: {sensorData.data.sensors.imu?.angle_over_limit ? 
                              <span className="text-red-600 font-medium">⚠ Poor</span> : 
                              <span className="text-green-600 font-medium">✓ Good</span>
                            }
                          </div>
                          <div className="text-xs text-gray-500">
                            Weight: {sensorData.data.sensors.loadcell?.overweight ? 
                              <span className="text-red-600 font-medium">⚠ Over</span> : 
                              <span className="text-green-600 font-medium">✓ Normal</span>
                            }
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          {assignment ? 'Sensor offline' : 'No data available'}
                        </span>
                      )}
                    </td>
                    
                    {/* Registered */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <div>
                          <div>{worker.createdAt.toLocaleDateString()}</div>
                          <div className="text-xs">{getTimeSince(worker.createdAt)}</div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {assignment ? (
                        <button
                          onClick={() => handleUnassignSensor(worker)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          disabled={actionLoading}
                          title="Unassign sensor"
                        >
                          <WifiOff className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAssignSensor(worker)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          disabled={actionLoading || availableSensors.length === 0}
                          title="Assign sensor"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleEdit(worker)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        disabled={actionLoading}
                        title="Edit worker name"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      {worker.uid !== currentUser?.uid && (
                        <button
                          onClick={() => handleDelete(worker)}
                          className="text-red-600 hover:text-red-900 transition-colors ml-2"
                          disabled={actionLoading}
                          title="Delete worker"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredWorkers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No workers found matching your search' : 'No workers registered yet'}
            </div>
          )}
        </div>
      </div>

      {/* Edit Worker Modal */}
      {showModal && editingWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Worker</h3>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const newDisplayName = formData.get('displayName') as string;
                handleUpdateDisplayName(editingWorker, newDisplayName);
              }} 
              className="p-6 space-y-4"
            >
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Read-only)
                </label>
                <input
                  type="email"
                  id="email"
                  value={editingWorker.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  defaultValue={editingWorker.displayName || ''}
                  placeholder="Enter worker's display name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role (Read-only)
                </label>
                <input
                  type="text"
                  id="role"
                  value="Worker"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 capitalize"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingWorker(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <span>{actionLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sensor Assignment Modal */}
      {showSensorModal && selectedWorkerForSensor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Assign Sensor</h3>
              <p className="text-sm text-gray-600 mt-1">
                Assign a sensor to {selectedWorkerForSensor.displayName || selectedWorkerForSensor.email}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="sensorSelect" className="block text-sm font-medium text-gray-700 mb-2">
                  Available Sensors
                </label>
                <select
                  id="sensorSelect"
                  value={selectedSensorId}
                  onChange={(e) => setSelectedSensorId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a sensor...</option>
                  {availableSensors.map((sensorId) => {
                    const sensorDevice = esp32Devices.find(d => d.deviceId === sensorId);
                    return (
                      <option key={sensorId} value={sensorId}>
                        {sensorId} {sensorDevice?.isOnline ? '(Online)' : '(Offline)'}
                      </option>
                    );
                  })}
                </select>
                {availableSensors.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">No sensors available. All sensors are already assigned.</p>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSensorModal(false);
                    setSelectedWorkerForSensor(null);
                    setSelectedSensorId('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={actionLoading}
                >
                  <X className="h-4 w-4 mr-2 inline" />
                  Cancel
                </button>
                <button
                  onClick={handleSensorAssignment}
                  disabled={actionLoading || !selectedSensorId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{actionLoading ? 'Assigning...' : 'Assign Sensor'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Activity className="h-5 w-5 text-green-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Worker-Sensor Integration</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                Workers can now be paired with sensors for real-time monitoring. Once assigned and active, 
                sensor data is automatically saved to Firestore every 10 seconds for detailed reporting and analysis.
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
                <li>Assign sensors using the settings button</li>
                <li>Monitor real-time posture and environmental data</li>
                <li>Data automatically archived for reports</li>
                <li>Safety alerts generated based on sensor thresholds</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
