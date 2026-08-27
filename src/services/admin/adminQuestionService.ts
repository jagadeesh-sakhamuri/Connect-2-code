import { apiClient } from '../../core/api/apiClient';
import { API_ENDPOINTS } from '../../core/api/endpoints';
import { QuestionPayload, QuestionTestCase } from '../questionService';

export interface PageRequestPayload {
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
}

export interface QuestionListRequestPayload {
  level: string | number | null;
  companies: string[] | number[] | null;
  topic: string | number | null;
  searchText: string | null;
  pageRequest: PageRequestPayload;
}

export interface QuestionListItem {
  id: number;
  title: string;
  description: string;
  difficultyId?: number;
  difficultyName?: string;
  topicId?: number;
  topicName?: string;
  isOwnProblem?: boolean;
  isActive?: boolean;
}

export interface PaginatedQuestionResponse {
  content: QuestionListItem[];
  pageable?: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort?: any;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

/**
 * Dedicated Admin Question Service Layer
 * REAL API ONLY — Explicitly bypasses client-side mock modes (VITE_USE_MOCK).
 * Routes 100% of network requests through the shared `apiClient` instance
 * targeting the Java Spring Boot REST API (`https://codingplatform-tdt0.onrender.com/api/v1`).
 */
export const adminQuestionService = {
  /**
   * POST /api/v1/questions
   * Fetches real paginated question list directly from Java Spring Boot backend.
   */
  async getQuestions(payload: QuestionListRequestPayload): Promise<any> {
    return apiClient.post(API_ENDPOINTS.PROBLEMS.LIST, payload);
  },

  /**
   * GET /api/v1/question/:id
   * Fetches single question statement and details directly from Java backend.
   */
  async getQuestionById(id: string | number): Promise<any> {
    return apiClient.get(API_ENDPOINTS.QUESTION.DETAILS(id));
  },

  /**
   * POST /api/v1/question
   * Saves a new question or updates an existing question in the Java database.
   */
  async saveOrUpdateQuestion(payload: QuestionPayload): Promise<any> {
    return apiClient.post(API_ENDPOINTS.QUESTION.BASE, payload);
  },

  /**
   * POST /api/v1/question/:id/testCases
   * Attaches test cases to a question in the Java database.
   */
  async addTestCases(id: string | number, testCases: QuestionTestCase[]): Promise<any> {
    return apiClient.post(API_ENDPOINTS.QUESTION.TEST_CASES(id), testCases);
  },
};
