import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { BackendApiResponse } from './authService';

export interface QuestionHint {
  id?: number | null;
  questionId?: number;
  hintText: string;
  displayOrder?: number;
}

export interface QuestionTestCase {
  id?: number;
  questionId?: number;
  input: string;
  expectedOutput: string;
  explanation: string;
  isHidden: boolean;
  displayOrder: number;
  typeRefGroupCode: string;
  typeRefCode: string;
  typeRefName?: string;
}

export interface QuestionPayload {
  id?: number;
  title: string;
  description: string;
  constraints: string;
  difficultyRefGroupCode: string;
  difficultyRefCode: string;
  difficultyRefName: string;
  topicRefGroupCode: string;
  topicRefCode: string;
  topicRefName: string;
  qpfRefGroupCode: string;
  qpfRefCode: string;
  qpfRefName: string;
  questionHints: QuestionHint[];
  companies: any[];
  hackerRankUrl?: string;
  leetCodeUrl?: string;
  gfgUrl?: string;
  isOwnProblem?: boolean;
  testCases?: QuestionTestCase[];
}

export const questionService = {
  async saveOrUpdate(payload: QuestionPayload): Promise<BackendApiResponse<QuestionPayload>> {
    return apiClient.post(API_ENDPOINTS.QUESTION.BASE, payload);
  },

  async getById(id: string | number): Promise<BackendApiResponse<QuestionPayload>> {
    return apiClient.get(API_ENDPOINTS.QUESTION.DETAILS(id));
  },

  async addTestCases(id: string | number, testCases: QuestionTestCase[]): Promise<BackendApiResponse<QuestionTestCase[]>> {
    return apiClient.post(API_ENDPOINTS.QUESTION.TEST_CASES(id), testCases);
  },
};
