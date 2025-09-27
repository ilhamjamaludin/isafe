'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 md:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        {/* Mobile header */}
        <div className="md:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open sidebar</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <img 
              src="/Logo2.png" 
              alt="iSafe Logo" 
              className="h-6 w-6 object-contain"
            />
            <h1 className="text-lg font-bold text-gray-900">iSafe Admin</h1>
          </div>
          
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
