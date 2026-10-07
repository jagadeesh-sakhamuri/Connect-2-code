import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';

export interface LanguageDropdownItem {
  id: number;
  name: string;
}

export interface CodeExecutionPayload {
  questionId: number;
  languageId: number;
  sourceCode: string;
}

export interface ExecutionTestCaseResult {
  testCaseId: number;
  testCaseType: string;
  isHidden?: boolean | null;
  status: 'Passed' | 'Failed' | string;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
}

export interface ExecutionResultData {
  totalTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
  testCases: ExecutionTestCaseResult[];
}

export const executionService = {
  /**
   * GET /api/v1/language/dropdown
   * Fetches supported programming languages with their database table IDs.
   */
  async getLanguageDropdown(): Promise<LanguageDropdownItem[]> {
    const res: any = await apiClient.get(API_ENDPOINTS.LANGUAGE.DROPDOWN);
    const data = res?.data || res;
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    return [
      { id: 1, name: 'Java' },
      { id: 2, name: 'Python' },
      { id: 3, name: 'C++' },
      { id: 4, name: 'JavaScript' },
    ];
  },

  /**
   * POST /api/v1/runCode
   * Normal user RUN: executes sample / visible test cases only.
   */
  async runCode(payload: CodeExecutionPayload): Promise<ExecutionResultData> {
    const res: any = await apiClient.post(API_ENDPOINTS.EXECUTION.USER_RUN, payload);
    return res?.data || res;
  },

  /**
   * POST /api/v1/submitCode
   * Normal user SUBMIT: executes all test cases (visible, mandatory, edge, hidden).
   */
  async submitCode(payload: CodeExecutionPayload): Promise<ExecutionResultData> {
    const res: any = await apiClient.post(API_ENDPOINTS.EXECUTION.USER_SUBMIT, payload);
    return res?.data || res;
  },

  /**
   * POST /api/v1/admin/testCode
   * Admin user RUN: executes sample / visible test cases for testing without persistence.
   */
  async adminTestCode(payload: CodeExecutionPayload): Promise<ExecutionResultData> {
    const res: any = await apiClient.post(API_ENDPOINTS.EXECUTION.ADMIN_RUN, payload);
    return res?.data || res;
  },

  /**
   * POST /api/v1/admin/submitCode
   * Admin user SUBMIT: executes all test cases for validation without persistence.
   */
  async adminSubmitCode(payload: CodeExecutionPayload): Promise<ExecutionResultData> {
    const res: any = await apiClient.post(API_ENDPOINTS.EXECUTION.ADMIN_SUBMIT, payload);
    return res?.data || res;
  },
};
