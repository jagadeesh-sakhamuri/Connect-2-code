import { useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../../../app/hooks';
import { loginWithGoogleRefreshToken, closeAuthModal } from '../redux/authSlice';
import { toast } from 'react-hot-toast';

const MESSAGE_TYPE = 'C2C_GOOGLE_OAUTH_SUCCESS';

// Module-level guard to prevent concurrent duplicate exchanges across hook instances
let isProcessingExchange = false;
let processedToken: string | null = null;
let oauthPopupWindow: Window | null = null;

/** Register the exact popup opened by the parent window for strict postMessage source validation. */
export function registerOAuthPopupWindow(popup: Window | null): void {
  oauthPopupWindow = popup;
}

export function useGoogleOAuthHandler() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Complete OAuth login with the given refresh token
  const completeOAuthLogin = useCallback(
    async (refreshToken: string) => {
      if (isProcessingExchange || processedToken === refreshToken) {
        return;
      }
      isProcessingExchange = true;
      processedToken = refreshToken;

      try {
        const result = await dispatch(loginWithGoogleRefreshToken(refreshToken));
        if (loginWithGoogleRefreshToken.fulfilled.match(result)) {
          oauthPopupWindow = null;
          const userObj = result.payload;
          const userName = userObj?.firstName || userObj?.fullName || 'User';
          toast.success(`Welcome ${userName}! Signed in with Google.`);
          dispatch(closeAuthModal());

          const userRole = String(userObj?.role || '').toUpperCase();
          const isAdmin = userRole === 'ADMIN' || userRole === 'ROLE_ADMIN' || userRole.includes('ADMIN');

          if (isAdmin) {
            navigate('/admin/dashboard', { replace: true });
          } else if (window.location.pathname && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
            navigate(window.location.pathname, { replace: true });
          } else {
            navigate('/practice', { replace: true });
          }
        } else {
          // Allow a retry when the backend rejects the token or the exchange fails.
          processedToken = null;
          toast.error((result.payload as string) || 'Google sign-in failed. Please try again.');
        }
      } catch (err: any) {
        processedToken = null;
        toast.error(err?.message || 'Error completing Google sign-in.');
      } finally {
        isProcessingExchange = false;
      }
    },
    [dispatch, navigate]
  );

  // 1. Intercept URL search params or hash (?refreshToken=... or #refreshToken=...) on mount
  useEffect(() => {
    // Check React Router searchParams, window.location.search, and window.location.hash
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash ? window.location.hash.replace(/^#\/?/, '') : '';
    const hashParams = new URLSearchParams(hash);

    const tokenVal =
      params.get('refreshToken') ||
      params.get('refresh_token') ||
      params.get('token') ||
      hashParams.get('refreshToken') ||
      hashParams.get('refresh_token') ||
      hashParams.get('token') ||
      searchParams.get('refreshToken') ||
      searchParams.get('refresh_token') ||
      searchParams.get('token');

    if (tokenVal) {
      // Clean up the URL query parameters so the token is not visible in the address bar
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      // If running inside a popup window, transmit to opener and close self
      if (window.opener && window.opener !== window) {
        try {
          oauthPopupWindow = window;
          window.opener.postMessage({ type: MESSAGE_TYPE, refreshToken: tokenVal }, window.location.origin);
          setTimeout(() => {
            try {
              window.close();
            } catch {}
          }, 150);
          return;
        } catch (e) {
          oauthPopupWindow = null;
          console.warn('Failed to message parent window from popup:', e);
        }
      }

      // If running in main window (e.g. direct full-page redirect flow)
      completeOAuthLogin(tokenVal);
    }
  }, [searchParams, completeOAuthLogin]);

  // 2. Listen for messages from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (oauthPopupWindow && event.source !== oauthPopupWindow) return;
      if (event.data?.type === MESSAGE_TYPE && event.data?.refreshToken) {
        completeOAuthLogin(event.data.refreshToken);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [completeOAuthLogin]);
}
