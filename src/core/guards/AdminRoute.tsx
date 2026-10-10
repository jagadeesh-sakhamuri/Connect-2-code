import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { tokenStorage } from '../security/tokenStorage';
import { isJwtAdmin } from '../security/jwt';
import { Skeleton } from '../../shared/components/ui/Skeleton';

const GuardLoader: React.FC = () => (
  <div className="p-8 flex flex-col gap-4 max-w-5xl mx-auto font-sans">
    <Skeleton className="h-10 w-64" />
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

/**
 * AdminRoute Guard (F-036)
 * Restricts access to Admin Frontend routes (/admin/*).
 * Verifies that the user is authenticated AND possesses an ADMIN role
 * verified strictly from cryptographically signed JWT payload claims,
 * preventing privilege escalation via client-mutable localStorage.
 */
export const AdminRoute: React.FC = () => {
  const location = useLocation();
  const status = useAppSelector((state) => state.auth.status);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const token = useAppSelector((state) => state.auth.token) || tokenStorage.getAccessToken();

  // 1. Prevent premature redirect during asynchronous startup session restoration
  if (status === 'LOADING') {
    return <GuardLoader />;
  }

  // 2. Check Authentication Status
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Check Admin Role Authorization strictly from signed JWT claims (F-036)
  const isAdmin = isJwtAdmin(token);

  if (!isAdmin) {
    return <Navigate to="/practice" replace />;
  }

  return <Outlet />;
};
