import React from 'react';
import { Outlet } from 'react-router-dom';

/** Authentication-only layout. Auth routes own their UI instead of rendering MainLayout underneath them. */
export const AuthLayout: React.FC = () => <Outlet />;
