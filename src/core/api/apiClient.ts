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
export const resolveApiBaseUrl = (rawUrl?: string | null): string => {
  if (typeof rawUrl !== 'string') {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[apiClient] VITE_API_BASE_URL is not configured. Defaulting to relative path "/api/v1".');
    }
    return '/api/v1';
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[apiClient] VITE_API_BASE_URL is empty. Defaulting to relative path "/api/v1".');
    }
    return '/api/v1';
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

  // 4. Invalid protocol or unsupported format
  if (typeof console !== 'undefined' && console.warn) {
    console.warn(`[apiClient] Invalid VITE_API_BASE_URL "${rawUrl}". Defaulting to relative path "/api/v1".`);
  }
  return '/api/v1';
};

const getBaseUrl = (): string => {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_API_BASE_URL
    : undefined;
  return resolveApiBaseUrl(envUrl);
};

export const BASE_URL = getBaseUrl();

export const isRequestCanceled = (error: unknown): boolean => axios.isCancel(error);

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Shared Promise Lock for Concurrent 401 Refresh Requests
let refreshTokenPromise: Promise<string> | null = null;

// Request Interceptor: Attach Access Token from Storage (EXCLUDES Public Auth Endpoints)
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const reqUrl = config.url || '';
    
    const isPublicAuthEndpoint =
      reqUrl.includes('/auth/login') ||
      reqUrl.includes('/signUp') ||
      reqUrl.includes('/auth/refresh') ||
      reqUrl.includes('/auth/generatePasswordResetOtp') ||
      reqUrl.includes('/auth/verifyPasswordResetOtp');

    let token = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();

    // Proactively refresh expired access token if a valid refresh token exists
    if (!token && refreshToken && !isPublicAuthEndpoint) {
      if (!refreshTokenPromise) {
        refreshTokenPromise = (async () => {
          try {
            const refreshRes = await axios.post(
              `${BASE_URL}/auth/refresh`,
              { refreshToken },
              { headers: { 'Content-Type': 'application/json' } }
            );

            const responseData = refreshRes.data;
            const tokenData = responseData?.data || responseData;
            const newAccessToken = tokenData.accessToken || tokenData.token;
            const newRefreshToken = tokenData.refreshToken || refreshToken;

            if (newAccessToken) {
              tokenStorage.setAccessToken(newAccessToken);
              tokenStorage.setRefreshToken(newRefreshToken);
              return newAccessToken;
            } else {
              throw new Error('No access token returned from refresh');
            }
          } catch (refreshErr) {
            tokenStorage.clearTokens();
            throw refreshErr;
          } finally {
            refreshTokenPromise = null;
          }
        })();
      }

      try {
        token = await refreshTokenPromise;
      } catch {}
    }

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
      // Exclude auth endpoints from refresh loop
      if (
        reqUrl.includes('/auth/refresh') ||
        reqUrl.includes('/auth/login') ||
        reqUrl.includes('/signUp') ||
        reqUrl.includes('/auth/generatePasswordResetOtp') ||
        reqUrl.includes('/auth/verifyPasswordResetOtp')
      ) {
        tokenStorage.clearTokens();
        const errBody = error.response?.data || {};
        return Promise.reject({
          statusCode: error.response.status,
          message: errBody.message || 'Authentication error',
          errors: errBody.errors || [error.message],
        });
      }

      originalRequest._retry = true;
      const refreshToken = tokenStorage.getRefreshToken();

      if (!refreshToken) {
        tokenStorage.clearTokens();
        return Promise.reject(error.response?.data || error);
      }

      // If a refresh is already in progress, wait for the shared promise
      if (!refreshTokenPromise) {
        refreshTokenPromise = (async () => {
          try {
            const refreshRes = await axios.post(
              `${BASE_URL}/auth/refresh`,
              { refreshToken },
              { headers: { 'Content-Type': 'application/json' } }
            );

            const responseData = refreshRes.data;
            const tokenData = responseData?.data || responseData;
            const newAccessToken = tokenData.accessToken || tokenData.token;
            const newRefreshToken = tokenData.refreshToken || refreshToken;

            if (newAccessToken) {
              tokenStorage.setAccessToken(newAccessToken);
              tokenStorage.setRefreshToken(newRefreshToken);
              return newAccessToken;
            } else {
              throw new Error('No access token returned from refresh');
            }
          } catch (refreshErr) {
            tokenStorage.clearTokens();
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
          errors: refreshErr?.response?.data?.errors || ['Refresh token invalid or expired'],
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
