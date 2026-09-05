import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { ApiResponse } from '../core/types/api';

export interface UserProfileData {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  collegeName?: string;
  graduationYear?: number | string;
  phone?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  leetcodeUrl?: string;
  bio?: string;
  avatarUrl?: string;
}

export const profileService = {
  async getProfile(): Promise<ApiResponse<UserProfileData>> {
    const res: any = await apiClient.get(API_ENDPOINTS.USER.PROFILE);
    return {
      statusCode: 200,
      message: 'Profile fetched',
      data: res?.data || res || null,
    };
  },

  async updateProfile(payload: Partial<UserProfileData>): Promise<ApiResponse<UserProfileData>> {
    const res: any = await apiClient.put(API_ENDPOINTS.USER.UPDATE, payload);
    return {
      statusCode: 200,
      message: 'Profile updated successfully',
      data: res?.data || res || null,
    };
  },
};
