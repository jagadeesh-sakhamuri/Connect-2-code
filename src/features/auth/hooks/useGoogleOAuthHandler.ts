/**
 * @deprecated Google OAuth completion is now handled directly by the dedicated /oauth/callback route
 * via Spring Security HttpOnly refresh cookies and single-flight refresh.
 */
export function useGoogleOAuthHandler() {
  // No-op: OAuth lifecycle is owned by /oauth/callback
}
