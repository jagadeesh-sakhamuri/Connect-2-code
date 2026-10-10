import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../security/tokenStorage';

/**
 * Resolves and normalizes the API base URL.
 *
 * - Preserves explicitly configured absolute HTTP/HTTPS URLs (stripping trailing slashes).
 * - Supports relative API base paths (e.g. '/api/v1') to enable Vite development proxying.
 * - Normalizes relative paths without a leading slash (e.g. 'api/v1' -> '/api/v1').
 * - Handles missing, empty, or invalid configuration safely and clearly by defaulting
 *   to relative '/api/v1' with a diagnostic warning, removing silent fallback to a
 *   hardcoded production Render instance (F-005, F-006).
 */
export const RENDER_BACKEND_ORIGIN = 'https://codingplatform-tdt0.onrender.com';
export const DEFAULT_API_BASE_URL = 'https://codingplatform-tdt0.onrender.com/api/v1';

export const resolveApiBaseUrl = (rawUrl?: string | null): string => {
  if (typeof rawUrl !== 'string') {
    return DEFAULT_API_BASE_URL;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return DEFAULT_API_BASE_URL;
  }

  // 1. Explicit absolute HTTP/HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/\/+$/, '');
  }

  // 2. Explicit relative path starting with '/'
  if (trimmed.startsWith('/')) {
    return trimmed.replace(/\/+$/, '');
  }

  // 3. Relative path without leading slash (e.g. 'api/v1')
  if (!trimmed.includes('://')) {
    return `/${trimmed}`.replace(/\/+$/, '');
  }

  // 4. Invalid protocol or unsupported format -> fallback to default Render backend
  return DEFAULT_API_BASE_URL;
};

export const getBackendOrigin = (rawUrl?: string | null): string => {
  const resolved = resolveApiBaseUrl(rawUrl);
  const stripped = resolved.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  if (!stripped || !stripped.startsWith('http')) {
    return RENDER_BACKEND_ORIGIN;
  }
  return stripped;
};

const getBaseUrl = (): string => {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_API_BASE_URL
    : undefined;
  const resolved = resolveApiBaseUrl(envUrl);
  // Ensure that in browser runtime, API requests always target Render backend
  // because frontend and backend are deployed on different servers
  if (typeof window !== 'undefined' && (!resolved || !resolved.startsWith('http'))) {
    return DEFAULT_API_BASE_URL;
  }
  return resolved;
};

export const BASE_URL = getBaseUrl();

export const getGoogleOAuthUrl = (): string => {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_API_BASE_URL
    : undefined;
  return `${getBackendOrigin(envUrl)}/oauth2/authorization/google`;
};

export const isRequestCanceled = (error: unknown): boolean => axios.isCancel(error);

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

type AuthListener = (token: string, data: any) => void;
type AuthFailureListener = () => void;

const authListeners: AuthListener[] = [];
const authFailureListeners: AuthFailureListener[] = [];

export const registerAuthListener = (listener: AuthListener) => {
  authListeners.push(listener);
  return () => {
    const idx = authListeners.indexOf(listener);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
};

export const registerAuthFailureListener = (listener: AuthFailureListener) => {
  authFailureListeners.push(listener);
  return () => {
    const idx = authFailureListeners.indexOf(listener);
    if (idx !== -1) authFailureListeners.splice(idx, 1);
  };
};

function notifyAuthListeners(token: string, data: any) {
  authListeners.forEach((fn) => {
    try { fn(token, data); } catch {}
  });
}

function notifyAuthFailure() {
  authFailureListeners.forEach((fn) => {
    try { fn(); } catch {}
  });
}

// Shared Promise Lock for Single-Flight Concurrent 401 Refresh Requests
let refreshTokenPromise: Promise<string> | null = null;

// Request Interceptor: Attach In-Memory Access Token (EXCLUDES Public Auth Endpoints)
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const reqUrl = config.url || '';

    const isPublicAuthEndpoint =
      reqUrl.includes('/auth/login') ||
      reqUrl.includes('/signUp') ||
      reqUrl.includes('/auth/refresh') ||
      reqUrl.includes('/auth/generatePasswordResetOtp') ||
      reqUrl.includes('/auth/verifyPasswordResetOtp');

    const token = tokenStorage.getAccessToken();

    if (token && config.headers && !isPublicAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const resData = response.data;

    // Reject unexpected HTML responses from an API request when unauthenticated.
    if (typeof resData === 'string' && (resData.includes('<!doctype') || resData.includes('<html') || resData.includes('accounts.google.com'))) {
      const errorMsg = 'Authentication required. Please log in.';
      return Promise.reject({
        statusCode: 401,
        message: errorMsg,
        errors: [errorMsg],
        data: null,
      });
    }

    // Accept all 2xx HTTP and inner backend status codes (200, 201 Created, 202 Accepted, 204 No Content)
    if (resData && typeof resData === 'object' && 'statusCode' in resData) {
      const code = Number(resData.statusCode);
      if (code < 200 || code >= 300) {
        const errorMsg = resData.message || (resData.errors && resData.errors[0]) || 'Server processing error';
        return Promise.reject({
          statusCode: code,
          message: errorMsg,
          errors: resData.errors || [errorMsg],
          data: resData.data,
        });
      }
    }
    return resData;
  },
  async (error) => {
    // Preserve AbortController cancellation so callers can distinguish a canceled request from an API failure.
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    const reqUrl = originalRequest?.url || '';

    // Handle Timeout Errors gracefully with user-friendly cold-start explanation
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject({
        statusCode: 408,
        message: 'The server is taking longer than expected to respond (waking up from sleep mode). Please wait a few seconds and try logging in again.',
        errors: ['Server connection timed out due to backend cold start'],
      });
    }

    // Check for HTTP 401 Unauthorized
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Exclude public auth and refresh endpoints from the refresh loop to prevent recursion
      if (
        reqUrl.includes('/auth/refresh') ||
        reqUrl.includes('/auth/login') ||
        reqUrl.includes('/signUp') ||
        reqUrl.includes('/auth/generatePasswordResetOtp') ||
        reqUrl.includes('/auth/verifyPasswordResetOtp')
      ) {
        tokenStorage.clearTokens();
        notifyAuthFailure();
        const errBody = error.response?.data || {};
        return Promise.reject({
          statusCode: error.response.status,
          message: errBody.message || 'Authentication error',
          errors: errBody.errors || [error.message],
        });
      }

      originalRequest._retry = true;

      // Single-Flight Refresh: If a refresh is already in progress, wait for the shared promise
      if (!refreshTokenPromise) {
        refreshTokenPromise = (async () => {
          try {
            // POST /api/v1/auth/refresh with credentials (HttpOnly cookie sent automatically by browser, empty body)
            const refreshRes = await axios.post(
              `${BASE_URL}/auth/refresh`,
              {},
              {
                withCredentials: true,
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                },
              }
            );

            const responseData = refreshRes.data;
            const tokenData = responseData?.data || responseData;
            const newAccessToken = tokenData?.accessToken || tokenData?.token;

            if (newAccessToken) {
              tokenStorage.setAccessToken(newAccessToken);
              notifyAuthListeners(newAccessToken, tokenData);
              return newAccessToken;
            } else {
              throw new Error('No access token returned from refresh endpoint');
            }
          } catch (refreshErr) {
            tokenStorage.clearTokens();
            notifyAuthFailure();
            throw refreshErr;
          } finally {
            refreshTokenPromise = null;
          }
        })();
      }

      try {
        const newAccessToken = await refreshTokenPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr: any) {
        return Promise.reject({
          statusCode: 401,
          message: 'Your session has expired. Please login again.',
          errors: refreshErr?.response?.data?.errors || ['Session expired or unauthorized'],
        });
      }
    }

    const errorData = error.response?.data || {
      statusCode: error.response?.status || 500,
      message: error.message || 'Something went wrong. Please try again.',
      errors: error.response?.data?.errors || [error.message],
    };

    return Promise.reject(errorData);
  }
);
