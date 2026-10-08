import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { problemService } from '../../../services/problemService';
import { isRequestCanceled } from '../../../core/api/apiClient';
import type { Problem, ProblemFilter } from '../../../core/types/domain';
import { fallbackProblemsData } from '../data/problemsData';
import { userScopedStorage } from '../../../core/storage/userScopedStorage';

const PROBLEM_LIST_CACHE_TTL_MS = 60_000;
const PROBLEM_DETAIL_CACHE_TTL_MS = 5 * 60_000;
const MAX_LIST_CACHE_ENTRIES = 30;
const MAX_DETAIL_CACHE_ENTRIES = 40;

export interface ProblemPagination {
  page: number;
  total: number;
  limit: number;
  totalPages: number;
}

interface ProblemListCacheEntry {
  problems: Problem[];
  pagination: ProblemPagination;
  fetchedAt: number;
}

interface ProblemDetailCacheEntry {
  problem: Problem | null;
  fetchedAt: number;
}

export interface ProblemState {
  problems: Problem[];
  selectedProblem: Problem | null;
  loading: boolean;
  error: string | null;
  filters: ProblemFilter;
  pagination: ProblemPagination;
  activeListKey: string | null;
  activeDetailKey: string | null;
  listCache: Record<string, ProblemListCacheEntry>;
  detailCache: Record<string, ProblemDetailCacheEntry>;
}

const initialState: ProblemState = {
  problems: [],
  selectedProblem: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    difficulty: 'All',
    topic: 'All',
    company: 'All',
  },
  pagination: {
    page: 1,
    total: 0,
    limit: 20,
    totalPages: 1,
  },
  activeListKey: null,
  activeDetailKey: null,
  listCache: {},
  detailCache: {},
};

const normalizeFilterValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return [...value].map((item) => String(item)).sort();
  }
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return String(value);
};

const getProblemListKey = (params?: ProblemFilter): string =>
  JSON.stringify({
    search: normalizeFilterValue(params?.searchText ?? params?.search),
    difficulty: normalizeFilterValue(params?.difficulty ?? params?.level),
    topic: normalizeFilterValue(params?.topic),
    companies: normalizeFilterValue(params?.companies ?? params?.company),
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
  });

const getProblemDetailKey = (id: string | number): string => String(id).trim().toLowerCase();

const isFresh = (fetchedAt: number, ttlMs: number): boolean =>
  fetchedAt > 0 && Date.now() - fetchedAt < ttlMs;

const applyLocalProblemState = (problems: Problem[]): Problem[] => {
  const solvedMap = getSolvedStorage();
  const bookmarks = getBookmarksStorage();

  return problems.map((problem) => ({
    ...problem,
    isSolved: !!solvedMap[problem.id] || !!problem.isSolved,
    isBookmarked: bookmarks.some((bookmark) => bookmark.itemId === problem.id) || !!problem.isBookmarked,
  }));
};

const getSolvedStorage = (): Record<string, boolean> => {
  try {
    const saved = userScopedStorage.getItem('solved_problems');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const getBookmarksStorage = (): Array<{ itemId: string }> => {
  try {
    const saved = userScopedStorage.getItem('bookmarks');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const trimCache = <T extends { fetchedAt: number }>(
  cache: Record<string, T>,
  maxEntries: number
): Record<string, T> => {
  const entries = Object.entries(cache).sort(([, left], [, right]) => right.fetchedAt - left.fetchedAt);
  return Object.fromEntries(entries.slice(0, maxEntries));
};

export const fetchProblems = createAsyncThunk(
  'problems/fetchList',
  async (params: ProblemFilter | undefined, { rejectWithValue, getState, signal }) => {
    const key = getProblemListKey(params);
    const state = getState() as { problems: ProblemState };
    const cached = state.problems.listCache[key];

    if (cached && isFresh(cached.fetchedAt, PROBLEM_LIST_CACHE_TTL_MS)) {
      return {
        key,
        problems: cached.problems,
        pagination: cached.pagination,
        fetchedAt: cached.fetchedAt,
      };
    }

    try {
      const res = await problemService.getProblems(params, signal);
      const problems = Array.isArray(res.data) ? res.data : [];
      const total = res.meta?.total ?? problems.length;
      const limit = res.meta?.limit ?? params?.limit ?? 20;

      return {
        key,
        problems,
        pagination: {
          page: res.meta?.page ?? params?.page ?? 1,
          total,
          limit,
          totalPages: res.meta?.totalPages ?? (Math.ceil(total / limit) || 1),
        },
        fetchedAt: Date.now(),
      };
    } catch (err: any) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      return rejectWithValue(err?.message || 'Failed to fetch problems');
    }
  },
  {
    condition: (params, { getState }) => {
      const state = getState() as { problems: ProblemState };
      const key = getProblemListKey(params);
      const cached = state.problems.listCache[key];

      if (state.problems.loading && state.problems.activeListKey === key) {
        return false;
      }

      return !(cached && isFresh(cached.fetchedAt, PROBLEM_LIST_CACHE_TTL_MS) && state.problems.activeListKey === key);
    },
  }
);

export const fetchProblemById = createAsyncThunk(
  'problems/fetchById',
  async (id: string, { rejectWithValue, getState, signal }) => {
    const key = getProblemDetailKey(id);
    const state = getState() as { problems: ProblemState };
    const cached = state.problems.detailCache[key];

    if (cached && isFresh(cached.fetchedAt, PROBLEM_DETAIL_CACHE_TTL_MS)) {
      return {
        key,
        problem: cached.problem,
        fetchedAt: cached.fetchedAt,
      };
    }

    try {
      const res = await problemService.getProblemById(id, signal);
      return {
        key,
        problem: res.data,
        fetchedAt: Date.now(),
      };
    } catch (err: any) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      return rejectWithValue(err?.message || 'Failed to fetch problem detail');
    }
  },
  {
    condition: (id, { getState }) => {
      const state = getState() as { problems: ProblemState };
      const key = getProblemDetailKey(id);
      const cached = state.problems.detailCache[key];

      if (state.problems.loading && state.problems.activeDetailKey === key) {
        return false;
      }

      return !(cached && isFresh(cached.fetchedAt, PROBLEM_DETAIL_CACHE_TTL_MS) && state.problems.activeDetailKey === key);
    },
  }
);

export const fetchProblemBySlug = fetchProblemById;

export const toggleSolveProblem = createAsyncThunk(
  'problems/toggleSolve',
  async (id: string) => {
    const solvedMap = getSolvedStorage();
    const current = solvedMap[id];
    const updatedStatus = current !== undefined ? !current : true;
    solvedMap[id] = updatedStatus;
    try {
      userScopedStorage.setItem('solved_problems', JSON.stringify(solvedMap));
    } catch {}
    return { id, isSolved: updatedStatus };
  }
);

const problemSlice = createSlice({
  name: 'problems',
  initialState,
  reducers: {
    setFilter(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters(state) {
      state.filters = initialState.filters;
    },
    setPaginationPage(state, action) {
      state.pagination.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProblems.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.activeListKey = getProblemListKey(action.meta.arg);
      })
      .addCase(fetchProblems.fulfilled, (state, action) => {
        const { key, problems, pagination, fetchedAt } = action.payload;
        state.listCache = trimCache(
          {
            ...state.listCache,
            [key]: { problems, pagination, fetchedAt },
          },
          MAX_LIST_CACHE_ENTRIES
        );

        if (state.activeListKey !== key) {
          return;
        }

        state.loading = false;
        state.problems = applyLocalProblemState(problems);
        state.pagination = pagination;
      })
      .addCase(fetchProblems.rejected, (state, action) => {
        if (action.meta.aborted || state.activeListKey !== getProblemListKey(action.meta.arg)) {
          return;
        }

        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to fetch problems';

        if (state.problems.length === 0) {
          const fallbackProblems = fallbackProblemsData;
          state.problems = applyLocalProblemState(fallbackProblems);
          const total = fallbackProblems.length;
          const limit = state.pagination.limit || 20;
          state.pagination = {
            page: 1,
            total,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
          };
        }
      })
      .addCase(fetchProblemById.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.activeDetailKey = getProblemDetailKey(action.meta.arg);
        state.selectedProblem = null;
      })
      .addCase(fetchProblemById.fulfilled, (state, action) => {
        const { key, problem, fetchedAt } = action.payload;
        state.detailCache = trimCache(
          {
            ...state.detailCache,
            [key]: { problem, fetchedAt },
          },
          MAX_DETAIL_CACHE_ENTRIES
        );

        if (state.activeDetailKey !== key) {
          return;
        }

        state.loading = false;
        state.selectedProblem = problem
          ? applyLocalProblemState([problem])[0]
          : null;
      })
      .addCase(fetchProblemById.rejected, (state, action) => {
        if (action.meta.aborted || state.activeDetailKey !== getProblemDetailKey(action.meta.arg)) {
          return;
        }

        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to fetch problem detail';

        if (!state.selectedProblem) {
          const fallback = fallbackProblemsData.find(
            (problem) =>
              problem.id?.toLowerCase() === String(action.meta.arg).toLowerCase() ||
              problem.slug?.toLowerCase() === String(action.meta.arg).toLowerCase()
          ) || fallbackProblemsData[0];

          if (fallback) {
            state.selectedProblem = applyLocalProblemState([fallback])[0];
          }
        }
      })
      .addCase(toggleSolveProblem.fulfilled, (state, action) => {
        const { id, isSolved } = action.payload;
        const problem = state.problems.find((item) => item.id === id);
        if (problem) {
          problem.isSolved = isSolved;
        }

        if (state.selectedProblem && state.selectedProblem.id === id) {
          state.selectedProblem.isSolved = isSolved;
        }

        Object.values(state.listCache).forEach((entry) => {
          const cachedProblem = entry.problems.find((item) => item.id === id);
          if (cachedProblem) {
            cachedProblem.isSolved = isSolved;
          }
        });

        Object.values(state.detailCache).forEach((entry) => {
          if (entry.problem?.id === id) {
            entry.problem.isSolved = isSolved;
          }
        });
      });
  },
});

export const { setFilter, resetFilters, setPaginationPage } = problemSlice.actions;
export default problemSlice.reducer;
