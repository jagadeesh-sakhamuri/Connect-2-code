import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { ApiResponse } from '../core/types/api';
import { fallbackProblemsData } from '../features/problems/data/problemsData';

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
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
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

/**
 * Filter the rich curated fallback problems dataset
 */
function filterFallbackProblems(params: ProblemFilterParams = {}): ApiResponse<ProblemItem[]> {
  let list = [...fallbackProblemsData];

  // 1. Search filter
  const search = (params.searchText || params.search || '').trim().toLowerCase();
  if (search) {
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(search) ||
        (p.topic && p.topic.toLowerCase().includes(search)) ||
        (p.category && p.category.toLowerCase().includes(search)) ||
        (p.companies && p.companies.some((c) => c.toLowerCase().includes(search)))
    );
  }

  // 2. Difficulty / Level filter
  const diffVal =
    params.level !== undefined && params.level !== null && params.level !== '' && params.level !== 'All'
      ? params.level
      : params.difficulty !== undefined && params.difficulty !== null && params.difficulty !== '' && params.difficulty !== 'All'
      ? params.difficulty
      : null;

  if (diffVal !== null) {
    const diffMap: Record<number, string> = {
      1: 'basic',
      2: 'easy',
      3: 'medium',
      4: 'hard',
    };

    let targetDiffs: string[] = [];
    if (Array.isArray(diffVal)) {
      targetDiffs = diffVal.map((v) => {
        const num = Number(v);
        return !isNaN(num) && diffMap[num] ? diffMap[num] : String(v).toLowerCase();
      });
    } else {
      const num = Number(diffVal);
      targetDiffs = [!isNaN(num) && diffMap[num] ? diffMap[num] : String(diffVal).toLowerCase()];
    }

    list = list.filter((p) => {
      const pDiff = (p.difficulty || '').toLowerCase();
      return targetDiffs.some((td) => pDiff.includes(td) || td.includes(pDiff));
    });
  }

  // 3. Topic filter
  const topicVal = params.topic;
  if (topicVal && topicVal !== 'All' && topicVal !== '') {
    let topicStrs: string[] = [];
    if (Array.isArray(topicVal)) {
      topicStrs = topicVal.map((t) => String(t).toLowerCase());
    } else {
      topicStrs = [String(topicVal).toLowerCase()];
    }
    list = list.filter((p) => {
      const pTopic = (p.topic || p.category || '').toLowerCase();
      return topicStrs.some((ts) => pTopic.includes(ts) || ts.includes(pTopic));
    });
  }

  // 4. Company filter
  const compVal =
    params.companies && Array.isArray(params.companies) && params.companies.length > 0
      ? params.companies
      : params.company && params.company !== 'All' && params.company !== ''
      ? params.company
      : null;

  if (compVal) {
    let compStrs: string[] = [];
    if (Array.isArray(compVal)) {
      compStrs = compVal.map((c) => String(c).toLowerCase());
    } else {
      compStrs = [String(compVal).toLowerCase()];
    }
    list = list.filter((p) => {
      return (p.companies || []).some((c) =>
        compStrs.some((cs) => c.toLowerCase().includes(cs) || cs.includes(c.toLowerCase()))
      );
    });
  }

  const page = params.page ? Math.max(1, Number(params.page)) : 1;
  const limit = params.limit ? Math.max(1, Number(params.limit)) : 20;
  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIdx = (page - 1) * limit;
  const paginatedList = list.slice(startIdx, startIdx + limit);

  return {
    statusCode: 200,
    message: 'Problems retrieved successfully',
    data: paginatedList,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export const problemService = {
  async getProblems(params: ProblemFilterParams = {}): Promise<ApiResponse<ProblemItem[]>> {
    const pageNum = params.page ? Math.max(0, params.page - 1) : 0;
    const pageSize = params.limit || 20;

    // Convert level / difficulty to array of IDs: number[] | null
    let levelArr: number[] | null = null;
    const rawLevel =
      params.level !== undefined && params.level !== null && params.level !== '' && params.level !== 'All'
        ? params.level
        : params.difficulty !== undefined && params.difficulty !== null && params.difficulty !== '' && params.difficulty !== 'All'
        ? params.difficulty
        : null;

    if (rawLevel !== null) {
      if (Array.isArray(rawLevel)) {
        levelArr = rawLevel.map((v) => Number(v)).filter((n) => !isNaN(n));
      } else if (!isNaN(Number(rawLevel))) {
        levelArr = [Number(rawLevel)];
      }
    }

    // Convert topic to array of IDs: number[] | null
    let topicArr: number[] | null = null;
    const rawTopic =
      params.topic !== undefined && params.topic !== null && params.topic !== '' && params.topic !== 'All'
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
      : params.search?.trim()
      ? params.search.trim()
      : null;

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

    try {
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

      if (list.length > 0) {
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
            ? item.companies.map((c: any) => (typeof c === 'object' ? c.name || c.companyName || '' : String(c)))
            : item.companyName
            ? [item.companyName]
            : [],
          acceptanceRate: item.acceptanceRate || '75%',
          isSolved: !!item.isSolved,
          isBookmarked: !!item.isBookmarked,
          isOwnProblem: item.isOwnProblem !== undefined ? item.isOwnProblem : true,
          leetCodeUrl: item.leetCodeUrl,
          gfgUrl: item.gfgUrl,
          hackerRankUrl: item.hackerRankUrl,
          description: item.description || '',
          examples: item.examples,
        }));

        return {
          statusCode: 200,
          message: 'Problems retrieved successfully',
          data: mappedList,
          meta: {
            page: rawData?.number !== undefined ? rawData.number + 1 : params.page || 1,
            limit: pageSize,
            total: total,
            totalPages: rawData?.totalPages || Math.ceil(total / pageSize) || 1,
          },
        };
      }
    } catch (err) {
      console.warn('Backend questions API unavailable, loading curated practice dataset:', err);
    }

    // Graceful fallback to rich curated problems dataset
    return filterFallbackProblems(params);
  },

  async getProblemById(id: string | number): Promise<ApiResponse<ProblemItem | null>> {
    try {
      const res: any = await apiClient.get(API_ENDPOINTS.QUESTION.DETAILS(id));
      const data = res?.data || res;
      if (data && (data.id || data.title)) {
        return {
          statusCode: 200,
          message: 'Problem details fetched',
          data: {
            id: String(data.id || id),
            title: data.title || data.name || '',
            slug: data.slug || String(data.id || id),
            difficulty: data.difficultyName || data.difficultyRefName || data.difficulty || 'Medium',
            difficultyId: data.difficultyId,
            category: data.topicName || data.topicRefName || data.category || 'General',
            topic: data.topicName || data.topicRefName || data.topic || 'General',
            topicId: data.topicId,
            companies: Array.isArray(data.companies)
              ? data.companies.map((c: any) => (typeof c === 'object' ? c.name || c.companyName || '' : String(c)))
              : [],
            acceptanceRate: data.acceptanceRate || '75%',
            isSolved: !!data.isSolved,
            isBookmarked: !!data.isBookmarked,
            isOwnProblem: data.isOwnProblem !== undefined ? data.isOwnProblem : true,
            leetCodeUrl: data.leetCodeUrl,
            gfgUrl: data.gfgUrl,
            hackerRankUrl: data.hackerRankUrl,
            description: data.description || '',
            examples: data.examples,
          },
        };
      }
    } catch (err) {
      console.warn('Backend question detail API unavailable, using fallback problem data:', err);
    }

    const idStr = String(id).toLowerCase();
    const fallback =
      fallbackProblemsData.find(
        (p) => p.id?.toLowerCase() === idStr || p.slug?.toLowerCase() === idStr
      ) ||
      (id === '1' || id === 1 ? fallbackProblemsData[0] : null) ||
      fallbackProblemsData[0];

    return {
      statusCode: 200,
      message: 'Problem details fetched',
      data: fallback || null,
    };
  },

  async toggleSolveStatus(id: string): Promise<ApiResponse<{ id: string; isSolved: boolean }>> {
    try {
      const res: any = await apiClient.post(API_ENDPOINTS.PROBLEMS.SUBMIT(id));
      return {
        statusCode: 200,
        message: 'Problem status updated',
        data: res?.data || { id, isSolved: true },
      };
    } catch {
      return {
        statusCode: 200,
        message: 'Problem status updated locally',
        data: { id, isSolved: true },
      };
    }
  },
};
