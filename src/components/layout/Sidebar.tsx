'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  Activity, 
  Wifi, 
  AlertTriangle, 
  FileText, 
  LogOut,
  Shield,
  Settings,
  UserCog,
  BarChart3,
  Zap,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  allowedRoles?: UserRole[];
  group?: 'main' | 'monitoring' | 'management';
}

const menuItems: MenuItem[] = [
  // Main Dashboard
  { id: 'home', label: 'Dashboard', icon: Home, href: '/dashboard', group: 'main' },
  
  // Monitoring & Safety
  { id: 'posture', label: 'Posture Monitor', icon: Activity, href: '/dashboard/posture', group: 'monitoring' },
  { id: 'sensor', label: 'Sensors', icon: Wifi, href: '/dashboard/sensor', group: 'monitoring' },
  { id: 'alert', label: 'Alerts', icon: AlertTriangle, href: '/dashboard/alert', group: 'monitoring' },
  
  // Management & Reports
  { id: 'workers', label: 'Workers', icon: Users, href: '/dashboard/workers', group: 'management' },
  { id: 'users', label: 'User Management', icon: UserCog, href: '/dashboard/users', allowedRoles: ['admin'], group: 'management' },
  { id: 'report', label: 'Reports', icon: BarChart3, href: '/dashboard/report', group: 'management' },
];

const menuGroups = {
  main: { label: 'Dashboard', icon: Zap },
  monitoring: { label: 'Monitoring', icon: Activity },
  management: { label: 'Management', icon: Settings }
};

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigate = (href: string) => {
    router.push(href);
    onClose?.(); // Close sidebar on mobile after navigation
  };

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter(item => {
    if (!item.allowedRoles) return true;
    return user?.role && item.allowedRoles.includes(user.role);
  });

  // Group menu items
  const groupedMenuItems = visibleMenuItems.reduce((groups, item) => {
    const group = item.group || 'main';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {} as Record<string, MenuItem[]>);

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'worker': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'viewer': return 'bg-green-500/20 text-green-300 border-green-500/30';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white shadow-2xl">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 md:p-3 rounded-xl shadow-lg">
              <img 
                src="/Logo2.png" 
                alt="iSafe Logo" 
                className="h-5 w-5 md:h-6 md:w-6 object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">iSafe</h1>
              <p className="text-slate-400 text-xs md:text-sm font-medium">Safety Monitoring</p>
            </div>
          </div>
          
          {/* Close button for mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close sidebar</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 md:py-4 px-2 md:px-3 overflow-y-auto">
        <div className="space-y-4 md:space-y-6">
          {Object.entries(groupedMenuItems).map(([groupKey, items]) => {
            const group = menuGroups[groupKey as keyof typeof menuGroups];
            const GroupIcon = group.icon;
            
            return (
              <div key={groupKey}>
                {/* Group Header */}
                <div className="flex items-center space-x-2 px-2 md:px-3 mb-2 md:mb-3">
                  <GroupIcon className="h-3 w-3 md:h-4 md:w-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-slate-700/50"></div>
                </div>
                
                {/* Menu Items */}
                <ul className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => handleNavigate(item.href)}
                          className={`w-full group flex items-center space-x-2 md:space-x-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg md:rounded-xl text-left transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 transform scale-[1.02]'
                              : 'text-slate-300 hover:bg-slate-800/60 hover:text-white hover:translate-x-1'
                          }`}
                        >
                          <div className={`p-1 md:p-1.5 rounded-md md:rounded-lg transition-colors ${
                            isActive 
                              ? 'bg-white/20' 
                              : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                          }`}>
                            <Icon className="h-3 w-3 md:h-4 md:w-4" />
                          </div>
                          <span className="font-medium text-xs md:text-sm truncate">{item.label}</span>
                          {isActive && (
                            <div className="flex-1 flex justify-end">
                              <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-white rounded-full"></div>
                            </div>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>

      {/* User Info Section - Responsive Design */}
      <div className="px-2 md:px-3 py-3 md:py-4 border-t border-slate-700/30">
        {/* User Profile */}
        <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 rounded-lg bg-slate-800/40 backdrop-blur-sm border border-slate-700/20">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-700 rounded-full flex items-center justify-center ring-1 ring-slate-600/50">
              <span className="text-xs font-semibold text-slate-200 tracking-wide">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            {/* Online Status - Subtle */}
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 md:w-3 md:h-3 bg-emerald-500 rounded-full ring-1 md:ring-2 ring-slate-800"></div>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1 md:space-x-2">
              <p className="text-xs md:text-sm font-medium text-slate-200 truncate leading-tight">
                {user?.displayName || user?.email?.split('@')[0]}
              </p>
              {/* Role Badge - Minimal */}
              <span className={`px-1 md:px-1.5 py-0.5 text-xs font-medium rounded ${
                user?.role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                user?.role === 'worker' ? 'bg-blue-500/20 text-blue-300' :
                'bg-emerald-500/20 text-emerald-300'
              }`}>
                {user?.role?.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5 hidden md:block">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Logout Button - Minimalist */}
        <button
          onClick={handleLogout}
          className="w-full mt-2 md:mt-3 flex items-center justify-center space-x-1 md:space-x-2 py-2 md:py-2.5 px-2 md:px-3 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200 group"
        >
          <LogOut className="h-3 w-3 md:h-4 md:w-4 transition-transform group-hover:scale-105" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
