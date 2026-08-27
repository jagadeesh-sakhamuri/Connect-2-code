import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { tokenStorage } from '../core/security/tokenStorage';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  firstName: string;
  lastName: string;
  labelUserName: string;
  email: string;
  password: string;
  role?: string;
}

export interface BackendApiResponse<T = any> {
  statusCode: number;
  message: string;
  data: T;
  errors: string[] | null;
  timestamp: string;
}

export const authService = {
  // SignUp: POST /api/v1/signUp (Does NOT log in user automatically)
  // Configured with 120s timeout to tolerate Java backend Render cold-start delays
  async signUp(payload: SignUpPayload): Promise<BackendApiResponse> {
    const requestPayload = {
      role: 'USER',
      ...payload,
    };
    return apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, requestPayload, { timeout: 120000 });
  },

  // Login: POST /api/v1/auth/login
  // Configured with 120s timeout to tolerate Java backend Render cold-start delays
  async login(payload: LoginPayload): Promise<BackendApiResponse> {
    const response: any = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, payload, { timeout: 120000 });
    if (response && response.data) {
      if (response.data.token) {
        tokenStorage.setAccessToken(response.data.token);
      }
      if (response.data.refreshToken) {
        tokenStorage.setRefreshToken(response.data.refreshToken);
      }
      if (response.data.user) {
        tokenStorage.setUser(response.data.user);
      } else {
        tokenStorage.setUser(response.data);
      }
    }
    return response;
  },

  // Logout: POST /api/v1/auth/logout
  async logout(): Promise<BackendApiResponse> {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
      }
    } catch (e) {
      console.warn('Logout API warning:', e);
    } finally {
      tokenStorage.clearTokens();
    }
    return {
      statusCode: 200,
      message: 'Logout Successful',
      data: 'User Logged Out Successfully',
      errors: null,
      timestamp: new Date().toISOString(),
    };
  },

  // Refresh Token: POST /api/v1/auth/refresh
  async refreshToken(): Promise<BackendApiResponse> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available in cookie');
    }
    const response: any = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken }, { timeout: 60000 });
    if (response && response.data) {
      if (response.data.accessToken) {
        tokenStorage.setAccessToken(response.data.accessToken);
      }
      if (response.data.refreshToken) {
        tokenStorage.setRefreshToken(response.data.refreshToken);
      }
    }
    return response;
  },
};
