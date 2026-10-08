import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { tokenStorage } from '../security/tokenStorage';

export const ProtectedRoute: React.FC = () => {
  const location = useLocation();

  // Verify auth state from Redux OR active tokens in persistent storage
  const hasAuth = Boolean(tokenStorage.getAccessToken() || tokenStorage.getRefreshToken());

  if (!hasAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
