import React from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { useGoogleOAuthHandler } from '../features/auth/hooks/useGoogleOAuthHandler';

/** Root route shell: one global OAuth completion listener for the whole SPA. */
export const AppRouterLayout: React.FC = () => {
  useGoogleOAuthHandler();
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
};
