'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search,
  Activity,
  Scale,
  Zap,
  Thermometer,
  Eye,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AlertRecord } from '@/types/esp32';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type AlertFilter = 'all' | 'active' | 'acknowledged' | 'resolved';
type AlertType = 'all' | 'posture' | 'overweight' | 'emg' | 'environmental';

export default function WorkerAlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AlertFilter>('all');
  const [typeFilter, setTypeFilter] = useState<AlertType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch worker's alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        
        // Query alerts for this worker (without orderBy to avoid composite index)
        const q = query(
          collection(db, 'alerts'),
          where('workerId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const workerAlerts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate()
        })) as AlertRecord[];

        // Add status and additional metadata to alerts from hook (similar to admin)
        const alertsWithStatus = workerAlerts.map((alert, index) => ({
          ...alert,
          status: alert.resolved ? 'resolved' : (index % 3 === 0 ? 'acknowledged' : 'active'),
          workerName: user?.displayName || user?.email || 'Worker',
          sensorId: alert.deviceId
        }));

        // Sort in JavaScript instead of Firestore to avoid composite index
        alertsWithStatus.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        setAlerts(alertsWithStatus);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [user?.uid]);

  // Filter alerts (similar to admin filtering)
  const filteredAlerts = alerts.filter(alert => {
    // Filter by status
    if (filter === 'resolved' && alert.status !== 'resolved') return false;
    if (filter === 'active' && alert.status !== 'active') return false;
    if (filter === 'acknowledged' && alert.status !== 'acknowledged') return false;
    
    // Filter by type
    if (typeFilter !== 'all' && alert.type !== typeFilter) return false;
    
    // Filter by search term
    if (searchTerm && !alert.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !alert.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Get alert statistics (similar to admin)
  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'posture': return Activity;
      case 'overweight': return Scale;
      case 'emg': return Zap;
      case 'environmental': return Thermometer;
      default: return AlertTriangle;
    }
  };

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

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-red-400 text-white';
      case 'medium': return 'bg-yellow-400 text-white';
      case 'low': return 'bg-blue-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString();
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const markAsResolved = async (alertId: string) => {
    try {
      await updateDoc(doc(db, 'alerts', alertId), {
        resolved: true,
        resolvedAt: new Date()
      });
      
      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true, status: 'resolved' } : alert
      ));
    } catch (error) {
      console.error('Error marking alert as resolved:', error);
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Safety Alerts</h1>
        <p className="text-sm md:text-base text-gray-600 mt-2">Monitor your personal safety alerts and recommendations</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm text-gray-600 truncate">Total Alerts</p>
              <p className="text-xl md:text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-blue-600 flex-shrink-0" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm text-gray-600 truncate">Active</p>
              <p className="text-xl md:text-3xl font-bold text-red-600 mt-1">{stats.active}</p>
            </div>
            <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-red-600 flex-shrink-0" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm text-gray-600 truncate">Acknowledged</p>
              <p className="text-xl md:text-3xl font-bold text-yellow-600 mt-1">{stats.acknowledged}</p>
            </div>
            <Clock className="h-6 w-6 md:h-8 md:w-8 text-yellow-600 flex-shrink-0" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm text-gray-600 truncate">Resolved</p>
              <p className="text-xl md:text-3xl font-bold text-green-600 mt-1">{stats.resolved}</p>
            </div>
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">My Alert History</h3>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48 md:w-64"
              />
            </div>
            
            {/* Type Filter */}
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value as AlertType)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value="all">All Types</option>
              <option value="posture">Posture</option>
              <option value="overweight">Weight</option>
              <option value="emg">Muscle Activity</option>
              <option value="environmental">Environment</option>
            </select>
            
            {/* Status Filter */}
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as AlertFilter)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3 md:space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Alerts Found</h3>
              <p className="text-gray-600 mt-2">
                {searchTerm || typeFilter !== 'all' || filter !== 'all' 
                  ? 'No alerts match your current filters'
                  : 'Great work! You have no safety alerts.'}
              </p>
            </div>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const TypeIcon = getAlertIcon(alert.type);
            return (
              <div key={alert.id} className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-3 md:space-y-0">
                  <div className="flex items-start space-x-3 md:space-x-4 flex-1">
                    <div className={`p-2 rounded-lg ${getAlertColor(alert.severity)} flex-shrink-0`}>
                      <TypeIcon className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-2 mb-1">
                        <h4 className="text-base md:text-lg font-semibold text-gray-900 truncate">{alert.title}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityBadgeColor(alert.severity)} self-start md:self-auto`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-sm md:text-base text-gray-600 mb-2 leading-relaxed">{alert.description}</p>
                      
                      <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-4 text-xs md:text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {getTimeAgo(alert.timestamp)}
                        </span>
                        <span className="capitalize truncate">{alert.type} alert</span>
                        <span className="truncate">Device: {alert.deviceId}</span>
                        <span className="hidden md:inline truncate">{formatTime(alert.timestamp)}</span>
                      </div>

                      {alert.sensorData && (
                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
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
                  
                  <div className="flex items-center justify-between md:justify-end space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                      {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setSelectedAlert(alert);
                          setShowModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {alert.status === 'active' && (
                        <button
                          onClick={() => markAsResolved(alert.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Mark as resolved"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Alert Detail Modal */}
      {showModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Alert Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 md:p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getSeverityColor(selectedAlert.severity)}`}>
                  {React.createElement(getAlertIcon(selectedAlert.type), { className: "h-5 w-5" })}
                </div>
                <div>
                  <h4 className="text-base md:text-lg font-medium text-gray-900">{selectedAlert.title}</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityBadgeColor(selectedAlert.severity)}`}>
                    {selectedAlert.severity.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">Description</h5>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedAlert.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-900">Type:</span>
                  <span className="ml-2 text-gray-600 capitalize">{selectedAlert.type}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Device:</span>
                  <span className="ml-2 text-gray-600">{selectedAlert.deviceId}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Time:</span>
                  <span className="ml-2 text-gray-600">{formatTime(selectedAlert.timestamp)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Status:</span>
                  <span className="ml-2 text-gray-600 capitalize">{selectedAlert.status}</span>
                </div>
              </div>
              
              {selectedAlert.sensorData && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Sensor Data</h5>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="space-y-1 text-xs">
                      {selectedAlert.type === 'posture' && selectedAlert.sensorData.imu && (
                        <div>
                          <span className="font-medium">Posture:</span>
                          <span className="ml-2">Pitch: {selectedAlert.sensorData.imu.pitch_deg.toFixed(1)}°, Roll: {selectedAlert.sensorData.imu.roll_deg.toFixed(1)}°</span>
                        </div>
                      )}
                      {selectedAlert.type === 'overweight' && selectedAlert.sensorData.loadcell && (
                        <div>
                          <span className="font-medium">Weight:</span>
                          <span className="ml-2">{selectedAlert.sensorData.loadcell.weight_g}g</span>
                        </div>
                      )}
                      {selectedAlert.type === 'emg' && selectedAlert.sensorData.emg && (
                        <div>
                          <span className="font-medium">EMG:</span>
                          <span className="ml-2">Raw value: {selectedAlert.sensorData.emg.raw}</span>
                        </div>
                      )}
                      {selectedAlert.type === 'environmental' && selectedAlert.sensorData.bme680 && (
                        <div>
                          <span className="font-medium">Environment:</span>
                          <span className="ml-2">
                            Temp: {selectedAlert.sensorData.bme680.temperature_c.toFixed(1)}°C, 
                            Humidity: {selectedAlert.sensorData.bme680.humidity_pct.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 md:p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto"
              >
                Close
              </button>
              {selectedAlert.status === 'active' && (
                <button
                  onClick={() => {
                    markAsResolved(selectedAlert.id);
                    setShowModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
                >
                  Mark as Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
