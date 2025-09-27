'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Shield, Users, Activity, BarChart3 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-4xl w-full text-center">
          <div className="mb-8">
            <div className="mx-auto h-20 w-20 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">iSafe</h1>
            <p className="text-xl text-gray-600 mb-8">
              Advanced Worker Safety Monitoring & Posture Analysis System
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Worker Management</h3>
              <p className="text-gray-600">Comprehensive worker profile and role management system</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <Activity className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Monitoring</h3>
              <p className="text-gray-600">Live posture tracking and safety alert system</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics & Reports</h3>
              <p className="text-gray-600">Detailed safety analytics and compliance reporting</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <a
                href="/login"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Sign In to Dashboard
              </a>
            </div>
            <p className="text-sm text-gray-500">
              Contact your administrator for account access
            </p>
            <p className="text-xs text-gray-400">
              Protect your workforce with advanced safety monitoring technology
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
