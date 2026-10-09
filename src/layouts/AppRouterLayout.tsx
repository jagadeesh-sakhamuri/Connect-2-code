import React, { useEffect } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { initializeAuth, silentRefreshSession } from '../features/auth/redux/authSlice';
import { fetchBookmarks } from '../features/bookmarks/redux/bookmarkSlice';
import { tokenStorage } from '../core/security/tokenStorage';
import { useGoogleOAuthHandler } from '../features/auth/hooks/useGoogleOAuthHandler';

/**
 * Root route shell (F-010, F-039):
 * Initializes Redux store authentication state and bookmarks globally on app bootstrap
 * for ALL routes (Landing, Login, Practice, Admin, 404, 500), preventing
 * desynchronization when routes are visited directly in fresh browser sessions.
 */
export const AppRouterLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth?.user?.id);
  useGoogleOAuthHandler();

  useEffect(() => {
    dispatch(initializeAuth());
    if (tokenStorage.getRefreshToken()) {
      dispatch(silentRefreshSession());
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchBookmarks());
  }, [dispatch, userId]);

  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
};
