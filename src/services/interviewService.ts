import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { ApiResponse } from '../core/types/api';

export const interviewService = {
  async getCategories(): Promise<ApiResponse<any[]>> {
    const res: any = await apiClient.get(API_ENDPOINTS.INTERVIEW.LIST);
    const data = res?.data || res || [];
    return {
      statusCode: 200,
      message: 'Interview categories fetched',
      data: Array.isArray(data) ? data : [],
    };
  },

  async getCategoryById(id: string | number): Promise<ApiResponse<any>> {
    const res: any = await apiClient.get(API_ENDPOINTS.INTERVIEW.DETAILS(id));
    return {
      statusCode: 200,
      message: 'Interview details fetched',
      data: res?.data || res || null,
    };
  },
};
