'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  Activity,
  Shield,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Minus,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerStats, useWorkerSensor } from '@/hooks/useWorkerSensor';

type ReportTimeRange = '7' | '30' | '90' | '365';

export default function WorkerReportPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<ReportTimeRange>('30');
  const { stats, loading: statsLoading } = useWorkerStats(user?.uid, parseInt(timeRange));
  const { sessions, loading: sessionsLoading } = useWorkerSensor(user?.uid || '');

  // Calculate comprehensive metrics
  const reportData = React.useMemo(() => {
    if (!stats || !sessions) return null;

    const days = parseInt(timeRange);
    const recentSessions = sessions.filter(session => {
      const daysAgo = (Date.now() - session.startTime.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= days;
    });

    // Calculate weekly breakdown for charts
    const weeks = Math.ceil(days / 7);
    const weeklyData = Array.from({ length: weeks }, (_, index) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (weeks - index) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekSessions = recentSessions.filter(session => 
        session.startTime >= weekStart && session.startTime < weekEnd
      );

      const weekHours = weekSessions.reduce((acc, session) => 
        acc + ((session.duration || 0) / (1000 * 60 * 60)), 0
      );

      const weekAlerts = weekSessions.reduce((acc, session) => 
        acc + (session.totalAlerts || 0), 0
      );

      return {
        week: `Week ${index + 1}`,
        hours: weekHours,
        alerts: weekAlerts,
        sessions: weekSessions.length,
        safetyScore: weekAlerts > 0 ? Math.max(0, 100 - (weekAlerts * 5)) : 100
      };
    });

    // Safety trends
    const avgDailyHours = stats.totalWorkingTime / days;
    const avgDailyAlerts = stats.totalAlerts / days;
    const alertsPerHour = stats.totalWorkingTime > 0 ? stats.totalAlerts / stats.totalWorkingTime : 0;

    // Risk categories
    const postureRisk = alertsPerHour > 2 ? 'high' : alertsPerHour > 1 ? 'medium' : 'low';
    const workloadRisk = avgDailyHours > 8 ? 'high' : avgDailyHours > 6 ? 'medium' : 'low';
    const overallRisk = stats.safetyScore < 70 ? 'high' : stats.safetyScore < 85 ? 'medium' : 'low';

    return {
      ...stats,
      weeklyData,
      avgDailyHours,
      avgDailyAlerts,
      alertsPerHour,
      risks: {
        posture: postureRisk,
        workload: workloadRisk,
        overall: overallRisk
      }
    };
  }, [stats, sessions, timeRange]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (Math.abs(current - previous) < 0.1) return <Minus className="h-4 w-4 text-gray-600" />;
    return current > previous ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const generatePDF = () => {
    // Placeholder for PDF generation
    console.log('Generating PDF report...');
    alert('PDF report generation will be implemented soon!');
  };

  if (statsLoading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health & Safety Report</h1>
          <p className="text-gray-600 mt-2">No data available for report generation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health & Safety Report</h1>
          <p className="text-gray-600 mt-2">Comprehensive analysis of your workplace safety performance</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as ReportTimeRange)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 12 months</option>
          </select>
          
          <button
            onClick={generatePDF}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center h-16 w-16 rounded-full mb-3 ${
              reportData.safetyScore >= 90 ? 'bg-green-100' :
              reportData.safetyScore >= 75 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <Shield className={`h-8 w-8 ${
                reportData.safetyScore >= 90 ? 'text-green-600' :
                reportData.safetyScore >= 75 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{reportData.safetyScore}%</div>
            <p className="text-sm text-gray-600">Overall Safety Score</p>
            <p className="text-xs mt-1 text-gray-500">
              {reportData.safetyScore >= 90 ? 'Excellent' :
               reportData.safetyScore >= 75 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-3">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{reportData.totalWorkingTime.toFixed(1)}h</div>
            <p className="text-sm text-gray-600">Total Work Hours</p>
            <p className="text-xs mt-1 text-gray-500">
              {reportData.avgDailyHours.toFixed(1)}h daily average
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-3">
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{reportData.totalSessions}</div>
            <p className="text-sm text-gray-600">Work Sessions</p>
            <p className="text-xs mt-1 text-gray-500">
              {reportData.averageSessionTime.toFixed(1)}h avg length
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-3">
              <Target className="h-8 w-8 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{reportData.totalAlerts}</div>
            <p className="text-sm text-gray-600">Safety Alerts</p>
            <p className="text-xs mt-1 text-gray-500">
              {reportData.alertsPerHour.toFixed(1)} per hour
            </p>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Risk Assessment</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${getRiskColor(reportData.risks.posture)}`}>
                Posture Risk: {reportData.risks.posture.toUpperCase()}
              </div>
              <p className="text-xs text-gray-600">
                Based on posture alerts and angle measurements
              </p>
            </div>
            
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${getRiskColor(reportData.risks.workload)}`}>
                Workload Risk: {reportData.risks.workload.toUpperCase()}
              </div>
              <p className="text-xs text-gray-600">
                Based on daily working hours and session length
              </p>
            </div>
            
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${getRiskColor(reportData.risks.overall)}`}>
                Overall Risk: {reportData.risks.overall.toUpperCase()}
              </div>
              <p className="text-xs text-gray-600">
                Combined assessment of all safety factors
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Performance Chart */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Weekly Performance Trends</h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {reportData.weeklyData.map((week, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{week.week}</h4>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600">{week.hours.toFixed(1)}h worked</span>
                    <span className="text-gray-600">{week.alerts} alerts</span>
                    <span className={`font-medium ${
                      week.safetyScore >= 90 ? 'text-green-600' :
                      week.safetyScore >= 75 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {week.safetyScore}% safety
                    </span>
                  </div>
                </div>
                
                {/* Visual progress bars */}
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Work Hours</span>
                      <span>{week.hours.toFixed(1)}h</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((week.hours / 40) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Safety Score</span>
                      <span>{week.safetyScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          week.safetyScore >= 90 ? 'bg-green-500' :
                          week.safetyScore >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${week.safetyScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Safety Recommendations</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {/* Dynamic recommendations based on data */}
            {reportData.alertsPerHour > 2 && (
              <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">High Alert Frequency</h4>
                  <p className="text-sm text-red-700 mt-1">
                    You&apos;re averaging {reportData.alertsPerHour.toFixed(1)} alerts per hour. Consider reviewing ergonomic practices and taking more frequent breaks.
                  </p>
                </div>
              </div>
            )}
            
            {reportData.avgDailyHours > 8 && (
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Extended Work Hours</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    You&apos;re working {reportData.avgDailyHours.toFixed(1)} hours daily on average. Consider workload management and ensure adequate rest periods.
                  </p>
                </div>
              </div>
            )}
            
            {reportData.safetyScore >= 90 && (
              <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">Excellent Safety Performance</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Your safety score of {reportData.safetyScore}% is excellent. Keep maintaining good ergonomic practices and safety awareness.
                  </p>
                </div>
              </div>
            )}
            
            {reportData.totalSessions > 0 && reportData.averageSessionTime < 2 && (
              <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Short Work Sessions</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Your average session length is {reportData.averageSessionTime.toFixed(1)} hours. Consider optimizing workflow for longer, more productive sessions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="text-center">
          <Calendar className="h-8 w-8 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Report Generated</h3>
          <p className="text-sm text-gray-600 mt-1">
            {new Date().toLocaleDateString()} - Covering {timeRange} days of activity
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This report is automatically generated based on your sensor data and work patterns.
          </p>
        </div>
      </div>
    </div>
  );
}
