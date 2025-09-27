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

type AlertFilter = 'all' | 'unresolved' | 'resolved';
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

        // Sort in JavaScript instead of Firestore to avoid composite index
        workerAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        setAlerts(workerAlerts);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [user?.uid]);

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    // Filter by resolution status
    if (filter === 'resolved' && !alert.resolved) return false;
    if (filter === 'unresolved' && alert.resolved) return false;
    
    // Filter by type
    if (typeFilter !== 'all' && alert.type !== typeFilter) return false;
    
    // Filter by search term
    if (searchTerm && !alert.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !alert.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Get alert statistics
  const stats = {
    total: alerts.length,
    unresolved: alerts.filter(a => !a.resolved).length,
    resolved: alerts.filter(a => a.resolved).length,
    today: alerts.filter(a => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return a.timestamp >= today;
    }).length
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

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
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
        alert.id === alertId ? { ...alert, resolved: true } : alert
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
        <h1 className="text-3xl font-bold text-gray-900">My Safety Alerts</h1>
        <p className="text-gray-600 mt-2">Monitor your safety alerts and recommendations</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Alerts</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unresolved</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.unresolved}</p>
            </div>
            <X className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.resolved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.today}</p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <h3 className="text-lg font-semibold text-gray-900">Alert History</h3>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
              />
            </div>
            
            {/* Type Filter */}
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value as AlertType)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="unresolved">Unresolved</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Alerts Found</h3>
            <p className="text-gray-600 mt-2">
              {searchTerm || typeFilter !== 'all' || filter !== 'all' 
                ? 'No alerts match your current filters'
                : 'Great work! You have no safety alerts.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAlerts.map((alert) => {
              const Icon = getAlertIcon(alert.type);
              return (
                <div key={alert.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${getAlertColor(alert.severity)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{alert.title}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityBadgeColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                          {alert.resolved && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Resolved
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{alert.description}</p>
                        
                        <div className="flex items-center text-xs text-gray-500 space-x-4">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {getTimeAgo(alert.timestamp)}
                          </span>
                          <span className="capitalize">{alert.type} alert</span>
                          <span>Device: {alert.deviceId}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedAlert(alert);
                          setShowModal(true);
                        }}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {!alert.resolved && (
                        <button
                          onClick={() => markAsResolved(alert.id)}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
            
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getAlertColor(selectedAlert.severity)}`}>
                  {React.createElement(getAlertIcon(selectedAlert.type), { className: "h-5 w-5" })}
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{selectedAlert.title}</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityBadgeColor(selectedAlert.severity)}`}>
                    {selectedAlert.severity.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">Description</h5>
                <p className="text-sm text-gray-600">{selectedAlert.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
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
                  <span className="ml-2 text-gray-600">{selectedAlert.timestamp.toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Status:</span>
                  <span className="ml-2 text-gray-600">{selectedAlert.resolved ? 'Resolved' : 'Active'}</span>
                </div>
              </div>
              
              {selectedAlert.sensorData && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Sensor Data</h5>
                  <div className="bg-gray-50 rounded-lg p-3 text-xs">
                    <pre className="text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(selectedAlert.sensorData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {!selectedAlert.resolved && (
                <button
                  onClick={() => {
                    markAsResolved(selectedAlert.id);
                    setShowModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
