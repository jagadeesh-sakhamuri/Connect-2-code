import type { User } from '../types/domain';

/**
 * Browser-side authentication storage.
 *
 * Security Requirements & Documentation (F-011):
 * - Tokens are stored in JavaScript-accessible cookies as a fallback because the current
 *   backend returns them in the JSON response body rather than in HttpOnly response headers.
 * - Browser JavaScript (document.cookie) CANNOT set the HttpOnly flag.
 * - Backend Architectural Requirement:
 *   The Spring Boot backend should issue refresh tokens via HttpOnly, Secure, SameSite=Strict
 *   cookies in Set-Cookie headers:
 *   `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`
 * - Frontend Security Hardening:
 *   Client-set cookies are restricted with `SameSite=Lax` and `; Secure` on HTTPS origins.
 *   Tokens are deliberately NOT mirrored into localStorage to prevent persistent exposure.
 */

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_PROFILE_KEY = 'user_profile';

const LOCAL_STORAGE_PREFIX = 'c2c_';

function cookieSecurityAttributes(): string {
  return typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? '; Secure'
    : '';
}

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  try {
    const encodedValue = encodeURIComponent(value);
    document.cookie =
      `${name}=${encodedValue}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${cookieSecurityAttributes()}`;
  } catch {}
}

function getCookie(name: string): string | null {
  try {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i += 1) {
      const c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length));
      }
    }
  } catch {}
  return null;
}

function removeCookie(name: string): void {
  try {
    document.cookie =
      `${name}=; path=/; max-age=0; SameSite=Lax${cookieSecurityAttributes()}`;
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
  getAccessToken(): string | null {
    return getCookie(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string, maxAgeSeconds: number = 900): void {
    setCookie(ACCESS_TOKEN_KEY, token, maxAgeSeconds);
  },

  removeAccessToken(): void {
    removeCookie(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return getCookie(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string, maxAgeSeconds: number = 604800): void {
    setCookie(REFRESH_TOKEN_KEY, token, maxAgeSeconds);
  },

  removeRefreshToken(): void {
    removeCookie(REFRESH_TOKEN_KEY);
  },

  // User profile is UI/session metadata, not an authentication credential (F-013).
  getUser(): User | null {
    const raw = getCookie(USER_PROFILE_KEY) || getLocalItem(USER_PROFILE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as User;
      } catch {}
    }
    return null;
  },

  setUser(user: User, maxAgeSeconds: number = 604800): void {
    const serialized = JSON.stringify(user);
    setCookie(USER_PROFILE_KEY, serialized, maxAgeSeconds);
    setLocalItem(USER_PROFILE_KEY, serialized);
  },

  removeUser(): void {
    removeCookie(USER_PROFILE_KEY);
    removeLocalItem(USER_PROFILE_KEY);
  },

  clearTokens(): void {
    this.removeAccessToken();
    this.removeRefreshToken();
    this.removeUser();
  },
};
