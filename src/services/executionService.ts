import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type {
  CodeExecutionPayload,
  ExecutionResult,
  ExecutionTestCaseResult,
  Language,
} from '../core/types/domain';

export type { CodeExecutionPayload, ExecutionTestCaseResult };
export type LanguageDropdownItem = Language;
export type ExecutionResultData = ExecutionResult;

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
            referenceId:
              item.referenceId !== undefined && item.referenceId !== null
                ? Number(item.referenceId)
                : undefined,
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
            referenceId:
              item.referenceId !== undefined && item.referenceId !== null
                ? Number(item.referenceId)
                : undefined,
          }));
          cachedLanguages = list;
          return list;
        }
      } catch (err) {
        console.warn('Language dropdown fetch fallback to defaults:', err);
      }

      throw new Error('Supported languages could not be loaded from the backend');
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

    throw new Error(
      languageName
        ? `No backend reference mapping found for language: ${languageName}`
        : `No backend reference mapping found for language id: ${numericId}`
    );
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
   * Backend authorization remains authoritative; no privileged-to-user endpoint fallback.
   */
  async adminTestCode(payload: CodeExecutionPayload): Promise<ExecutionResultData> {
    const finalPayload = await this.prepareExecutionPayload(payload);
    const res: any = await apiClient.post(API_ENDPOINTS.EXECUTION.ADMIN_RUN, finalPayload);
    return res?.data || res;
  },

  /**
   * POST /api/v1/admin/submitCode
   * Admin user SUBMIT: executes all test cases for validation without persistence.
   * Backend authorization remains authoritative; no privileged-to-user endpoint fallback.
   */
  async adminSubmitCode(payload: CodeExecutionPayload): Promise<ExecutionResultData> {
    const finalPayload = await this.prepareExecutionPayload(payload);
    const res: any = await apiClient.post(API_ENDPOINTS.EXECUTION.ADMIN_SUBMIT, finalPayload);
    return res?.data || res;
  },
};
