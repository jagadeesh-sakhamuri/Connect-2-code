import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { BackendApiResponse } from './authService';
import { fallbackProblemsData } from '../features/problems/data/problemsData';

const FALLBACK_COMPANIES = [
  {
    id: 1,
    name: 'TCS',
    slug: 'tcs',
    industry: 'Information Technology & Services',
    problemCount: 17,
    description: 'Tata Consultancy Services is a global leader in IT services, consulting & business solutions.',
    logo: 'https://logo.clearbit.com/tcs.com',
    headquarters: 'Mumbai, India',
    website: 'https://www.tcs.com',
  },
  {
    id: 2,
    name: 'Infosys',
    slug: 'infosys',
    industry: 'IT Services & Consulting',
    problemCount: 15,
    description: 'Infosys is a global leader in next-generation digital services and consulting.',
    logo: 'https://logo.clearbit.com/infosys.com',
    headquarters: 'Bengaluru, India',
    website: 'https://www.infosys.com',
  },
  {
    id: 3,
    name: 'Wipro',
    slug: 'wipro',
    industry: 'Information Technology',
    problemCount: 14,
    description: 'Wipro is a leading technology services and consulting company.',
    logo: 'https://logo.clearbit.com/wipro.com',
    headquarters: 'Bengaluru, India',
    website: 'https://www.wipro.com',
  },
  {
    id: 4,
    name: 'Accenture',
    slug: 'accenture',
    industry: 'Management & IT Consulting',
    problemCount: 16,
    description: 'Accenture is a leading global professional services company providing services in strategy and consulting.',
    logo: 'https://logo.clearbit.com/accenture.com',
    headquarters: 'Dublin, Ireland',
    website: 'https://www.accenture.com',
  },
  {
    id: 5,
    name: 'Cognizant',
    slug: 'cognizant',
    industry: 'IT Services & Consulting',
    problemCount: 15,
    description: 'Cognizant is an American multinational information technology services and consulting company.',
    logo: 'https://logo.clearbit.com/cognizant.com',
    headquarters: 'Teaneck, New Jersey',
    website: 'https://www.cognizant.com',
  },
  {
    id: 6,
    name: 'Capgemini',
    slug: 'capgemini',
    industry: 'IT Services & Consulting',
    problemCount: 12,
    description: 'Capgemini is a global leader in partnering with companies to transform and manage their business by harnessing technology.',
    logo: 'https://logo.clearbit.com/capgemini.com',
    headquarters: 'Paris, France',
    website: 'https://www.capgemini.com',
  },
  {
    id: 11,
    name: 'Amazon',
    slug: 'amazon',
    industry: 'Big Tech / Cloud / E-Commerce',
    problemCount: 22,
    description: 'Amazon focuses on e-commerce, cloud computing, digital streaming, and artificial intelligence.',
    logo: 'https://logo.clearbit.com/amazon.com',
    headquarters: 'Seattle, WA',
    website: 'https://www.amazon.com',
  },
  {
    id: 12,
    name: 'Google',
    slug: 'google',
    industry: 'Big Tech / Search / AI',
    problemCount: 25,
    description: 'Google specializes in internet-related services and products.',
    logo: 'https://logo.clearbit.com/google.com',
    headquarters: 'Mountain View, CA',
    website: 'https://www.google.com',
  },
  {
    id: 10,
    name: 'Microsoft',
    slug: 'microsoft',
    industry: 'Big Tech / Enterprise Software',
    problemCount: 20,
    description: 'Microsoft produces computer software, consumer electronics, personal computers, and related services.',
    logo: 'https://logo.clearbit.com/microsoft.com',
    headquarters: 'Redmond, WA',
    website: 'https://www.microsoft.com',
  },
];

const COMPANY_NAME_TO_ID: Record<string, number> = {
  tcs: 1,
  infosys: 2,
  wipro: 3,
  accenture: 4,
  cognizant: 5,
  capgemini: 6,
  'tech mahindra': 7,
  hcltech: 8,
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
  linkedin: 44,
  samsung: 45,
};

// Curated previous year interview questions tagged by company
const CURATED_COMPANY_QUESTIONS: Array<{
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  topic: string;
  companies: string[];
}> = [
  { id: 'sb-1', title: 'Reverse a Number', slug: 'reverse-integer', difficulty: 'Basic', topic: 'Number Theory', companies: ['TCS', 'Infosys'] },
  { id: 'sb-2', title: 'Check if a Number is Prime', slug: 'check-prime', difficulty: 'Basic', topic: 'Number Theory', companies: ['Wipro', 'Accenture'] },
  { id: 'sb-3', title: 'Greatest Common Divisor (GCD/HCF)', slug: 'find-gcd', difficulty: 'Basic', topic: 'Number Theory', companies: ['Cognizant', 'TCS'] },
  { id: 'sb-4', title: 'Fibonacci Number Series', slug: 'fibonacci-number', difficulty: 'Easy', topic: 'Number Theory', companies: ['Infosys', 'Capgemini'] },
  { id: 'sb-5', title: 'Armstrong Number Check', slug: 'armstrong-number', difficulty: 'Basic', topic: 'Number Theory', companies: ['Accenture', 'Wipro'] },
  { id: 'sb-6', title: 'Find Second Largest Element in an Array', slug: 'second-largest', difficulty: 'Easy', topic: 'Arrays', companies: ['TCS', 'Accenture'] },
  { id: 'sb-7', title: 'Check if Array is Sorted', slug: 'check-if-array-is-sorted', difficulty: 'Basic', topic: 'Arrays', companies: ['Infosys', 'Wipro'] },
  { id: 'sb-8', title: 'Remove Duplicates from Sorted Array', slug: 'remove-duplicates-from-sorted-array', difficulty: 'Easy', topic: 'Arrays', companies: ['TCS', 'Cognizant'] },
  { id: 'sb-9', title: 'Left Rotate Array by One Position', slug: 'rotate-array-by-one', difficulty: 'Basic', topic: 'Arrays', companies: ['Capgemini', 'Accenture'] },
  { id: 'sb-10', title: 'Move Zeroes to End of Array', slug: 'move-zeroes', difficulty: 'Easy', topic: 'Arrays', companies: ['Infosys', 'TCS'] },
  { id: 'sb-11', title: 'Check Palindrome String', slug: 'valid-palindrome', difficulty: 'Basic', topic: 'Strings', companies: ['TCS', 'Wipro'] },
  { id: 'sb-12', title: 'Reverse a String', slug: 'reverse-string', difficulty: 'Basic', topic: 'Strings', companies: ['Infosys', 'Accenture'] },
  { id: 'sb-13', title: 'Valid Anagram Check', slug: 'valid-anagram', difficulty: 'Easy', topic: 'Strings', companies: ['Cognizant', 'TCS'] },
  { id: 'sb-14', title: 'Count Vowels and Consonants', slug: 'count-vowels-consonants', difficulty: 'Basic', topic: 'Strings', companies: ['Capgemini', 'Wipro'] },
  { id: 'sb-15', title: 'Longest Common Prefix', slug: 'longest-common-prefix', difficulty: 'Easy', topic: 'Strings', companies: ['Accenture', 'Infosys'] },
  { id: 'sb-16', title: 'Binary Search Implementation', slug: 'binary-search', difficulty: 'Easy', topic: 'Searching', companies: ['TCS', 'Infosys'] },
  { id: 'sb-17', title: 'Bubble Sort & Selection Sort', slug: 'bubble-selection-sort', difficulty: 'Basic', topic: 'Sorting', companies: ['Wipro', 'Capgemini'] },
  { id: 'sb-18', title: 'Insertion Sort', slug: 'insertion-sort', difficulty: 'Easy', topic: 'Sorting', companies: ['Accenture', 'TCS'] },
  { id: 'sb-19', title: 'Find First and Last Position in Sorted Array', slug: 'find-first-and-last-position', difficulty: 'Medium', topic: 'Searching', companies: ['Cognizant', 'Infosys'] },
  { id: 'sb-20', title: 'Two Sum - Pair with Target Sum', slug: 'two-sum', difficulty: 'Easy', topic: 'Hashing', companies: ['TCS', 'Accenture', 'Infosys'] },
  { id: 'sb-21', title: 'Find Missing Number in Array', slug: 'missing-number', difficulty: 'Easy', topic: 'Hashing', companies: ['Wipro', 'Cognizant'] },
  { id: 'sb-22', title: 'Single Number in Array', slug: 'single-number', difficulty: 'Easy', topic: 'Hashing', companies: ['Infosys', 'Capgemini'] },
  { id: 'sb-23', title: 'Intersection of Two Arrays', slug: 'intersection-of-two-arrays', difficulty: 'Easy', topic: 'Arrays', companies: ['TCS', 'Accenture'] },
  { id: 'sb-24', title: 'Reverse a Linked List', slug: 'reverse-linked-list', difficulty: 'Easy', topic: 'Linked List', companies: ['TCS', 'Infosys'] },
  { id: 'sb-25', title: 'Middle of the Linked List', slug: 'middle-of-the-linked-list', difficulty: 'Easy', topic: 'Linked List', companies: ['Accenture', 'Cognizant'] },
  { id: 'sb-26', title: 'Detect Loop / Cycle in Linked List', slug: 'linked-list-cycle', difficulty: 'Easy', topic: 'Linked List', companies: ['Wipro', 'TCS'] },
  { id: 'sb-27', title: 'Merge Two Sorted Linked Lists', slug: 'merge-two-sorted-lists', difficulty: 'Easy', topic: 'Linked List', companies: ['Infosys', 'Capgemini'] },
  { id: 'sb-28', title: 'Valid Parentheses String', slug: 'valid-parentheses', difficulty: 'Easy', topic: 'Stack', companies: ['TCS', 'Infosys', 'Accenture'] },
  { id: 'sb-29', title: 'Implement Queue using Stacks', slug: 'implement-queue-using-stacks', difficulty: 'Easy', topic: 'Stack', companies: ['Cognizant', 'Wipro'] },
  { id: 'sb-30', title: 'Next Greater Element I', slug: 'next-greater-element-i', difficulty: 'Medium', topic: 'Stack', companies: ['Accenture', 'Infosys'] },
  { id: 'sb-31', title: 'Binary Tree Inorder, Preorder, Postorder Traversals', slug: 'binary-tree-traversals', difficulty: 'Easy', topic: 'Trees', companies: ['TCS', 'Infosys'] },
  { id: 'sb-32', title: 'Maximum Depth of Binary Tree', slug: 'maximum-depth-of-binary-tree', difficulty: 'Easy', topic: 'Trees', companies: ['Accenture', 'Capgemini'] },
  { id: 'sb-33', title: 'Check if Two Binary Trees are Identical', slug: 'same-tree', difficulty: 'Easy', topic: 'Trees', companies: ['Wipro', 'Cognizant'] },
];

export const companyService = {
  async getCompanies(search?: string): Promise<BackendApiResponse<any[]>> {
    try {
      const res: any = await apiClient.get(API_ENDPOINTS.COMPANY.BASE, { params: { search } });
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

  async getCompanyBySlug(slug: string): Promise<BackendApiResponse<any>> {
    try {
      const res: any = await apiClient.get(API_ENDPOINTS.COMPANY.DETAILS(slug));
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
      console.warn('Backend getCompanyBySlug direct call failed:', err);
    }

    try {
      const allCompRes = await this.getCompanies();
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
      console.warn('Company fallback matching failed:', err);
    }

    // Default to TCS if slug is 1 or tcs
    if (String(slug) === '1' || slug.toLowerCase() === 'tcs') {
      return {
        statusCode: 200,
        message: 'Company Fetched Successfully',
        data: FALLBACK_COMPANIES[0],
        errors: null,
        timestamp: new Date().toISOString(),
      };
    }

    throw new Error(`Company not found for slug: ${slug}`);
  },

  async getCompanyProblems(
    companyIdOrName?: string | number,
    companyName?: string
  ): Promise<BackendApiResponse<any[]>> {
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

        const res: any = await apiClient.post(API_ENDPOINTS.PROBLEMS.LIST, payload);
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
            const title = item.title || item.name || '';
            const normTitle = title.toLowerCase().trim();
            if (!seenTitles.has(normTitle)) {
              seenTitles.add(normTitle);
              problemsList.push({
                id: String(item.id || item._id),
                title,
                slug: item.slug || String(item.id),
                difficulty:
                  item.difficultyName || item.difficultyRefName || item.difficulty || item.level || 'Easy',
                topic: item.topicName || item.topicRefName || item.category || item.topic || nameStr || 'General',
                category: item.topicName || item.topicRefName || item.category || nameStr || 'DSA',
                companies: Array.isArray(item.companies)
                  ? item.companies.map((c: any) => (typeof c === 'object' ? c.name || c.companyName || '' : String(c)))
                  : nameStr
                  ? [nameStr]
                  : [],
                isSolved: !!item.isSolved,
                isBookmarked: !!item.isBookmarked,
              });
            }
          }
        }
      } catch (err) {
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

        const res: any = await apiClient.post(API_ENDPOINTS.PROBLEMS.LIST, payload);
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
            const title = item.title || item.name || '';
            const normTitle = title.toLowerCase().trim();
            if (!seenTitles.has(normTitle)) {
              seenTitles.add(normTitle);
              problemsList.push({
                id: String(item.id || item._id),
                title,
                slug: item.slug || String(item.id),
                difficulty:
                  item.difficultyName || item.difficultyRefName || item.difficulty || item.level || 'Easy',
                topic: item.topicName || item.topicRefName || item.category || item.topic || nameStr || 'General',
                category: item.topicName || item.topicRefName || item.category || nameStr || 'DSA',
                companies: Array.isArray(item.companies)
                  ? item.companies.map((c: any) => (typeof c === 'object' ? c.name || c.companyName || '' : String(c)))
                  : [nameStr],
                isSolved: !!item.isSolved,
                isBookmarked: !!item.isBookmarked,
              });
            }
          }
        }
      } catch (err) {
        console.warn('Backend query by company name failed:', err);
      }
    }

    // 3. Augment with curated previous-year interview questions tagged with this company
    const targetName = nameStr || (compIdNum === 1 ? 'TCS' : '');
    if (targetName) {
      const normTarget = targetName.toLowerCase();
      const matchedCurated = CURATED_COMPANY_QUESTIONS.filter((q) =>
        q.companies.some((c) => c.toLowerCase().includes(normTarget) || normTarget.includes(c.toLowerCase()))
      );

      for (const q of matchedCurated) {
        const normTitle = q.title.toLowerCase().trim();
        if (!seenTitles.has(normTitle)) {
          seenTitles.add(normTitle);
          problemsList.push({
            id: q.id,
            title: q.title,
            slug: q.slug || q.id,
            difficulty: q.difficulty || 'Easy',
            topic: q.topic || targetName,
            category: q.topic || 'DSA',
            companies: q.companies,
            isSolved: false,
            isBookmarked: false,
          });
        }
      }
    }

    // 4. Fallback to general problems if list is still empty
    if (problemsList.length === 0) {
      const fallbackSubset = fallbackProblemsData.slice(0, 10);
      for (const p of fallbackSubset) {
        const normTitle = p.title.toLowerCase().trim();
        if (!seenTitles.has(normTitle)) {
          seenTitles.add(normTitle);
          problemsList.push({
            id: p.id,
            title: p.title,
            slug: p.slug || p.id,
            difficulty: p.difficulty || 'Medium',
            topic: p.topic || p.category || targetName || 'General',
            category: p.category || targetName || 'DSA',
            companies: p.companies || [targetName || 'TCS'],
            isSolved: !!p.isSolved,
            isBookmarked: !!p.isBookmarked,
          });
        }
      }
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
