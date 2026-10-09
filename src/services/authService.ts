import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { tokenStorage } from '../core/security/tokenStorage';
import type { ApiResponse } from '../core/types/api';

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
    // apiClient unwraps AxiosResponse.data, but the backend still returns its
    // standard { statusCode, data } envelope. Accept both token field names
    // used by the backend versions and tolerate an extra nested data envelope.
    const loginData = response?.data?.data || response?.data || response;
    const accessToken = loginData?.accessToken || loginData?.token;
    if (accessToken) {
      tokenStorage.setAccessToken(accessToken);
    }
    if (loginData?.refreshToken) {
      tokenStorage.setRefreshToken(loginData.refreshToken);
    }
    const user = loginData?.user || loginData;
    if (user && (user.id || user.email || user.firstName || user.fullName)) {
      tokenStorage.setUser(user);
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
    const data = response?.data?.data || response?.data || response;
    const bearerToken = data?.accessToken || data?.token;
    if (bearerToken) {
      tokenStorage.setAccessToken(bearerToken);
    }
    if (data?.refreshToken) {
      tokenStorage.setRefreshToken(data.refreshToken);
    }
    const user = data?.user || data;
    if (user?.id && user?.email) {
      tokenStorage.setUser({
        id: user.id,
        email: user.email,
        role: user.role || 'USER',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
    return response;
  },

  // Exchange Google OAuth Refresh Token: POST /api/v1/auth/refresh
  async exchangeRefreshToken(refreshToken: string): Promise<ApiResponse<AuthResponseData>> {
    if (!refreshToken) {
      throw new Error('No refresh token provided');
    }
    const response: any = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken }, { timeout: 60000 });
    const data = response?.data?.data || response?.data || response;
    const bearerToken = data?.accessToken || data?.token;
    if (bearerToken) {
      tokenStorage.setAccessToken(bearerToken);
    }
    if (data?.refreshToken) {
      tokenStorage.setRefreshToken(data.refreshToken);
    }
    const user = data?.user || data;
    if (user?.id || user?.email) {
      tokenStorage.setUser({
        id: user.id,
        email: user.email,
        role: user.role || 'USER',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
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
