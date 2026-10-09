import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { tokenStorage } from '../security/tokenStorage';
import { isJwtAdmin } from '../security/jwt';

/**
 * AdminRoute Guard (F-036)
 * Restricts access to Admin Frontend routes (/admin/*).
 * Verifies that the user is authenticated AND possesses an ADMIN role
 * verified strictly from cryptographically signed JWT payload claims,
 * preventing privilege escalation via client-mutable localStorage.
 */
export const AdminRoute: React.FC = () => {
  const location = useLocation();
  const token = tokenStorage.getAccessToken();
  const refreshToken = tokenStorage.getRefreshToken();
  const hasAuth = Boolean(token || refreshToken);

  // 1. Check Authentication Status
  if (!hasAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check Admin Role Authorization strictly from signed JWT claims (F-036)
  const isAdmin = isJwtAdmin(token);

  if (!isAdmin) {
    return <Navigate to="/practice" replace />;
  }

  return <Outlet />;
};
