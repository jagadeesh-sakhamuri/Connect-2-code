import { useCallback } from 'react';
import { registerOAuthPopupWindow } from './useGoogleOAuthHandler';

const GOOGLE_AUTH_URL = 'https://codingplatform-tdt0.onrender.com/oauth2/authorization/google';

/** Starts the Google OAuth flow. The completion listener is owned by the router shell. */
export function useGoogleOAuthLogin() {
  const initiateGoogleLogin = useCallback(() => {
    const width = 500;
    const height = 650;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

    const popup = window.open(
      GOOGLE_AUTH_URL,
      'google_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.location.href = GOOGLE_AUTH_URL;
      return;
    }

    registerOAuthPopupWindow(popup);
    popup.focus?.();
  }, []);

  return { initiateGoogleLogin };
}
