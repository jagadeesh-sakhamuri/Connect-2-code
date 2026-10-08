import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { tokenStorage } from '../core/security/tokenStorage';
import type { ApiResponse } from '../core/types/api';
import type { AuthSessionData } from '../core/types/domain';

export interface AuthResponseData {
  id?: number | string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  role?: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id?: number | string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    role?: string;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  password?: string;
}

export const authService = {
  // SignUp: POST /api/v1/signUp (Does NOT require OTP)
  // Configured with 120s timeout to tolerate Java backend Render cold-start delays
  async signUp(payload: SignUpPayload & { labelUserName?: string; userName?: string }): Promise<ApiResponse<AuthResponseData>> {
    const rawLabel = payload.email ? payload.email.split('@')[0] : `${payload.firstName}${payload.lastName}`;
    const sanitizedLabel = rawLabel.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || `user${Date.now()}`;

    const requestPayload = {
      role: 'USER',
      labelUserName: payload.labelUserName || sanitizedLabel,
      userName: payload.userName || sanitizedLabel,
      ...payload,
    };
    return apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, requestPayload, { timeout: 120000 });
  },

  // Login: POST /api/v1/auth/login
  // Configured with 120s timeout to tolerate Java backend Render cold-start delays
  async login(payload: LoginPayload): Promise<ApiResponse<AuthResponseData>> {
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
  async logout(): Promise<ApiResponse<string>> {
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
  async refreshToken(): Promise<ApiResponse<AuthResponseData>> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available in cookie');
    }
    const response: any = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken }, { timeout: 60000 });
    if (response && response.data) {
      const data = response.data;
      const bearerToken = data.token || data.accessToken;
      if (bearerToken) {
        tokenStorage.setAccessToken(bearerToken);
      }
      if (data.refreshToken) {
        tokenStorage.setRefreshToken(data.refreshToken);
      }
      if (data.id && data.email) {
        tokenStorage.setUser({
          id: data.id,
          email: data.email,
          role: data.role || 'USER',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
        });
      }
    }
    return response;
  },

  // Exchange Google OAuth Refresh Token: POST /api/v1/auth/refresh
  async exchangeRefreshToken(refreshToken: string): Promise<ApiResponse<AuthResponseData>> {
    if (!refreshToken) {
      throw new Error('No refresh token provided');
    }
    const response: any = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken }, { timeout: 60000 });
    if (response && response.data) {
      const data = response.data;
      const bearerToken = data.token || data.accessToken;
      if (bearerToken) {
        tokenStorage.setAccessToken(bearerToken);
      }
      if (data.refreshToken) {
        tokenStorage.setRefreshToken(data.refreshToken);
      }
      const userObj = {
        id: data.id,
        email: data.email,
        role: data.role || 'USER',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
      };
      tokenStorage.setUser(userObj);
    }
    return response;
  },

  // Generate Password Reset OTP: POST /api/v1/auth/generatePasswordResetOtp
  async generatePasswordResetOtp(email: string): Promise<ApiResponse<unknown>> {
    return apiClient.post(API_ENDPOINTS.AUTH.GENERATE_PASSWORD_RESET_OTP, { email }, { timeout: 60000 });
  },

  // Verify OTP and Reset Password: POST /api/v1/auth/verifyPasswordResetOtp
  async verifyPasswordResetOtp(payload: VerifyOtpPayload): Promise<ApiResponse<unknown>> {
    return apiClient.post(API_ENDPOINTS.AUTH.VERIFY_PASSWORD_RESET_OTP, payload, { timeout: 60000 });
  },

};
