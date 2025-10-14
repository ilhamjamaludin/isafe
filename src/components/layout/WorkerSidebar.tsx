'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  User,
  Settings,
  Shield,
  Clock,
  X
} from 'lucide-react';

interface WorkerSidebarProps {
  onClose?: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/worker', icon: Home },
  { name: 'Live Monitoring', href: '/worker/monitoring', icon: Activity },
  { name: 'My Alerts', href: '/worker/alerts', icon: AlertTriangle },
  // Removed Work History per request
  // Removed non-existing menus from Profile area
  { name: 'Profile', href: '/worker/profile', icon: User },
];

export default function WorkerSidebar({ onClose }: WorkerSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 flex items-center justify-center">
            <img 
              src="/Logo2.png" 
              alt="iSafe Logo" 
              className="h-8 w-8 object-contain"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">iSafe</h2>
            <p className="text-xs text-gray-500">Worker Panel</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* User Info */}
      <div className="p-4 bg-blue-50 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {(user?.displayName || user?.email || '').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.displayName || 'Worker'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            <div className="flex items-center mt-1">
              <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
              <span className="text-xs text-gray-600">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`
                flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Safety Status */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Safety Status</h3>
              <p className="text-xs text-green-600 mt-1">All systems operational</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500">iSafe Worker v1.0</p>
          <p className="text-xs text-gray-400 mt-1">Stay Safe, Work Smart</p>
        </div>
      </div>
    </div>
  );
}
