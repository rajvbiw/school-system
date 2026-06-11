import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

interface RoleGuardProps {
  allowedRoles: ('superadmin' | 'admin' | 'teacher' | 'student' | 'parent')[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
          <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase">Loading Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Superadmin has absolute permission to bypass role guards
  if (user.role === 'superadmin') {
    return <Outlet />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
export default RoleGuard;
