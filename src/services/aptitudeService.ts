import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { ApiResponse } from '../core/types/api';

export const aptitudeService = {
  async getTopics(): Promise<ApiResponse<any[]>> {
    const res: any = await apiClient.get(API_ENDPOINTS.APTITUDE.LIST);
    const data = res?.data || res || [];
    return {
      statusCode: 200,
      message: 'Aptitude topics fetched',
      data: Array.isArray(data) ? data : [],
    };
  },

  async getTopicBySlug(slug: string): Promise<ApiResponse<any>> {
    const res: any = await apiClient.get(API_ENDPOINTS.APTITUDE.TOPICS, { params: { slug } });
    return {
      statusCode: 200,
      message: 'Aptitude topic fetched',
      data: res?.data || res || null,
    };
  },
};
