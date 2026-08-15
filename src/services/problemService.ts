import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { mockDelay } from '../mock/mockAdapter';
import problemsData from '../mock/data/problems.json';
import { ApiResponse } from '../core/types/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export interface ProblemFilterParams {
  category?: string;
  topic?: string;
  difficulty?: string;
  search?: string;
  company?: string;
  page?: number;
  limit?: number;
}

export const problemService = {
  async getProblems(params: ProblemFilterParams = {}): Promise<ApiResponse<typeof problemsData>> {
    if (USE_MOCK) {
      let filtered = [...problemsData];

      if (params.search) {
        const query = params.search.toLowerCase();
        filtered = filtered.filter(
          (p) => p.title.toLowerCase().includes(query) || p.topic.toLowerCase().includes(query)
        );
      }

      if (params.difficulty && params.difficulty !== 'All') {
        filtered = filtered.filter((p) => p.difficulty.toLowerCase() === params.difficulty?.toLowerCase());
      }

      if (params.topic && params.topic !== 'All') {
        filtered = filtered.filter((p) => p.topic.toLowerCase() === params.topic?.toLowerCase());
      }

      if (params.company && params.company !== 'All') {
        filtered = filtered.filter((p) => p.companies.some((c) => c.toLowerCase() === params.company?.toLowerCase()));
      }

      return mockDelay(filtered, 'Problems retrieved successfully', 300, {
        page: params.page || 1,
        limit: params.limit || 10,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / (params.limit || 10)),
      });
    }

    return apiClient.get(API_ENDPOINTS.PROBLEMS.LIST, { params });
  },

  async getProblemById(id: string): Promise<ApiResponse<(typeof problemsData)[0] | null>> {
    if (USE_MOCK) {
      const problem = problemsData.find((p) => p.id === id || p.slug === id) || null;
      return mockDelay(problem, problem ? 'Problem detail fetched' : 'Problem not found');
    }
    return apiClient.get(API_ENDPOINTS.PROBLEMS.DETAILS(id));
  },

  async toggleSolveStatus(id: string): Promise<ApiResponse<{ id: string; isSolved: boolean }>> {
    if (USE_MOCK) {
      const problem = problemsData.find((p) => p.id === id);
      const isSolved = problem ? !problem.isSolved : true;
      return mockDelay({ id, isSolved }, 'Problem status updated');
    }
    return apiClient.post(API_ENDPOINTS.PROBLEMS.SUBMIT(id));
  },
};
