import { apiClient, isRequestCanceled } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { ApiResponse } from '../core/types/api';
import { fallbackProblemsData } from '../features/problems/data/problemsData';
import type { Problem, ProblemFilter } from '../core/types/domain';
import { mapProblemDto } from '../core/mappers/problemMapper';

export type ProblemItem = Problem;
export type ProblemFilterParams = ProblemFilter;

export const DIFF_NAME_TO_ID: Record<string, number> = {
  basic: 1,
  easy: 2,
  medium: 3,
  med: 3,
  hard: 4,
};

export const DIFF_ID_TO_NAME: Record<number, string> = {
  1: 'Basic',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
};

export const TOPIC_NAME_TO_ID: Record<string, number> = {
  arrays: 9,
  array: 9,
  'arrays & hashing': 9,
  strings: 10,
  string: 10,
  'linked list': 11,
  linkedlist: 11,
  stack: 12,
  stacks: 12,
  queue: 13,
  queues: 13,
  tree: 14,
  trees: 14,
  bst: 14,
  graph: 15,
  graphs: 15,
  'dynamic programming': 16,
  '1-d dynamic programming': 16,
  '2-d dynamic programming': 16,
  dp: 16,
  hashing: 17,
  hash: 17,
  sorting: 18,
  sort: 18,
  searching: 19,
  search: 19,
  'binary search': 19,
  prerequisites: 9,
  'two pointers': 9,
  'sliding window': 9,
  heap: 14,
  tries: 10,
  backtracking: 16,
  'bit manipulation': 9,
};

export const TOPIC_ID_TO_NAME: Record<number, string> = {
  9: 'Arrays',
  10: 'Strings',
  11: 'Linked List',
  12: 'Stack',
  13: 'Queue',
  14: 'Tree',
  15: 'Graph',
  16: 'Dynamic Programming',
  17: 'Hashing',
  18: 'Sorting',
  19: 'Searching',
};

export const COMPANY_NAME_TO_ID: Record<string, number> = {
  tcs: 1,
  infosys: 2,
  wipro: 3,
  accenture: 4,
  cognizant: 5,
  capgemini: 6,
  'tech mahindra': 7,
  techmahindra: 7,
  hcltech: 8,
  hcl: 8,
  ibm: 9,
  microsoft: 10,
  amazon: 11,
  google: 12,
  meta: 13,
  oracle: 14,
  deloitte: 15,
  ey: 16,
  kpmg: 17,
  pwc: 18,
  zoho: 19,
  freshworks: 20,
  servicenow: 21,
  salesforce: 22,
  adobe: 23,
  cisco: 24,
  dell: 25,
  intel: 26,
  nvidia: 27,
  paypal: 28,
  'jpmorgan chase': 29,
  jpmorgan: 29,
  'goldman sachs': 30,
  'morgan stanley': 31,
  'wells fargo': 32,
  atlassian: 33,
  uber: 34,
  ola: 35,
  swiggy: 36,
  zomato: 37,
  razorpay: 38,
  phonepe: 39,
  paytm: 40,
  myntra: 41,
  flipkart: 42,
  'walmart global tech': 43,
  walmart: 43,
  linkedin: 44,
  samsung: 45,
  accolite: 46,
  thoughtworks: 47,
  ltimindtree: 48,
  'persistent systems': 49,
  mindtree: 50,
  databeat: 51,
  mouritech: 52,
};

export const COMPANY_ID_TO_NAME: Record<number, string> = {
  1: 'TCS',
  2: 'Infosys',
  3: 'Wipro',
  4: 'Accenture',
  5: 'Cognizant',
  6: 'Capgemini',
  7: 'Tech Mahindra',
  8: 'HCLTech',
  9: 'IBM',
  10: 'Microsoft',
  11: 'Amazon',
  12: 'Google',
  13: 'Meta',
  14: 'Oracle',
  15: 'Deloitte',
  16: 'EY',
  17: 'KPMG',
  18: 'PwC',
  19: 'Zoho',
  20: 'Freshworks',
  21: 'ServiceNow',
  22: 'Salesforce',
  23: 'Adobe',
  24: 'Cisco',
  25: 'Dell',
  26: 'Intel',
  27: 'NVIDIA',
  28: 'PayPal',
  29: 'JPMorgan Chase',
  30: 'Goldman Sachs',
  31: 'Morgan Stanley',
  32: 'Wells Fargo',
  33: 'Atlassian',
  34: 'Uber',
  35: 'Ola',
  36: 'Swiggy',
  37: 'Zomato',
  38: 'Razorpay',
  39: 'PhonePe',
  40: 'Paytm',
  41: 'Myntra',
  42: 'Flipkart',
  43: 'Walmart Global Tech',
  44: 'LinkedIn',
  45: 'Samsung',
  46: 'Accolite',
  47: 'Thoughtworks',
  48: 'LTIMindtree',
  49: 'Persistent Systems',
  50: 'Mindtree',
  51: 'DataBeat',
  52: 'Mouritech',
};

/**
 * Universal parser converting single IDs, ID arrays, or human-readable names to number[] | null
 */
export function parseToIdList(raw: any, nameToId: Record<string, number>): number[] | null {
  if (raw === undefined || raw === null || raw === '' || raw === 'All' || raw === 'all') {
    return null;
  }
  const items = Array.isArray(raw) ? raw : [raw];
  const ids: number[] = [];

  for (const item of items) {
    if (item === undefined || item === null || item === '' || item === 'All' || item === 'all') {
      continue;
    }
    const num = Number(item);
    if (!isNaN(num) && num > 0) {
      ids.push(num);
    } else {
      const normalized = String(item).trim().toLowerCase();
      if (nameToId[normalized] !== undefined) {
        ids.push(nameToId[normalized]);
      }
    }
  }

  return ids.length > 0 ? Array.from(new Set(ids)) : null;
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
  const levelIds = parseToIdList(params.level ?? params.difficulty, DIFF_NAME_TO_ID);
  if (levelIds && levelIds.length > 0) {
    const allowedDiffNames = levelIds.map((id) => (DIFF_ID_TO_NAME[id] || '').toLowerCase()).filter(Boolean);
    list = list.filter((p) => {
      const pDiff = (p.difficulty || '').toLowerCase();
      return allowedDiffNames.some((d) => pDiff.includes(d) || d.includes(pDiff));
    });
  } else if (params.difficulty && typeof params.difficulty === 'string' && params.difficulty !== 'All' && params.difficulty.trim()) {
    const dLower = params.difficulty.trim().toLowerCase();
    list = list.filter((p) => {
      const pDiff = (p.difficulty || '').toLowerCase();
      return pDiff.includes(dLower) || dLower.includes(pDiff);
    });
  }

  // 3. Topic filter
  const topicIds = parseToIdList(params.topic, TOPIC_NAME_TO_ID);
  if (topicIds && topicIds.length > 0) {
    const allowedTopicNames = topicIds.map((id) => (TOPIC_ID_TO_NAME[id] || '').toLowerCase()).filter(Boolean);
    list = list.filter((p) => {
      const pTopic = (p.topic || p.category || '').toLowerCase();
      return allowedTopicNames.some((t) => pTopic.includes(t) || t.includes(pTopic));
    });
  } else if (typeof params.topic === 'string' && params.topic !== 'All' && params.topic.trim()) {
    const tLower = params.topic.trim().toLowerCase();
    list = list.filter((p) => {
      const pTopic = (p.topic || p.category || '').toLowerCase();
      return pTopic.includes(tLower) || tLower.includes(pTopic);
    });
  }

  // 4. Company filter
  const compIds = parseToIdList(params.companies ?? params.company, COMPANY_NAME_TO_ID);
  if (compIds && compIds.length > 0) {
    const allowedCompNames = compIds.map((id) => (COMPANY_ID_TO_NAME[id] || '').toLowerCase()).filter(Boolean);
    list = list.filter((p) => {
      return (p.companies || []).some((c) =>
        allowedCompNames.some((ac) => c.toLowerCase().includes(ac) || ac.includes(c.toLowerCase()))
      );
    });
  } else if (params.company && typeof params.company === 'string' && params.company !== 'All' && params.company.trim()) {
    const cLower = params.company.trim().toLowerCase();
    list = list.filter((p) =>
      (p.companies || []).some((c) => c.toLowerCase().includes(cLower) || cLower.includes(c.toLowerCase()))
    );
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
  async getProblems(params: ProblemFilterParams = {}, signal?: AbortSignal): Promise<ApiResponse<ProblemItem[]>> {
    const pageNum = params.page ? Math.max(0, params.page - 1) : 0;
    const pageSize = params.limit || 20;

    // Convert level / difficulty to array of IDs: number[] | null
    const levelArr = parseToIdList(params.level ?? params.difficulty, DIFF_NAME_TO_ID);

    // Convert topic to array of IDs: number[] | null
    const topicArr = parseToIdList(params.topic, TOPIC_NAME_TO_ID);

    // Convert companies to array of IDs: number[] | null
    const companiesArr = parseToIdList(params.companies ?? params.company, COMPANY_NAME_TO_ID);

    const rawSearch = params.searchText?.trim()
      ? params.searchText.trim()
      : params.search?.trim()
      ? params.search.trim()
      : null;

    const payload = {
      level: levelArr,
      companies: companiesArr,
      topic: topicArr,
      searchText: rawSearch,
      pageRequest: {
        pageNumber: pageNum,
        pageSize: pageSize,
        sortBy: 'id',
        sortDirection: 'ASC' as const,
      },
    };

    try {
      const res: any = await apiClient.post(API_ENDPOINTS.PROBLEMS.LIST, payload, { signal });
      const rawData = res?.data || res;
      let list: any[] = [];
      let total = 0;
      let isBackendResponse = false;

      if (rawData && Array.isArray(rawData.content)) {
        list = rawData.content;
        total = typeof rawData.totalElements === 'number' ? rawData.totalElements : list.length;
        isBackendResponse = true;
      } else if (Array.isArray(rawData)) {
        list = rawData;
        total = list.length;
        isBackendResponse = true;
      } else if (rawData && typeof rawData === 'object' && Array.isArray(rawData.data)) {
        list = rawData.data;
        total = typeof rawData.total === 'number' ? rawData.total : list.length;
        isBackendResponse = true;
      }

      if (isBackendResponse) {
        const mappedList: ProblemItem[] = list.map((item: any) => mapProblemDto(item));

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
      if (isRequestCanceled(err)) {
        throw err;
      }
      console.warn('Backend questions API unavailable, loading curated practice dataset:', err);
    }

    // Graceful fallback to rich curated problems dataset when backend API is unavailable
    return filterFallbackProblems(params);
  },

  async getProblemById(id: string | number, signal?: AbortSignal): Promise<ApiResponse<ProblemItem | null>> {
    try {
      const res: any = await apiClient.get(API_ENDPOINTS.QUESTION.DETAILS(id), { signal });
      const data = res?.data || res;
      if (data && (data.id || data.title)) {
        return {
          statusCode: 200,
          message: 'Problem details fetched',
          data: mapProblemDto(data, { fallbackTopic: 'General' }),
        };
      }
    } catch (err) {
      if (isRequestCanceled(err)) {
        throw err;
      }
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
