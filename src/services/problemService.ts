import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { ApiResponse } from '../core/types/api';

export interface ProblemItem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  difficultyId?: number;
  category: string;
  topic: string;
  topicId?: number;
  companies: string[];
  acceptanceRate: string;
  isSolved: boolean;
  isBookmarked: boolean;
  isOwnProblem?: boolean;
  leetCodeUrl?: string;
  gfgUrl?: string;
  hackerRankUrl?: string;
  description?: string;
}

export interface ProblemFilterParams {
  category?: string;
  topic?: number[] | string | number | null;
  difficulty?: number[] | string | number | null;
  level?: number[] | string | number | null;
  search?: string | null;
  searchText?: string | null;
  company?: number[] | string | number | null;
  companies?: number[] | string[] | null;
  page?: number;
  limit?: number;
}

export const problemService = {
  async getProblems(params: ProblemFilterParams = {}): Promise<ApiResponse<ProblemItem[]>> {
    const pageNum = params.page ? Math.max(0, params.page - 1) : 0;
    const pageSize = params.limit || 20;

    // Convert level / difficulty to array of IDs: number[] | null
    let levelArr: number[] | null = null;
    const rawLevel = params.level !== undefined && params.level !== null && params.level !== '' && params.level !== 'All'
      ? params.level
      : (params.difficulty !== undefined && params.difficulty !== null && params.difficulty !== '' && params.difficulty !== 'All' ? params.difficulty : null);

    if (rawLevel !== null) {
      if (Array.isArray(rawLevel)) {
        levelArr = rawLevel.map((v) => Number(v)).filter((n) => !isNaN(n));
      } else if (!isNaN(Number(rawLevel))) {
        levelArr = [Number(rawLevel)];
      }
    }

    // Convert topic to array of IDs: number[] | null
    let topicArr: number[] | null = null;
    const rawTopic = params.topic !== undefined && params.topic !== null && params.topic !== '' && params.topic !== 'All'
      ? params.topic
      : null;

    if (rawTopic !== null) {
      if (Array.isArray(rawTopic)) {
        topicArr = rawTopic.map((v) => Number(v)).filter((n) => !isNaN(n));
      } else if (!isNaN(Number(rawTopic))) {
        topicArr = [Number(rawTopic)];
      }
    }

    // Convert companies to array of IDs: number[] | null
    let companiesArr: number[] | null = null;
    if (params.companies && Array.isArray(params.companies) && params.companies.length > 0) {
      companiesArr = params.companies.map((v) => Number(v)).filter((n) => !isNaN(n));
    } else if (params.company && params.company !== 'All') {
      if (Array.isArray(params.company)) {
        companiesArr = params.company.map((v) => Number(v)).filter((n) => !isNaN(n));
      } else if (!isNaN(Number(params.company))) {
        companiesArr = [Number(params.company)];
      }
    }

    const rawSearch = params.searchText?.trim()
      ? params.searchText.trim()
      : (params.search?.trim() ? params.search.trim() : null);

    const payload = {
      level: levelArr && levelArr.length > 0 ? levelArr : null,
      companies: companiesArr && companiesArr.length > 0 ? companiesArr : null,
      topic: topicArr && topicArr.length > 0 ? topicArr : null,
      searchText: rawSearch,
      pageRequest: {
        pageNumber: pageNum,
        pageSize: pageSize,
        sortBy: 'id',
        sortDirection: 'ASC' as const,
      },
    };

    const res: any = await apiClient.post(API_ENDPOINTS.PROBLEMS.LIST, payload);
    const rawData = res?.data || res;
    let list: any[] = [];
    let total = 0;

    if (rawData && Array.isArray(rawData.content)) {
      list = rawData.content;
      total = rawData.totalElements || list.length;
    } else if (Array.isArray(rawData)) {
      list = rawData;
      total = rawData.length;
    } else if (rawData && typeof rawData === 'object' && Array.isArray(rawData.data)) {
      list = rawData.data;
      total = rawData.total || list.length;
    }

    const mappedList: ProblemItem[] = list.map((item: any) => ({
      id: String(item.id || item._id),
      title: item.title || item.name || '',
      slug: item.slug || String(item.id),
      difficulty: item.difficultyName || item.difficultyRefName || item.difficulty || item.level || 'Medium',
      difficultyId: item.difficultyId || item.levelId,
      category: item.topicName || item.topicRefName || item.category || item.topic || 'General',
      topic: item.topicName || item.topicRefName || item.topic || 'General',
      topicId: item.topicId,
      companies: Array.isArray(item.companies)
        ? item.companies.map((c: any) => (typeof c === 'object' ? (c.name || c.companyName || '') : String(c)))
        : (item.companyName ? [item.companyName] : []),
      acceptanceRate: item.acceptanceRate || '75%',
      isSolved: !!item.isSolved,
      isBookmarked: !!item.isBookmarked,
      isOwnProblem: item.isOwnProblem !== undefined ? item.isOwnProblem : true,
      leetCodeUrl: item.leetCodeUrl,
      gfgUrl: item.gfgUrl,
      hackerRankUrl: item.hackerRankUrl,
      description: item.description || '',
    }));

    return {
      statusCode: 200,
      message: 'Problems retrieved successfully',
      data: mappedList,
      meta: {
        page: rawData?.number !== undefined ? rawData.number + 1 : (params.page || 1),
        limit: pageSize,
        total: total,
        totalPages: rawData?.totalPages || Math.ceil(total / pageSize) || 1,
      },
    };
  },

  async getProblemById(id: string | number): Promise<ApiResponse<ProblemItem | null>> {
    const res: any = await apiClient.get(API_ENDPOINTS.QUESTION.DETAILS(id));
    const data = res?.data || res;
    return {
      statusCode: 200,
      message: 'Problem details fetched',
      data: data ? {
        id: String(data.id || id),
        title: data.title || data.name || '',
        slug: data.slug || String(data.id || id),
        difficulty: data.difficultyName || data.difficultyRefName || data.difficulty || 'Medium',
        difficultyId: data.difficultyId,
        category: data.topicName || data.topicRefName || data.category || 'General',
        topic: data.topicName || data.topicRefName || data.topic || 'General',
        topicId: data.topicId,
        companies: Array.isArray(data.companies)
          ? data.companies.map((c: any) => (typeof c === 'object' ? (c.name || c.companyName || '') : String(c)))
          : [],
        acceptanceRate: data.acceptanceRate || '75%',
        isSolved: !!data.isSolved,
        isBookmarked: !!data.isBookmarked,
        isOwnProblem: data.isOwnProblem !== undefined ? data.isOwnProblem : true,
        leetCodeUrl: data.leetCodeUrl,
        gfgUrl: data.gfgUrl,
        hackerRankUrl: data.hackerRankUrl,
        description: data.description || '',
      } : null,
    };
  },

  async toggleSolveStatus(id: string): Promise<ApiResponse<{ id: string; isSolved: boolean }>> {
    const res: any = await apiClient.post(API_ENDPOINTS.PROBLEMS.SUBMIT(id));
    return {
      statusCode: 200,
      message: 'Problem status updated',
      data: res?.data || { id, isSolved: true },
    };
  },
};
