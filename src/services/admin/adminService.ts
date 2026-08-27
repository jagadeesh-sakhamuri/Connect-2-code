import { apiClient } from '../../core/api/apiClient';

export interface AdminDashboardStatsResponse {
  statusCode: number;
  message: string;
  data: Record<string, any> | null;
  errors: string[] | null;
  timestamp: string;
}

/**
 * Centralized Admin REST API Service Layer
 * Reuses the exact same Axios HTTP client (apiClient) and Cookie security system as the User Frontend.
 * Ensures zero duplicate Axios instances or unauthenticated requests.
 */
export const adminService = {
  /**
   * Fetches Real-Time Admin Dashboard Metrics
   * Will call live backend endpoint once provided (e.g. GET /api/v1/admin/stats)
   */
  async getDashboardStats(): Promise<AdminDashboardStatsResponse> {
    try {
      const response: any = await apiClient.get('/admin/stats');
      return response;
    } catch (error: any) {
      // Handles unintegrated or missing API gracefully without breaking UI
      if (error?.statusCode === 404 || error?.response?.status === 404) {
        return {
          statusCode: 404,
          message: 'Admin Dashboard API not yet exposed by Java backend',
          data: null,
          errors: ['API contract awaiting integration'],
          timestamp: new Date().toISOString(),
        };
      }
      throw error;
    }
  },
};
