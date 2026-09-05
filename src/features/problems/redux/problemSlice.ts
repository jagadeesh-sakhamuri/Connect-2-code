import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { problemService, ProblemFilterParams, ProblemItem } from '../../../services/problemService';

export interface ProblemState {
  problems: ProblemItem[];
  selectedProblem: ProblemItem | null;
  loading: boolean;
  error: string | null;
  filters: ProblemFilterParams;
  pagination: {
    page: number;
    total: number;
    limit: number;
    totalPages: number;
  };
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
};

export const fetchProblems = createAsyncThunk(
  'problems/fetchList',
  async (params: ProblemFilterParams | undefined, { rejectWithValue }) => {
    try {
      const res = await problemService.getProblems(params);
      return {
        data: res.data,
        meta: res.meta,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch problems');
    }
  }
);

export const fetchProblemById = createAsyncThunk(
  'problems/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await problemService.getProblemById(id);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch problem detail');
    }
  }
);

export const fetchProblemBySlug = fetchProblemById;

const SOLVED_STORAGE_KEY = 'myjo_solved_problems';
const BOOKMARKS_STORAGE_KEY = 'myjo_bookmarks';

const getSolvedStorage = (): Record<string, boolean> => {
  try {
    const saved = localStorage.getItem(SOLVED_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
};

const getBookmarksStorage = (): any[] => {
  try {
    const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export const toggleSolveProblem = createAsyncThunk(
  'problems/toggleSolve',
  async (id: string) => {
    const solvedMap = getSolvedStorage();
    const current = solvedMap[id];
    const updatedStatus = current !== undefined ? !current : true;
    solvedMap[id] = updatedStatus;
    try {
      localStorage.setItem(SOLVED_STORAGE_KEY, JSON.stringify(solvedMap));
    } catch (e) {}
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
      .addCase(fetchProblems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProblems.fulfilled, (state, action) => {
        state.loading = false;
        const solvedMap = getSolvedStorage();
        const bookmarks = getBookmarksStorage();

        const rawList = Array.isArray(action.payload?.data)
          ? action.payload.data
          : (Array.isArray(action.payload?.data?.content) ? action.payload.data.content : []);

        state.problems = rawList.map((p: any) => ({
          ...p,
          isSolved: !!solvedMap[p.id] || !!p.isSolved,
          isBookmarked: bookmarks.some((b: any) => b.itemId === p.id) || !!p.isBookmarked,
        }));

        if (action.payload?.meta) {
          const metaTotal = action.payload.meta.total !== undefined ? action.payload.meta.total : rawList.length;
          const metaLimit = action.payload.meta.limit || state.pagination.limit || 20;
          state.pagination.total = metaTotal;
          state.pagination.page = action.payload.meta.page || 1;
          state.pagination.limit = metaLimit;
          state.pagination.totalPages = action.payload.meta.totalPages || Math.ceil(metaTotal / metaLimit) || 1;
        }
      })
      .addCase(fetchProblems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProblemById.pending, (state) => {
        state.loading = true;
        state.selectedProblem = null;
      })
      .addCase(fetchProblemById.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          const solvedMap = getSolvedStorage();
          const bookmarks = getBookmarksStorage();
          const p = action.payload;
          state.selectedProblem = {
            ...p,
            isSolved: !!solvedMap[p.id],
            isBookmarked: bookmarks.some((b: any) => b.itemId === p.id),
          };
        }
      })
      .addCase(toggleSolveProblem.fulfilled, (state, action) => {
        const { id, isSolved } = action.payload;
        const problem = state.problems.find((p) => p.id === id);
        if (problem) {
          problem.isSolved = isSolved;
        }
        if (state.selectedProblem && state.selectedProblem.id === id) {
          state.selectedProblem.isSolved = isSolved;
        }
      });
  },
});

export const { setFilter, resetFilters, setPaginationPage } = problemSlice.actions;
export default problemSlice.reducer;
