'use client';

import React, { useMemo, useState } from 'react';
import { FileText, Download, Calendar, BarChart3, PieChart, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useESP32Data, useESP32Alerts } from '@/hooks/useESP32';

// Helper to build dummy weekly series that matches current totals
const buildWeeklyFromTotal = (total: number) => {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const base = Math.max(0, total);
  const parts = [15, 14, 20, 12, 16, 8, 7]; // weights sum = 92
  const sum = parts.reduce((a,b)=>a+b,0);
  return days.map((day, i) => ({
    day,
    alerts: Math.round((parts[i] / sum) * base),
    workers: 0,
    safetyScore: 0
  }));
};

export default function ReportPage() {
  const [dateRange, setDateRange] = useState('week');
  const [reportType, setReportType] = useState('summary');
  const { users } = useUsers();
  const { devices } = useESP32Data();
  const { alerts } = useESP32Alerts();

  const workers = useMemo(() => users.filter(u => u.role === 'worker'), [users]);
  
  // Build top risk list from real workers with dummy metrics
  const topRiskWorkers = useMemo(() => {
    return workers.slice(0, 8).map((w, index) => ({
      id: w.uid,
      name: w.displayName || w.email,
      alerts: 3 + ((index * 2) % 12),
      riskScore: 55 + ((index * 13) % 45)
    }));
  }, [workers]);

  // Summary using real workers + dummy metrics
  const summary = useMemo(() => ({
    totalWorkers: workers.length,
    totalAlerts: alerts.length || topRiskWorkers.reduce((acc, w) => acc + w.alerts, 0),
    avgSafetyScore: workers.length ? Math.max(60, 98 - Math.floor(topRiskWorkers.length * 2)) : 0,
    improvedPosture: Math.max(0, Math.floor(workers.length * 0.75))
  }), [workers, topRiskWorkers, alerts.length]);

  // Weekly alert series reflects current total alerts (real or fallback)
  const weeklyData = useMemo(() => buildWeeklyFromTotal(summary.totalAlerts), [summary.totalAlerts]);

  // Posture distribution approximates current sensor posture data
  const postureDistribution = useMemo(() => {
    const online = devices.filter(d => d.isOnline && d.data);
    const good = online.filter(d => !d.data!.sensors.imu.angle_over_limit).length;
    const warning = online.filter(d => d.data!.sensors.imu.angle_over_limit && d.data!.sensors.imu.angle_duration_ms <= 300000).length;
    const critical = online.filter(d => d.data!.sensors.imu.angle_over_limit && d.data!.sensors.imu.angle_duration_ms > 300000).length;
    const total = Math.max(1, good + warning + critical);
    return [
      { status: 'Good', count: good, percentage: Math.round((good / total) * 100) },
      { status: 'Warning', count: warning, percentage: Math.round((warning / total) * 100) },
      { status: 'Critical', count: critical, percentage: Math.round((critical / total) * 100) }
    ];
  }, [devices]);

  const downloadFile = (filename: string, mime: string, content: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateReport = () => {
    const content = `ISAFE Report\nGenerated: ${new Date().toLocaleString()}\nWorkers: ${summary.totalWorkers}\nTotal Alerts (dummy): ${summary.totalAlerts}`;
    downloadFile('isafe-report.txt', 'text/plain', content);
  };

  const exportData = (format: string) => {
    if (format === 'csv' || format === 'excel') {
      const header = 'Worker ID,Name,Alerts,Risk Score\n';
      const rows = topRiskWorkers.map(w => `${w.id},"${w.name}",${w.alerts},${w.riskScore}`).join('\n');
      downloadFile(`isafe-report.${format === 'excel' ? 'csv' : 'csv'}`, 'text/csv', header + rows);
    } else if (format === 'pdf') {
      const content = `ISAFE Report (Dummy PDF)\nGenerated: ${new Date().toLocaleString()}\nWorkers: ${summary.totalWorkers}\nItems: ${topRiskWorkers.length}`;
      // Note: Using plain text as dummy PDF content for now
      downloadFile('isafe-report.pdf', 'application/pdf', content);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-700 mt-2">Generate comprehensive safety reports and analytics</p>
      </div>

      {/* Report Generation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Report Type</label>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            >
              <option value="summary">Summary Report</option>
              <option value="detailed">Detailed Analysis</option>
              <option value="worker">Worker Performance</option>
              <option value="safety">Safety Compliance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Date Range</label>
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Format</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800">
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={generateReport}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">Total Workers</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{summary.totalWorkers}</p>
              <p className="text-sm text-green-600 mt-1">+2 from last week</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">Total Alerts</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{summary.totalAlerts}</p>
              <p className="text-sm text-red-600 mt-1">+5 from last week</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">Avg Safety Score</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{summary.avgSafetyScore}%</p>
              <p className="text-sm text-green-600 mt-1">+2% from last week</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">Improved Posture</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{summary.improvedPosture}</p>
              <p className="text-sm text-purple-600 mt-1">75% of workers</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trends */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Alert Trends</h3>
            <BarChart3 className="h-5 w-5 text-gray-700" />
          </div>
          <div className="space-y-3">
            {weeklyData.map((day) => (
              <div key={day.day} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800 w-12">{day.day}</span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(day.alerts / 15) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-gray-800 w-8 text-right">{day.alerts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Posture Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Posture Distribution</h3>
            <PieChart className="h-5 w-5 text-gray-700" />
          </div>
          <div className="space-y-4">
            {postureDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    item.status === 'Good' ? 'bg-green-500' :
                    item.status === 'Warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.status}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{item.count} workers</div>
                  <div className="text-xs text-gray-700">{item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Risk Workers */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Risk Workers</h3>
          <p className="text-sm text-gray-700 mt-1">Workers requiring immediate attention</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alerts Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topRiskWorkers.map((worker, index) => (
                <tr key={worker.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                      <div className="text-sm text-gray-700">ID: {worker.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-red-600 font-medium">{worker.alerts}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${
                        worker.riskScore >= 80 ? 'text-red-600' :
                        worker.riskScore >= 60 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {worker.riskScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
        <div className="flex space-x-4">
          <button 
            onClick={() => exportData('pdf')}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export PDF</span>
          </button>
          <button 
            onClick={() => exportData('excel')}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export Excel</span>
          </button>
          <button 
            onClick={() => exportData('csv')}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}
