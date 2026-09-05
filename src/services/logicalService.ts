import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { ApiResponse } from '../core/types/api';

export const logicalService = {
  async getTopics(): Promise<ApiResponse<any[]>> {
    const res: any = await apiClient.get(API_ENDPOINTS.LOGICAL.LIST);
    const data = res?.data || res || [];
    return {
      statusCode: 200,
      message: 'Logical reasoning topics fetched',
      data: Array.isArray(data) ? data : [],
    };
  },

  async getTopicBySlug(slug: string): Promise<ApiResponse<any>> {
    const res: any = await apiClient.get(API_ENDPOINTS.LOGICAL.TOPICS, { params: { slug } });
    return {
      statusCode: 200,
      message: 'Logical reasoning topic fetched',
      data: res?.data || res || null,
    };
  },
};
