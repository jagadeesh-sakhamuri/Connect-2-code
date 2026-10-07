import { apiClient } from '../../core/api/apiClient';
import { API_ENDPOINTS } from '../../core/api/endpoints';
import { executionService } from '../executionService';

export interface AdminLanguageItem {
  id?: number;
  referenceId: number;
  languageName?: string;
  judge0LanguageId: number;
  version?: string;
  isActive?: boolean;
}

export interface LanguageDropdownItem {
  id: number;
  name: string;
  referenceId?: number;
}

export interface LanguageApiResponse<T = any> {
  status?: number;
  statusCode?: number;
  message: string;
  data: T;
  errors?: string[] | null;
}

/**
 * Dedicated Admin Language Service Layer
 * Supports full language lifecycle and dropdown integration
 * Base URL: /api/v1/language
 */
export const adminLanguageService = {
  /**
   * GET /api/v1/language/dropdown & /language
   * Fetches active languages with table IDs and reference IDs for code execution.
   */
  async getLanguageDropdown(): Promise<LanguageDropdownItem[]> {
    return executionService.getLanguageDropdown();
  },

  /**
   * GET /api/v1/language
   * Fetches all registered languages (both active and inactive)
   */
  async getLanguages(): Promise<AdminLanguageItem[]> {
    const res: any = await apiClient.get(API_ENDPOINTS.LANGUAGE.BASE);
    const data = res?.data || res;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },

  /**
   * GET /api/v1/language/:id
   * Fetches specific language entity for viewing or editing
   */
  async getLanguageById(id: number | string): Promise<AdminLanguageItem> {
    const res: any = await apiClient.get(API_ENDPOINTS.LANGUAGE.DETAILS(id));
    return res?.data || res;
  },

  /**
   * POST /api/v1/language
   * Registers a new language in the platform (without id)
   */
  async createLanguage(payload: {
    referenceId: number;
    judge0LanguageId: number;
    version?: string;
    isActive?: boolean;
  }): Promise<LanguageApiResponse<AdminLanguageItem>> {
    const res: any = await apiClient.post(API_ENDPOINTS.LANGUAGE.BASE, payload);
    return res?.data || res;
  },

  /**
   * POST /api/v1/language
   * Updates an existing language (includes id in request body)
   */
  async updateLanguage(payload: {
    id: number;
    referenceId: number;
    judge0LanguageId: number;
    version?: string;
    isActive?: boolean;
  }): Promise<LanguageApiResponse<AdminLanguageItem>> {
    const res: any = await apiClient.post(API_ENDPOINTS.LANGUAGE.BASE, payload);
    return res?.data || res;
  },

  /**
   * DELETE /api/v1/language/:id
   * Performs soft delete (sets isActive = false)
   */
  async deleteLanguage(id: number | string): Promise<LanguageApiResponse<null>> {
    const res: any = await apiClient.delete(API_ENDPOINTS.LANGUAGE.DETAILS(id));
    return res?.data || res;
  },
};

