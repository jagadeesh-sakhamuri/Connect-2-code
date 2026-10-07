/**
 * Token Storage Abstraction Layer using JavaScript Cookies and localStorage dual-persistence
 * Centralized token operations for accessToken, refreshToken, and User Profile.
 * 
 * Note: Uses document.cookie with Path=/ and SameSite=Lax, and mirrors to localStorage
 * to ensure persistent authentication across browser refreshes and tab navigations.
 */

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_PROFILE_KEY = 'user_profile';

const LOCAL_STORAGE_PREFIX = 'c2c_';

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  try {
    const encodedValue = encodeURIComponent(value);
    document.cookie = `${name}=${encodedValue}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  } catch {}
}

function getCookie(name: string): string | null {
  try {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length));
      }
    }
  } catch {}
  return null;
}

function removeCookie(name: string): void {
  try {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  } catch {}
}

function getLocalItem(key: string): string | null {
  try {
    return localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`);
  } catch {
    return null;
  }
}

function setLocalItem(key: string, value: string): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, value);
  } catch {}
}

function removeLocalItem(key: string): void {
  try {
    localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${key}`);
  } catch {}
}

export const tokenStorage = {
  // Access Token Operations (Short-lived cookie 15 min, mirrored in localStorage)
  getAccessToken(): string | null {
    return getCookie(ACCESS_TOKEN_KEY) || getLocalItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string, maxAgeSeconds: number = 900): void {
    setCookie(ACCESS_TOKEN_KEY, token, maxAgeSeconds);
    setLocalItem(ACCESS_TOKEN_KEY, token);
  },

  removeAccessToken(): void {
    removeCookie(ACCESS_TOKEN_KEY);
    removeLocalItem(ACCESS_TOKEN_KEY);
  },

  // Refresh Token Operations (Long-lived, 7 days = 604800 seconds)
  getRefreshToken(): string | null {
    return getCookie(REFRESH_TOKEN_KEY) || getLocalItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string, maxAgeSeconds: number = 604800): void {
    setCookie(REFRESH_TOKEN_KEY, token, maxAgeSeconds);
    setLocalItem(REFRESH_TOKEN_KEY, token);
  },

  removeRefreshToken(): void {
    removeCookie(REFRESH_TOKEN_KEY);
    removeLocalItem(REFRESH_TOKEN_KEY);
  },

  // User Profile Operations (Persisted in cookie + localStorage for session restoration)
  getUser(): any | null {
    const raw = getCookie(USER_PROFILE_KEY) || getLocalItem(USER_PROFILE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    return null;
  },

  setUser(user: any, maxAgeSeconds: number = 604800): void {
    const serialized = JSON.stringify(user);
    setCookie(USER_PROFILE_KEY, serialized, maxAgeSeconds);
    setLocalItem(USER_PROFILE_KEY, serialized);
  },

  removeUser(): void {
    removeCookie(USER_PROFILE_KEY);
    removeLocalItem(USER_PROFILE_KEY);
  },

  // Clear all authentication tokens and user cookies + storage
  clearTokens(): void {
    this.removeAccessToken();
    this.removeRefreshToken();
    this.removeUser();
  },
};
