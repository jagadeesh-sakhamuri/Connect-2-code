import { apiClient, isRequestCanceled } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import type { ApiResponse } from '../core/types/api';
import type { Company, Problem } from '../core/types/domain';
import { mapProblemDto } from '../core/mappers/problemMapper';

export type CompanyItem = Company;

export const companyService = {
  async getCompanies(search?: string, signal?: AbortSignal): Promise<ApiResponse<Company[]>> {
    try {
      const res: any = await apiClient.get(API_ENDPOINTS.COMPANY.BASE, { params: { search }, signal });
      const rawData = res?.data || res || [];
      const list = Array.isArray(rawData) ? rawData : (Array.isArray(rawData.content) ? rawData.content : []);
      if (list.length > 0) {
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
      }
    } catch (err) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      console.warn('Backend getCompanies failed, falling back to cached companies list:', err);
    }

    const filtered = search
      ? FALLBACK_COMPANIES.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      : FALLBACK_COMPANIES;

    return {
      statusCode: 200,
      message: 'Companies Fetched Successfully (Cached)',
      data: filtered,
      errors: null,
      timestamp: new Date().toISOString(),
    };
  },

  async getCompanyBySlug(slug: string, signal?: AbortSignal): Promise<ApiResponse<Company>> {
    try {
      const res: any = await apiClient.get(API_ENDPOINTS.COMPANY.DETAILS(slug), { signal });
      const compData = res?.data || res;
      if (compData && (compData.id || compData.name)) {
        const name = compData.name || compData.companyName || '';
        const safeSlug =
          compData.slug ||
          (compData.id ? String(compData.id) : '') ||
          slug ||
          name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return {
          statusCode: 200,
          message: 'Company Fetched Successfully',
          data: {
            ...compData,
            name,
            slug: safeSlug,
          },
          errors: null,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (err) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      console.warn('Backend getCompanyBySlug direct call failed:', err);
    }

    try {
      const allCompRes = await this.getCompanies(undefined, signal);
      const matched = (allCompRes.data || []).find(
        (c: any) =>
          String(c.id) === String(slug) ||
          c.slug === slug ||
          c.name?.toLowerCase() === slug.toLowerCase() ||
          c.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug.toLowerCase()
      );
      if (matched) {
        return {
          statusCode: 200,
          message: 'Company Fetched Successfully',
          data: matched,
          errors: null,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (err) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      console.warn('Company fallback matching failed:', err);
    }

    throw new Error(`Company not found for slug: ${slug}`);
  },

  async getCompanyProblems(
    companyIdOrName?: string | number,
    companyName?: string,
    signal?: AbortSignal
  ): Promise<ApiResponse<Problem[]>> {
    let compIdNum =
      companyIdOrName !== undefined && !isNaN(Number(companyIdOrName)) ? Number(companyIdOrName) : undefined;
    const nameStr = companyName || (isNaN(Number(companyIdOrName)) ? String(companyIdOrName) : undefined);

    if (compIdNum === undefined && nameStr) {
      const normName = nameStr.toLowerCase().trim();
      if (COMPANY_NAME_TO_ID[normName]) {
        compIdNum = COMPANY_NAME_TO_ID[normName];
      }
    }

    let problemsList: any[] = [];
    const seenTitles = new Set<string>();

    // 1. Query real backend POST /api/v1/questions with { companies: [compIdNum] }
    if (compIdNum !== undefined) {
      try {
        const payload = {
          level: null,
          companies: [compIdNum],
          topic: null,
          searchText: null,
          pageRequest: {
            pageNumber: 0,
            pageSize: 50,
            sortBy: 'id',
            sortDirection: 'ASC' as const,
          },
        };

        const res: any = await apiClient.post(API_ENDPOINTS.PROBLEMS.LIST, payload, { signal });
        const raw = res?.data || res;
        const list = Array.isArray(raw?.content)
          ? raw.content
          : Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : [];

        if (list.length > 0) {
          for (const item of list) {
            const problem = mapProblemDto(item, { fallbackCompany: nameStr });
            if (!seenTitles.has(problem.title.toLowerCase().trim())) {
              seenTitles.add(problem.title.toLowerCase().trim());
              problemsList.push(problem);
            }
          }
        }
      } catch (err) {
        if (isRequestCanceled(err)) {
          throw err;
        }
        console.warn('Backend query by company ID failed:', err);
      }
    }

    // 2. Query real backend by searchText if no questions found yet
    if (problemsList.length === 0 && nameStr) {
      try {
        const payload = {
          level: null,
          companies: null,
          topic: null,
          searchText: nameStr,
          pageRequest: {
            pageNumber: 0,
            pageSize: 50,
            sortBy: 'id',
            sortDirection: 'ASC' as const,
          },
        };

        const res: any = await apiClient.post(API_ENDPOINTS.PROBLEMS.LIST, payload, { signal });
        const raw = res?.data || res;
        const list = Array.isArray(raw?.content)
          ? raw.content
          : Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : [];

        if (list.length > 0) {
          for (const item of list) {
            const problem = mapProblemDto(item, { fallbackCompany: nameStr });
            if (!seenTitles.has(problem.title.toLowerCase().trim())) {
              seenTitles.add(problem.title.toLowerCase().trim());
              problemsList.push(problem);
            }
          }
        }
      } catch (err) {
        if (isRequestCanceled(err)) {
          throw err;
        }
        console.warn('Backend query by company name failed:', err);
      }
    }

    if (problemsList.length === 0) {
      return {
        statusCode: 200,
        message: 'Company Problems Fetched Successfully',
        data: [],
        errors: null,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      statusCode: 200,
      message: 'Company Problems Fetched Successfully',
      data: problemsList,
      errors: null,
      timestamp: new Date().toISOString(),
    };
  },
};
