/**
 * Token Storage Abstraction Layer using JavaScript Cookies (document.cookie)
 * Centralized token operations for accessToken, refreshToken, and User Profile.
 * 
 * Note: These cookies are set via JavaScript (document.cookie) with Path=/ and SameSite=Lax.
 */

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_PROFILE_KEY = 'user_profile';

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  const encodedValue = encodeURIComponent(value);
  document.cookie = `${name}=${encodedValue}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }
  return null;
}

function removeCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export const tokenStorage = {
  // Access Token Operations (Short-lived, 15 minutes = 900 seconds)
  getAccessToken(): string | null {
    return getCookie(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string, maxAgeSeconds: number = 900): void {
    setCookie(ACCESS_TOKEN_KEY, token, maxAgeSeconds);
  },

  removeAccessToken(): void {
    removeCookie(ACCESS_TOKEN_KEY);
  },

  // Refresh Token Operations (Long-lived, 7 days = 604800 seconds)
  getRefreshToken(): string | null {
    return getCookie(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string, maxAgeSeconds: number = 604800): void {
    setCookie(REFRESH_TOKEN_KEY, token, maxAgeSeconds);
  },

  removeRefreshToken(): void {
    removeCookie(REFRESH_TOKEN_KEY);
  },

  // User Profile Operations (Persisted in cookie for session restoration)
  getUser(): any | null {
    const raw = getCookie(USER_PROFILE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    return null;
  },

  setUser(user: any, maxAgeSeconds: number = 604800): void {
    setCookie(USER_PROFILE_KEY, JSON.stringify(user), maxAgeSeconds);
  },

  removeUser(): void {
    removeCookie(USER_PROFILE_KEY);
  },

  // Aliases for backward compatibility
  getToken(): string | null {
    return this.getAccessToken();
  },

  setToken(token: string): void {
    this.setAccessToken(token);
  },

  // Clear all authentication tokens and user cookies
  clearTokens(): void {
    this.removeAccessToken();
    this.removeRefreshToken();
    this.removeUser();
  },
};
