'use client';

import React, { useState } from 'react';
import { FileText, Download, Calendar, BarChart3, PieChart, TrendingUp, Users, AlertTriangle } from 'lucide-react';

const reportData = {
  summary: {
    totalWorkers: 24,
    totalAlerts: 47,
    avgSafetyScore: 94,
    improvedPosture: 18
  },
  weeklyData: [
    { day: 'Mon', alerts: 8, workers: 24, safetyScore: 92 },
    { day: 'Tue', alerts: 5, workers: 24, safetyScore: 95 },
    { day: 'Wed', alerts: 12, workers: 23, safetyScore: 89 },
    { day: 'Thu', alerts: 6, workers: 24, safetyScore: 96 },
    { day: 'Fri', alerts: 9, workers: 22, safetyScore: 93 },
    { day: 'Sat', alerts: 4, workers: 18, safetyScore: 97 },
    { day: 'Sun', alerts: 3, workers: 16, safetyScore: 98 }
  ],
  postureDistribution: [
    { status: 'Good', count: 18, percentage: 75 },
    { status: 'Warning', count: 4, percentage: 17 },
    { status: 'Critical', count: 2, percentage: 8 }
  ],
  topRiskWorkers: [
    { id: 'W003', name: 'Mike Johnson', alerts: 12, riskScore: 85 },
    { id: 'W007', name: 'David Brown', alerts: 8, riskScore: 72 },
    { id: 'W012', name: 'Lisa Wilson', alerts: 6, riskScore: 68 },
    { id: 'W018', name: 'Tom Anderson', alerts: 5, riskScore: 61 }
  ]
};

export default function ReportPage() {
  const [dateRange, setDateRange] = useState('week');
  const [reportType, setReportType] = useState('summary');

  const generateReport = () => {
    // This would typically trigger a report generation process
    alert('Generating report... This will be available for download shortly.');
  };

  const exportData = (format: string) => {
    // This would typically export data in the specified format
    alert(`Exporting data as ${format.toUpperCase()}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">Generate comprehensive safety reports and analytics</p>
      </div>

      {/* Report Generation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="summary">Summary Report</option>
              <option value="detailed">Detailed Analysis</option>
              <option value="worker">Worker Performance</option>
              <option value="safety">Safety Compliance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
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
              <p className="text-sm text-gray-600">Total Workers</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{reportData.summary.totalWorkers}</p>
              <p className="text-sm text-green-600 mt-1">+2 from last week</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Alerts</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{reportData.summary.totalAlerts}</p>
              <p className="text-sm text-red-600 mt-1">+5 from last week</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Safety Score</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{reportData.summary.avgSafetyScore}%</p>
              <p className="text-sm text-green-600 mt-1">+2% from last week</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Improved Posture</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{reportData.summary.improvedPosture}</p>
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
            <BarChart3 className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-3">
            {reportData.weeklyData.map((day) => (
              <div key={day.day} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 w-12">{day.day}</span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(day.alerts / 15) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-8 text-right">{day.alerts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Posture Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Posture Distribution</h3>
            <PieChart className="h-5 w-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            {reportData.postureDistribution.map((item, index) => (
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
                  <div className="text-xs text-gray-500">{item.percentage}%</div>
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
          <p className="text-sm text-gray-600 mt-1">Workers requiring immediate attention</p>
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
              {reportData.topRiskWorkers.map((worker, index) => (
                <tr key={worker.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                      <div className="text-sm text-gray-500">ID: {worker.id}</div>
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
