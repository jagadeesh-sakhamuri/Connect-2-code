import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../security/tokenStorage';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  // 1. If explicitly configured with an absolute HTTP/HTTPS URL, use it (trim trailing slashes)
  if (envUrl && (envUrl.startsWith('http://') || envUrl.startsWith('https://'))) {
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Default directly to the Render backend base URL across all environments (both local and deployed on Vercel)
  // Relative paths like '/api/v1' must NEVER be used as default baseURL because static hosting (Vercel) will return index.html
  return 'https://codingplatform-tdt0.onrender.com/api/v1';
};

export const BASE_URL = getBaseUrl();

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

    // Reject HTML responses from Spring Security OAuth redirects or Vercel static router when unauthenticated
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

    // Handle Network Error Retries & CORS Proxy Fallbacks
    if (error.message === 'Network Error' && !originalRequest._networkRetried) {
      originalRequest._networkRetried = true;
      // If direct call to Render failed (e.g. CORS preflight on Vercel preview branch domains), fallback to Vercel proxy rewrite '/api/v1'
      if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') && originalRequest.baseURL?.startsWith('http')) {
        originalRequest.baseURL = '/api/v1';
        return apiClient(originalRequest);
      } else if (!originalRequest.url?.startsWith('http') && originalRequest.baseURL !== 'https://codingplatform-tdt0.onrender.com/api/v1') {
        originalRequest.baseURL = 'https://codingplatform-tdt0.onrender.com/api/v1';
        return apiClient(originalRequest);
      }
    }

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
