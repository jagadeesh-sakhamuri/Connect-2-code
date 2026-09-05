import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { BackendApiResponse } from './authService';

export const companyService = {
  async getCompanies(search?: string): Promise<BackendApiResponse<any[]>> {
    const res: any = await apiClient.get(API_ENDPOINTS.COMPANY.BASE, { params: { search } });
    const rawData = res?.data || res || [];
    const list = Array.isArray(rawData) ? rawData : (Array.isArray(rawData.content) ? rawData.content : []);
    const mappedList = list.map((item: any) => {
      const name = item.name || item.companyName || '';
      const safeSlug = item.slug || (item.id ? String(item.id) : name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      return {
        ...item,
        id: item.id ?? safeSlug,
        name: name,
        slug: safeSlug,
        logo: item.logo || item.logoUrl || '',
        logoUrl: item.logoUrl || item.logo || '',
      };
    });
    return {
      statusCode: 200,
      message: 'Companies Fetched Successfully',
      data: mappedList,
      errors: null,
      timestamp: new Date().toISOString(),
    };
  },

  async getCompanyBySlug(slug: string): Promise<BackendApiResponse<any>> {
    let res: any;
    try {
      res = await apiClient.get(API_ENDPOINTS.COMPANY.DETAILS(slug));
    } catch (err) {
      // If fetching by slug failed (e.g. backend expects numeric ID), match from companies list
      try {
        const allCompRes = await this.getCompanies();
        const matched = (allCompRes.data || []).find(
          (c: any) => String(c.id) === String(slug) || c.slug === slug || c.name?.toLowerCase() === slug.toLowerCase()
        );
        if (matched && matched.id && String(matched.id) !== String(slug)) {
          res = await apiClient.get(API_ENDPOINTS.COMPANY.DETAILS(matched.id));
        } else if (matched) {
          return {
            statusCode: 200,
            message: 'Company Fetched Successfully',
            data: matched,
            errors: null,
            timestamp: new Date().toISOString(),
          };
        } else {
          throw err;
        }
      } catch {
        throw err;
      }
    }
    return {
      statusCode: 200,
      message: 'Company Fetched Successfully',
      data: res?.data || res || null,
      errors: null,
      timestamp: new Date().toISOString(),
    };
  },

  async getCompanyProblems(companyIdOrName: string | number): Promise<BackendApiResponse<any[]>> {
    const res: any = await apiClient.get(API_ENDPOINTS.COMPANY.PROBLEMS(companyIdOrName));
    const rawData = res?.data || res || [];
    const list = Array.isArray(rawData) ? rawData : (Array.isArray(rawData.content) ? rawData.content : []);
    return {
      statusCode: 200,
      message: 'Company Problems Fetched Successfully',
      data: list,
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
