import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { BackendApiResponse } from './authService';

export interface ReferenceItem {
  id: number;
  refGroupCode: string;
  refCode: string;
  refName: string;
  isActive: boolean;
}

export const referenceService = {
  async getByGroupCode(refGroupCode: string): Promise<BackendApiResponse<ReferenceItem[]>> {
    return apiClient.get(API_ENDPOINTS.REFERENCE.GROUP(refGroupCode));
  },
};
