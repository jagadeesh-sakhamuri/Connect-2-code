import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';
import type { UserProfile } from '../core/types/domain';

export type UserProfileData = UserProfile;

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
