import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { ApiResponse } from '../core/types/api';

export const verbalService = {
  async getTopics(): Promise<ApiResponse<any[]>> {
    const res: any = await apiClient.get(API_ENDPOINTS.VERBAL.LIST);
    const data = res?.data || res || [];
    return {
      statusCode: 200,
      message: 'Verbal ability topics fetched',
      data: Array.isArray(data) ? data : [],
    };
  },

  async getTopicBySlug(slug: string): Promise<ApiResponse<any>> {
    const res: any = await apiClient.get(API_ENDPOINTS.VERBAL.TOPICS, { params: { slug } });
    return {
      statusCode: 200,
      message: 'Verbal ability topic fetched',
      data: res?.data || res || null,
    };
  },
};
