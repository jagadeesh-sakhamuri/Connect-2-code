import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';

export interface UserBookmarkQuestionResponse {
  questionId: number;
  title?: string;
  difficulty?: string;
  category?: string;
  [key: string]: unknown;
}

export interface UserQuestionProgressResponse {
  questionId?: number;
  id?: number;
  title?: string;
  status?: string;
  [key: string]: unknown;
}

/**
 * Service for user-scoped question interactions:
 * - Bookmarks: POST/DELETE/GET /api/v1/users/{userId}/questions/...
 * - Solved Questions: GET /api/v1/users/{userId}/solvedQuestions
 * - Attempted Questions: GET /api/v1/users/{userId}/attemptedQuestions
 */
export const userQuestionService = {
  /**
   * POST /api/v1/users/{userId}/questions/{questionId}/bookmark
   * Bookmarks a specific question for the authenticated user.
   * Path parameters are required; no request body is needed.
   */
  async bookmarkQuestion(
    userId: string | number,
    questionId: string | number
  ): Promise<ApiResponse<unknown>> {
    if (!userId || !questionId) {
      throw new Error('Both userId and questionId are required to bookmark a question');
    }
    const res = await apiClient.post(API_ENDPOINTS.USER.BOOKMARK(userId, questionId));
    return res?.data || res;
  },

  /**
   * DELETE /api/v1/users/{userId}/questions/{questionId}/bookmark
   * Removes a bookmark for a specific question for the authenticated user.
   */
  async unbookmarkQuestion(
    userId: string | number,
    questionId: string | number
  ): Promise<ApiResponse<unknown>> {
    if (!userId || !questionId) {
      throw new Error('Both userId and questionId are required to remove a bookmark');
    }
    const res = await apiClient.delete(API_ENDPOINTS.USER.BOOKMARK(userId, questionId));
    return res?.data || res;
  },

  /**
   * GET /api/v1/users/{userId}/questions/bookmarks
   * Retrieves all bookmarked questions for the user.
   * Returns empty array if none found or response format varies.
   */
  async getBookmarkedQuestions(
    userId: string | number
  ): Promise<UserBookmarkQuestionResponse[]> {
    if (!userId) {
      return [];
    }
    const res: any = await apiClient.get(API_ENDPOINTS.USER.BOOKMARKS(userId));
    const data = res?.data || res;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },

  /**
   * GET /api/v1/users/{userId}/solvedQuestions
   * Retrieves solved questions for user progress tracking.
   */
  async getSolvedQuestions(
    userId: string | number
  ): Promise<UserQuestionProgressResponse[]> {
    if (!userId) {
      return [];
    }
    const res: any = await apiClient.get(API_ENDPOINTS.USER.SOLVED_QUESTIONS(userId));
    const data = res?.data || res;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },

  /**
   * GET /api/v1/users/{userId}/attemptedQuestions
   * Retrieves attempted questions for user progress tracking.
   */
  async getAttemptedQuestions(
    userId: string | number
  ): Promise<UserQuestionProgressResponse[]> {
    if (!userId) {
      return [];
    }
    const res: any = await apiClient.get(API_ENDPOINTS.USER.ATTEMPTED_QUESTIONS(userId));
    const data = res?.data || res;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },
};
