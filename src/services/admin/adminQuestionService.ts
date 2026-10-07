import { apiClient } from '../../core/api/apiClient';
import { API_ENDPOINTS } from '../../core/api/endpoints';
import { QuestionPayload, QuestionTestCase } from '../questionService';
import { executionService } from '../executionService';

export interface PageRequestPayload {
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
}

export interface QuestionListRequestPayload {
  level: number[] | null;
  companies: number[] | null;
  topic: number[] | null;
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

  /**
   * GET /api/v1/language/dropdown & /language
   * Fetches supported languages with database table IDs and reference IDs for admin execution
   */
  async getLanguagesDropdown(): Promise<Array<{ id: number; name: string; referenceId?: number }>> {
    return executionService.getLanguageDropdown();
  },

  /**
   * POST /api/v1/admin/testCode
   * Admin RUN: executes sample / visible test cases for testing without persistence.
   * Auto-resolves referenceId and falls back seamlessly if token role is not admin on Render.
   */
  async adminTestCode(payload: { questionId: number; languageId: number; sourceCode: string }): Promise<any> {
    return executionService.adminTestCode(payload);
  },

  /**
   * POST /api/v1/admin/submitCode
   * Admin SUBMIT: executes all test cases (visible + hidden) for validation without persistence.
   * Auto-resolves referenceId and falls back seamlessly if token role is not admin on Render.
   */
  async adminSubmitCode(payload: { questionId: number; languageId: number; sourceCode: string }): Promise<any> {
    return executionService.adminSubmitCode(payload);
  },
};
