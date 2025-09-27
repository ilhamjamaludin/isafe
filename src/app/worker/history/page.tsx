'use client';

import React, { useState } from 'react';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Shield,
  Target,
  BarChart3,
  Download,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerStats, useWorkerSensor } from '@/hooks/useWorkerSensor';

type TimeRange = '7' | '30' | '90';

export default function WorkerHistoryPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('7');
  const { stats, loading: statsLoading } = useWorkerStats(user?.uid, parseInt(timeRange));
  const { sessions, loading: sessionsLoading } = useWorkerSensor(user?.uid || '');

  // Calculate additional metrics
  const metrics = React.useMemo(() => {
    if (!stats || !sessions) return null;

    const recentSessions = sessions.filter(session => {
      const daysAgo = (Date.now() - session.startTime.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= parseInt(timeRange);
    });

    const completedSessions = recentSessions.filter(s => s.endTime);
    const averageSessionLength = completedSessions.length > 0 
      ? completedSessions.reduce((acc, session) => acc + (session.duration || 0), 0) / completedSessions.length / (1000 * 60 * 60)
      : 0;

    // Calculate trends (comparing with previous period)
    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(previousPeriodStart.getDate() - parseInt(timeRange) * 2);
    const previousPeriodEnd = new Date();
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - parseInt(timeRange));

    const previousSessions = sessions.filter(session => {
      return session.startTime >= previousPeriodStart && session.startTime < previousPeriodEnd;
    });

    const previousWorkingHours = previousSessions.reduce((acc, session) => {
      return acc + ((session.duration || 0) / (1000 * 60 * 60));
    }, 0);

    const previousAlerts = previousSessions.reduce((acc, session) => {
      return acc + (session.totalAlerts || 0);
    }, 0);

    return {
      ...stats,
      averageSessionLength,
      trends: {
        workingHours: previousWorkingHours > 0 ? ((stats.totalWorkingTime - previousWorkingHours) / previousWorkingHours) * 100 : 0,
        alerts: previousAlerts > 0 ? ((stats.totalAlerts - previousAlerts) / previousAlerts) * 100 : 0,
        sessions: previousSessions.length > 0 ? ((stats.totalSessions - previousSessions.length) / previousSessions.length) * 100 : 0,
      }
    };
  }, [stats, sessions, timeRange]);

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatDuration = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTrendIcon = (trend: number) => {
    if (Math.abs(trend) < 1) return null;
    return trend > 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getTrendColor = (trend: number, isPositiveGood = true) => {
    if (Math.abs(trend) < 1) return 'text-gray-600';
    const isPositive = trend > 0;
    return (isPositive === isPositiveGood) ? 'text-green-600' : 'text-red-600';
  };

  if (statsLoading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Work History & Statistics</h1>
          <p className="text-gray-600 mt-2">Track your performance and safety metrics over time</p>
        </div>
        
        {/* Time Range Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Working Hours */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Working Hours</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.totalWorkingTime.toFixed(1)}h</p>
                <div className="flex items-center mt-2">
                  {getTrendIcon(metrics.trends.workingHours)}
                  <span className={`text-xs ml-1 ${getTrendColor(metrics.trends.workingHours)}`}>
                    {Math.abs(metrics.trends.workingHours).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Safety Score */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Safety Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.safetyScore}%</p>
                <p className="text-xs text-gray-500 mt-2">
                  {metrics.safetyScore >= 90 ? 'Excellent' : metrics.safetyScore >= 75 ? 'Good' : 'Needs improvement'}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                metrics.safetyScore >= 90 ? 'bg-green-500' : 
                metrics.safetyScore >= 75 ? 'bg-yellow-500' : 'bg-red-500'
              }`}>
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Total Sessions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Work Sessions</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.totalSessions}</p>
                <div className="flex items-center mt-2">
                  {getTrendIcon(metrics.trends.sessions)}
                  <span className={`text-xs ml-1 ${getTrendColor(metrics.trends.sessions)}`}>
                    {Math.abs(metrics.trends.sessions).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Total Alerts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Safety Alerts</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.totalAlerts}</p>
                <div className="flex items-center mt-2">
                  {getTrendIcon(metrics.trends.alerts)}
                  <span className={`text-xs ml-1 ${getTrendColor(metrics.trends.alerts, false)}`}>
                    {Math.abs(metrics.trends.alerts).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Summary */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Performance Summary
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Average Session Length</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {metrics.averageSessionLength.toFixed(1)}h
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Alerts per Session</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {metrics.totalSessions > 0 ? (metrics.totalAlerts / metrics.totalSessions).toFixed(1) : '0'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Productivity Score</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {Math.max(0, 100 - (metrics.totalAlerts * 2))}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Hours per Day</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {(metrics.totalWorkingTime / parseInt(timeRange)).toFixed(1)}h
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Insights */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Safety Insights
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Safety recommendations based on data */}
                {metrics.safetyScore >= 90 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">Excellent Safety Performance!</p>
                    <p className="text-xs text-green-600 mt-1">Keep up the great work maintaining safe work practices.</p>
                  </div>
                )}
                
                {metrics.safetyScore >= 75 && metrics.safetyScore < 90 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium">Good Safety Performance</p>
                    <p className="text-xs text-yellow-600 mt-1">Consider focusing on posture and lifting techniques to improve your safety score.</p>
                  </div>
                )}
                
                {metrics.safetyScore < 75 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">Safety Improvement Needed</p>
                    <p className="text-xs text-red-600 mt-1">Please review safety protocols and consider additional training.</p>
                  </div>
                )}
                
                {metrics.totalAlerts > 10 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">Alert Frequency Notice</p>
                    <p className="text-xs text-blue-600 mt-1">You&apos;ve had {metrics.totalAlerts} alerts recently. Focus on proper ergonomics and taking regular breaks.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session History */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Work Sessions</h3>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export Data</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alerts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Safety Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.slice(0, 10).map((session) => {
                const sessionSafetyScore = session.safetyScore || (100 - (session.totalAlerts * 5));
                return (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {session.startTime.toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.startTime.toLocaleTimeString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {session.duration ? formatDuration(session.duration) : 'In progress'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{session.totalAlerts}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.endTime 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {session.endTime ? 'Completed' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        sessionSafetyScore >= 90 ? 'text-green-600' :
                        sessionSafetyScore >= 75 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {sessionSafetyScore.toFixed(0)}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {sessions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No work sessions recorded yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
