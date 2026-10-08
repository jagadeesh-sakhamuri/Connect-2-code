import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { tokenStorage } from '../security/tokenStorage';

export const GuestRoute: React.FC = () => {
  const currentUser = tokenStorage.getUser();
  const hasAuth = Boolean(tokenStorage.getAccessToken() || tokenStorage.getRefreshToken());

  if (hasAuth) {
    const role = String(currentUser?.role || '').toUpperCase();
    const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN' || role.includes('ADMIN');
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/practice" replace />;
  }

  return <Outlet />;
};
