import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { ApiResponse } from '../core/types/api';

export const dashboardService = {
  async getDashboardOverview(): Promise<ApiResponse<any>> {
    const res: any = await apiClient.get(API_ENDPOINTS.DASHBOARD.STATS);
    return {
      statusCode: 200,
      message: 'Dashboard stats fetched',
      data: res?.data || res || null,
    };
  },
};
