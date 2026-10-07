import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { tokenStorage } from '../security/tokenStorage';

/**
 * AdminRoute Guard
 * Restricts access to Admin Frontend routes (/admin/*).
 * Verifies that the user is both authenticated AND possesses an ADMIN role.
 * Redirects unauthenticated users to /login and non-admin users to /practice.
 */
export const AdminRoute: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  const currentUser = user || tokenStorage.getUser();
  const hasAuth = isAuthenticated || Boolean(tokenStorage.getAccessToken() || tokenStorage.getRefreshToken());

  // 1. Check Authentication Status
  if (!hasAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check Admin Role Authorization (supports 'ADMIN' or 'ROLE_ADMIN')
  const role = currentUser?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN' || (role && role.includes('ADMIN'));

  if (!isAdmin) {
    return <Navigate to="/practice" replace />;
  }

  return <Outlet />;
};
