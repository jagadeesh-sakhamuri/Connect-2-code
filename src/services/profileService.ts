import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { mockDelay } from '../mock/mockAdapter';
import userProfileData from '../mock/data/userProfile.json';
import { ApiResponse } from '../core/types/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const profileService = {
  async getProfile(): Promise<ApiResponse<typeof userProfileData>> {
    if (USE_MOCK) {
      return mockDelay(userProfileData, 'Profile fetched');
    }
    return apiClient.get(API_ENDPOINTS.PROFILE.GET);
  },

  async updateProfile(payload: Partial<typeof userProfileData>): Promise<ApiResponse<typeof userProfileData>> {
    if (USE_MOCK) {
      const updated = { ...userProfileData, ...payload };
      return mockDelay(updated, 'Profile updated successfully');
    }
    return apiClient.put(API_ENDPOINTS.PROFILE.UPDATE, payload);
  },
};
