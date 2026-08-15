import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { mockDelay } from '../mock/mockAdapter';
import interviewData from '../mock/data/interviews.json';
import { ApiResponse } from '../core/types/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const interviewService = {
  async getQuestions(category?: string): Promise<ApiResponse<typeof interviewData>> {
    if (USE_MOCK) {
      let filtered = [...interviewData];
      if (category && category !== 'All') {
        filtered = filtered.filter((q) => q.category.toLowerCase() === category.toLowerCase());
      }
      return mockDelay(filtered, 'Interview questions fetched');
    }
    return apiClient.get(API_ENDPOINTS.INTERVIEWS.LIST, { params: { category } });
  },
};
