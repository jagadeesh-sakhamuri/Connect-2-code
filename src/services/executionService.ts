import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { tokenStorage } from '../core/security/tokenStorage';

export interface LanguageDropdownItem {
  id: number;
  name: string;
  referenceId?: number;
  judge0LanguageId?: number;
  version?: string;
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
  status: 'Passed' | 'Failed' | 'Compilation Error' | string;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
}

export interface ExecutionResultData {
  totalTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
  runtimeMs?: number | string;
  memoryMb?: number | string;
  testCases: ExecutionTestCaseResult[];
}

// Default fallback mappings between Table ID and Reference Library ID
const DEFAULT_ID_TO_REF: Record<number, number> = {
  1: 5, // Java: Table ID 1 -> referenceId 5
  2: 6, // Python: Table ID 2 -> referenceId 6
  3: 7, // C++: Table ID 3 -> referenceId 7
  4: 8, // JavaScript: Table ID 4 -> referenceId 8
};

const DEFAULT_NAME_TO_REF: Record<string, number> = {
  java: 5,
  python: 6,
  'c++': 7,
  cpp: 7,
  javascript: 8,
  js: 8,
};

let cachedLanguages: LanguageDropdownItem[] | null = null;
let languageFetchPromise: Promise<LanguageDropdownItem[]> | null = null;

export const executionService = {
  /**
   * Fetches supported languages with both Table IDs and Reference IDs.
   * Prioritizes /api/v1/language to get referenceId directly from entity records.
   */
  async getLanguageDropdown(): Promise<LanguageDropdownItem[]> {
    if (cachedLanguages && cachedLanguages.length > 0) {
      return cachedLanguages;
    }

    if (languageFetchPromise) {
      return languageFetchPromise;
    }

    languageFetchPromise = (async () => {
      try {
        // Attempt full language list first as it includes referenceId
        const res: any = await apiClient.get(API_ENDPOINTS.LANGUAGE.BASE);
        const data = res?.data || res;
        if (Array.isArray(data) && data.length > 0) {
          const list: LanguageDropdownItem[] = data.map((item: any) => ({
            id: Number(item.id),
            name: item.languageName || item.name || 'Unknown',
            referenceId: Number(item.referenceId || DEFAULT_ID_TO_REF[item.id] || item.id),
            judge0LanguageId: item.judge0LanguageId ? Number(item.judge0LanguageId) : undefined,
            version: item.version,
          }));
          cachedLanguages = list;
          return list;
        }
      } catch {
        // Fall through to dropdown endpoint if base is unavailable
      }

      try {
        const res: any = await apiClient.get(API_ENDPOINTS.LANGUAGE.DROPDOWN);
        const data = res?.data || res;
        if (Array.isArray(data) && data.length > 0) {
          const list: LanguageDropdownItem[] = data.map((item: any) => ({
            id: Number(item.id),
            name: item.name || 'Unknown',
            referenceId: DEFAULT_ID_TO_REF[Number(item.id)] || Number(item.id),
          }));
          cachedLanguages = list;
          return list;
        }
      } catch (err) {
        console.warn('Language dropdown fetch fallback to defaults:', err);
      }

      const defaultList: LanguageDropdownItem[] = [
        { id: 1, name: 'Java', referenceId: 5, judge0LanguageId: 62, version: 'Java 17' },
        { id: 2, name: 'Python', referenceId: 6, judge0LanguageId: 71, version: 'Python 3' },
        { id: 3, name: 'C++', referenceId: 7, judge0LanguageId: 54, version: 'C++ 17' },
        { id: 4, name: 'JavaScript', referenceId: 8, judge0LanguageId: 63, version: 'JavaScript' },
      ];
      cachedLanguages = defaultList;
      return defaultList;
    })().finally(() => {
      languageFetchPromise = null;
    });

    return languageFetchPromise;
  },

  /**
   * Resolves any incoming languageId (table id 1-4 or name) to backend required referenceId (5-8).
   */
  async resolveLanguageReferenceId(languageId: number, languageName?: string): Promise<number> {
    const numericId = Number(languageId);

    // If already known referenceId (5, 6, 7, 8) or greater
    if (numericId >= 5) {
      return numericId;
    }

    // Check cached languages
    if (!cachedLanguages) {
      await this.getLanguageDropdown().catch(() => {});
    }

    if (cachedLanguages) {
      const match = cachedLanguages.find((l) => l.id === numericId || l.referenceId === numericId);
      if (match?.referenceId) {
        return match.referenceId;
      }
      if (languageName) {
        const nameMatch = cachedLanguages.find(
          (l) => l.name.toLowerCase() === languageName.toLowerCase()
        );
        if (nameMatch?.referenceId) {
          return nameMatch.referenceId;
        }
      }
    }

    // Fallback to static mapping
    if (DEFAULT_ID_TO_REF[numericId]) {
      return DEFAULT_ID_TO_REF[numericId];
    }
    if (languageName && DEFAULT_NAME_TO_REF[languageName.toLowerCase()]) {
      return DEFAULT_NAME_TO_REF[languageName.toLowerCase()];
    }

    return numericId;
  },

  /**
   * Prepares and sanitizes code execution payload:
   * 1. Resolves languageId to referenceId (e.g. 1 -> 5)
   * 2. Sanitizes Java classes to `public class Main` for Judge0 compatibility
   */
  async prepareExecutionPayload(payload: CodeExecutionPayload): Promise<CodeExecutionPayload> {
    const resolvedLanguageId = await this.resolveLanguageReferenceId(payload.languageId);
    let sanitizedCode = payload.sourceCode || '';

    // If Java (referenceId 5), ensure Judge0 Main entry class
    if (resolvedLanguageId === 5) {
      if (/public\s+class\s+Solution\b/.test(sanitizedCode)) {
        sanitizedCode = sanitizedCode.replace(/public\s+class\s+Solution\b/g, 'public class Main');
      }
    }

    return {
      questionId: Number(payload.questionId),
      languageId: resolvedLanguageId,
      sourceCode: sanitizedCode,
    };
  },

  /**
   * POST /api/v1/runCode
   * Normal user RUN: executes sample / visible test cases only.
   */
  async runCode(payload: CodeExecutionPayload): Promise<ExecutionResultData> {
    const finalPayload = await this.prepareExecutionPayload(payload);
    const res: any = await apiClient.post(API_ENDPOINTS.EXECUTION.USER_RUN, finalPayload);
    return res?.data || res;
  },

  /**
   * POST /api/v1/submitCode
   * Normal user SUBMIT: executes all test cases (visible, mandatory, edge, hidden).
   */
  async submitCode(payload: CodeExecutionPayload): Promise<ExecutionResultData> {
    const finalPayload = await this.prepareExecutionPayload(payload);
    const res: any = await apiClient.post(API_ENDPOINTS.EXECUTION.USER_SUBMIT, finalPayload);
    return res?.data || res;
  },

  /**
   * POST /api/v1/admin/testCode
   * Admin user RUN: executes sample / visible test cases for testing without persistence.
   * Gracefully falls back to /runCode if role is not ADMIN on Render backend.
   */
  async adminTestCode(payload: CodeExecutionPayload): Promise<ExecutionResultData> {
    const finalPayload = await this.prepareExecutionPayload(payload);
    const user = tokenStorage.getUser();
    const role = user?.role?.toUpperCase();
    const hasAdminRole = role === 'ADMIN' || role === 'ROLE_ADMIN';

    if (hasAdminRole) {
      try {
        const res: any = await apiClient.post(API_ENDPOINTS.EXECUTION.ADMIN_RUN, finalPayload);
        return res?.data || res;
      } catch (err: any) {
        const isAuthError =
          err?.statusCode === 401 ||
          err?.statusCode === 403 ||
          err?.message?.toLowerCase().includes('auth') ||
          (Array.isArray(err?.errors) &&
            err.errors.some(
              (e: string) => e?.toLowerCase().includes('jwt') || e?.toLowerCase().includes('token')
            ));
        if (isAuthError) {
          console.warn('Falling back from /admin/testCode to /runCode due to token role:', err);
          return this.runCode(finalPayload);
        }
        throw err;
      }
    }
    return this.runCode(finalPayload);
  },

  /**
   * POST /api/v1/admin/submitCode
   * Admin user SUBMIT: executes all test cases for validation without persistence.
   * Gracefully falls back to /submitCode if role is not ADMIN on Render backend.
   */
  async adminSubmitCode(payload: CodeExecutionPayload): Promise<ExecutionResultData> {
    const finalPayload = await this.prepareExecutionPayload(payload);
    const user = tokenStorage.getUser();
    const role = user?.role?.toUpperCase();
    const hasAdminRole = role === 'ADMIN' || role === 'ROLE_ADMIN';

    if (hasAdminRole) {
      try {
        const res: any = await apiClient.post(API_ENDPOINTS.EXECUTION.ADMIN_SUBMIT, finalPayload);
        return res?.data || res;
      } catch (err: any) {
        const isAuthError =
          err?.statusCode === 401 ||
          err?.statusCode === 403 ||
          err?.message?.toLowerCase().includes('auth') ||
          (Array.isArray(err?.errors) &&
            err.errors.some(
              (e: string) => e?.toLowerCase().includes('jwt') || e?.toLowerCase().includes('token')
            ));
        if (isAuthError) {
          console.warn('Falling back from /admin/submitCode to /submitCode due to token role:', err);
          return this.submitCode(finalPayload);
        }
        throw err;
      }
    }
    return this.submitCode(finalPayload);
  },
};
