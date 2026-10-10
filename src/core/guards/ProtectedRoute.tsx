import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { Skeleton } from '../../shared/components/ui/Skeleton';

const GuardLoader: React.FC = () => (
  <div className="p-8 flex flex-col gap-4 max-w-5xl mx-auto font-sans">
    <Skeleton className="h-10 w-64" />
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

export const ProtectedRoute: React.FC = () => {
  const location = useLocation();
  const status = useAppSelector((state) => state.auth.status);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  // Prevent premature redirect during asynchronous startup session restoration
  if (status === 'LOADING') {
    return <GuardLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
