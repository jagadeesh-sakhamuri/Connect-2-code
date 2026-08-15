import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { BackendApiResponse } from './authService';

export interface CompanyPayload {
  id?: number;
  name: string;
  logo: string;
  website: string;
  isActive: boolean;
}

export const companyService = {
  async getCompanies(): Promise<BackendApiResponse<CompanyPayload[]>> {
    return apiClient.get(API_ENDPOINTS.COMPANY.BASE);
  },

  async getCompanyById(id: string | number): Promise<BackendApiResponse<CompanyPayload>> {
    return apiClient.get(API_ENDPOINTS.COMPANY.DETAILS(id));
  },

  async createCompany(payload: CompanyPayload): Promise<BackendApiResponse<CompanyPayload>> {
    return apiClient.post(API_ENDPOINTS.COMPANY.BASE, payload);
  },
};
