'use client';

import WorkerDashboardLayout from '../../components/layout/WorkerDashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['worker']} requireAuth={true}>
      <WorkerDashboardLayout>
        {children}
      </WorkerDashboardLayout>
    </ProtectedRoute>
  );
}
