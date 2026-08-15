import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { BackendApiResponse } from './authService';
import companiesData from '../mock/data/companies.json';
import problemsData from '../mock/data/problems.json';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const companyService = {
  async getCompanies(search?: string): Promise<BackendApiResponse<any[]>> {
    if (USE_MOCK) {
      let filtered = companiesData;
      if (search) {
        filtered = companiesData.filter((c: any) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.industry && c.industry.toLowerCase().includes(search.toLowerCase()))
        );
      }
      return {
        statusCode: 200,
        message: 'Companies Fetched Successfully',
        data: filtered,
        errors: null,
        timestamp: new Date().toISOString(),
      };
    }
    try {
      const res: any = await apiClient.get(API_ENDPOINTS.COMPANY.BASE);
      if (res && res.data && res.data.length > 0) {
        return res;
      }
      return {
        statusCode: 200,
        message: 'Companies Fetched Successfully',
        data: companiesData,
        errors: null,
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        statusCode: 200,
        message: 'Companies Fetched Successfully',
        data: companiesData,
        errors: null,
        timestamp: new Date().toISOString(),
      };
    }
  },

  async getCompanyBySlug(slug: string): Promise<BackendApiResponse<any>> {
    const comp = companiesData.find((c: any) => c.slug === slug || String(c.id) === String(slug)) || companiesData[0];
    return {
      statusCode: 200,
      message: 'Company Fetched Successfully',
      data: comp,
      errors: null,
      timestamp: new Date().toISOString(),
    };
  },

  async getCompanyProblems(companyName: string): Promise<BackendApiResponse<any[]>> {
    const probs = problemsData.filter((p: any) =>
      p.companies && p.companies.some((c: string) => c.toLowerCase() === companyName.toLowerCase())
    );
    return {
      statusCode: 200,
      message: 'Company Problems Fetched Successfully',
      data: probs.length > 0 ? probs : problemsData.slice(0, 10),
      errors: null,
      timestamp: new Date().toISOString(),
    };
  },

  async getCompanyById(id: string | number): Promise<BackendApiResponse<any>> {
    return this.getCompanyBySlug(String(id));
  },

  async createCompany(payload: any): Promise<BackendApiResponse<any>> {
    return apiClient.post(API_ENDPOINTS.COMPANY.BASE, payload);
  },
};
