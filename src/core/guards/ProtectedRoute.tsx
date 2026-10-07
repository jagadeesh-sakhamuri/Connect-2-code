import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { tokenStorage } from '../security/tokenStorage';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Verify auth state from Redux OR active tokens in persistent storage
  const hasAuth = isAuthenticated || Boolean(tokenStorage.getAccessToken() || tokenStorage.getRefreshToken());

  if (!hasAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
