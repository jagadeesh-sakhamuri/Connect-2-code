import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../security/tokenStorage';

// In development, use relative '/api/v1' (routed via Vite Proxy to bypass browser CORS preflight).
// In production, fallback to direct VITE_API_BASE_URL or Render domain.
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
  timeout: 60000, // 60s timeout to allow Render free tier cold-start spin up
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor - Inject JWT Bearer Token & Cookies
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Handle 401 Refresh Token Retry Loop & Validate Payload statusCode
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const resData = response.data;
    // Inspect structured backend response (statusCode, message, errors)
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

    // If network error (e.g. Render cold start or CORS blocked direct request), retry once via direct URL
    if (error.message === 'Network Error' && !originalRequest._networkRetried) {
      originalRequest._networkRetried = true;
      if (!originalRequest.url.startsWith('http')) {
        originalRequest.baseURL = 'https://codingplatform-tdt0.onrender.com/api/v1';
        return apiClient(originalRequest);
      }
    }

    // Handle 401 Unauthorized with Refresh Token
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const refreshToken = tokenStorage.getRefreshToken();

      // Skip refresh loop for login/signup/refresh endpoints
      if (reqUrl.includes('/auth/refresh') || reqUrl.includes('/auth/login') || reqUrl.includes('/signUp')) {
        tokenStorage.clearTokens();
        const errBody = error.response?.data || {};
        return Promise.reject({
          statusCode: error.response.status,
          message: errBody.message || 'Invalid Email or Password',
          errors: errBody.errors || [error.message],
        });
      }

      if (refreshToken) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return apiClient(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Call Refresh API
          const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken }, {
            headers: { 'Content-Type': 'application/json' },
          });
          
          const responseData = refreshRes.data;
          const tokenData = responseData?.data || responseData;

          if (tokenData && (tokenData.accessToken || tokenData.token)) {
            const newAccessToken = tokenData.accessToken || tokenData.token;
            const newRefreshToken = tokenData.refreshToken || refreshToken;

            tokenStorage.setToken(newAccessToken);
            tokenStorage.setRefreshToken(newRefreshToken);

            apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            processQueue(null, newAccessToken);
            isRefreshing = false;

            return apiClient(originalRequest);
          } else {
            throw new Error('Failed to refresh token');
          }
        } catch (refreshErr: any) {
          processQueue(refreshErr, null);
          isRefreshing = false;
          tokenStorage.clearTokens();
          return Promise.reject(refreshErr?.response?.data || refreshErr);
        }
      } else {
        tokenStorage.clearTokens();
      }
    }

    const errorData = error.response?.data || {
      statusCode: error.response?.status || 500,
      message: error.message || 'Network communication failure. Please check backend connection.',
      errors: error.response?.data?.errors || [error.message],
    };

    return Promise.reject(errorData);
  }
);
