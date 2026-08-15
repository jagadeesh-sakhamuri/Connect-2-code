import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { mockDelay } from '../mock/mockAdapter';
import dashboardData from '../mock/data/dashboard.json';
import { ApiResponse } from '../core/types/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const dashboardService = {
  async getDashboardOverview(): Promise<ApiResponse<typeof dashboardData>> {
    if (USE_MOCK) {
      return mockDelay(dashboardData, 'Dashboard stats fetched');
    }
    return apiClient.get(API_ENDPOINTS.DASHBOARD.OVERVIEW);
  },
};
