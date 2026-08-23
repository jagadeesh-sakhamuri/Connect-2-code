import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../security/tokenStorage';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (import.meta.env.DEV) {
    return '/api/v1';
  }
  return 'https://codingplatform-tdt0.onrender.com/api/v1';
};

const BASE_URL = getBaseUrl();

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Access Token from Cookies
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Shared Promise Lock for Concurrent 401 Refresh Requests
let refreshTokenPromise: Promise<string> | null = null;

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const resData = response.data;
    if (resData && typeof resData === 'object' && 'statusCode' in resData) {
      if (resData.statusCode !== 200) {
        const errorMsg = resData.message || (resData.errors && resData.errors[0]) || 'Server processing error';
        return Promise.reject({
          statusCode: resData.statusCode,
          message: errorMsg,
          errors: resData.errors || [errorMsg],
          data: resData.data,
        });
      }
    }
    return resData;
  },
  async (error) => {
    const originalRequest = error.config;
    const reqUrl = originalRequest?.url || '';

    // Handle Network Error Retries for dev proxy
    if (error.message === 'Network Error' && !originalRequest._networkRetried) {
      originalRequest._networkRetried = true;
      if (!originalRequest.url.startsWith('http')) {
        originalRequest.baseURL = 'https://codingplatform-tdt0.onrender.com/api/v1';
        return apiClient(originalRequest);
      }
    }

    // Check for HTTP 401 Unauthorized
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Exclude auth endpoints from refresh loop
      if (reqUrl.includes('/auth/refresh') || reqUrl.includes('/auth/login') || reqUrl.includes('/signUp')) {
        tokenStorage.clearTokens();
        const errBody = error.response?.data || {};
        return Promise.reject({
          statusCode: error.response.status,
          message: errBody.message || 'Invalid Email or Password',
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
