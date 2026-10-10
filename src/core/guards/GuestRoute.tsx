import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { Skeleton } from '../../shared/components/ui/Skeleton';

const GuardLoader: React.FC = () => (
  <div className="p-8 flex flex-col gap-4 max-w-5xl mx-auto font-sans">
    <Skeleton className="h-10 w-64" />
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

export const GuestRoute: React.FC = () => {
  const status = useAppSelector((state) => state.auth.status);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const currentUser = useAppSelector((state) => state.auth.user);

  // Prevent flashing login/signup views while verifying existing session
  if (status === 'LOADING') {
    return <GuardLoader />;
  }

  if (isAuthenticated) {
    const role = String(currentUser?.role || '').toUpperCase();
    const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN' || role.includes('ADMIN');
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/practice" replace />;
  }

  return <Outlet />;
};
