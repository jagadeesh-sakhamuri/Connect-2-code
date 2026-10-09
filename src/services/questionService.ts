import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';
import type { Question, QuestionHint, QuestionTestCase } from '../core/types/domain';

export type { Question, QuestionHint, QuestionTestCase };

export type QuestionPayload = Question;

export const questionService = {
  async saveOrUpdate(payload: QuestionPayload, signal?: AbortSignal): Promise<ApiResponse<QuestionPayload>> {
    return apiClient.post(API_ENDPOINTS.QUESTION.BASE, payload, { signal });
  },

  async getById(id: string | number, signal?: AbortSignal): Promise<ApiResponse<QuestionPayload>> {
    return apiClient.get(API_ENDPOINTS.QUESTION.DETAILS(id), { signal });
  },

  async addTestCases(
    id: string | number,
    testCases: QuestionTestCase[],
    signal?: AbortSignal
  ): Promise<ApiResponse<QuestionTestCase[]>> {
    return apiClient.post(API_ENDPOINTS.QUESTION.TEST_CASES(id), testCases, { signal });
  },
};
