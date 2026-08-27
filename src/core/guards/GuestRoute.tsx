import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';

export const GuestRoute: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (isAuthenticated) {
    const role = String(user?.role || '').toUpperCase();
    const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN' || role.includes('ADMIN');
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/practice" replace />;
  }

  return <Outlet />;
};
