import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../../../app/store';
import { userScopedStorage } from '../../../core/storage/userScopedStorage';
import { userQuestionService } from '../../../services/userQuestionService';

const PROGRESS_STORAGE_KEY = 'problem_progress';
const LEGACY_PROGRESS_KEYS = ['solved_problems', 'dsa_sheet_solved'] as const;

export type SolvedByProblemId = Record<string, boolean>;

export interface ProblemProgressState {
  solvedByProblemId: SolvedByProblemId;
}

const readMap = (key: string): SolvedByProblemId => {
  try {
    const saved = userScopedStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const loadInitialProgress = (): SolvedByProblemId => {
  const canonical = readMap(PROGRESS_STORAGE_KEY);

  // One-time logical migration: preserve legacy solved states that are not
  // already represented by the canonical map. Legacy keys remain untouched.
  LEGACY_PROGRESS_KEYS.forEach((key) => {
    const legacy = readMap(key);
    Object.entries(legacy).forEach(([problemId, isSolved]) => {
      if (canonical[problemId] === undefined && typeof isSolved === 'boolean') {
        canonical[problemId] = isSolved;
      }
    });
  });

  try {
    userScopedStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(canonical));
  } catch {}

  return canonical;
};

const persistProgress = (solvedByProblemId: SolvedByProblemId): void => {
  try {
    userScopedStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(solvedByProblemId));
  } catch {}
};

const initialState: ProblemProgressState = {
  solvedByProblemId: loadInitialProgress(),
};

export interface ProblemProgressRef {
  id: string | number;
  fallbackSolved?: boolean;
}

export const getProblemSolvedStatus = (
  solvedByProblemId: SolvedByProblemId,
  ref: ProblemProgressRef
): boolean => solvedByProblemId[String(ref.id)] ?? !!ref.fallbackSolved;

export const hydrateProgress = createAsyncThunk(
  'progress/hydrate',
  async (_, { getState }) => {
    const canonical = loadInitialProgress();
    const state = getState() as RootState;
    const userId = state.auth?.user?.id;
    const isAuthenticated = state.auth?.isAuthenticated;

    if (isAuthenticated && userId) {
      try {
        const solvedList = await userQuestionService.getSolvedQuestions(userId);
        if (Array.isArray(solvedList) && solvedList.length > 0) {
          solvedList.forEach((item: any) => {
            const qId = String(item?.questionId ?? item?.id ?? item);
            if (qId && qId !== '[object Object]') {
              canonical[qId] = true;
            }
          });
          persistProgress(canonical);
        }
      } catch {
        // Backend endpoint /api/v1/users/{userId}/solvedQuestions may be unmapped on remote; preserve local progress safely
      }
    }

    return canonical;
  }
);

export const toggleSolvedProblem = createAsyncThunk(
  'progress/toggleSolved',
  async (ref: ProblemProgressRef, { getState }) => {
    const state = getState() as RootState;
    const current = getProblemSolvedStatus(state.progress.solvedByProblemId, ref);
    const isSolved = !current;

    return {
      problemId: String(ref.id),
      isSolved,
    };
  }
);

export const markSolvedProblem = createAsyncThunk(
  'progress/markSolved',
  async (ref: ProblemProgressRef) => ({
    problemId: String(ref.id),
    isSolved: true,
  })
);

const problemProgressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(hydrateProgress.fulfilled, (state, action) => {
        state.solvedByProblemId = action.payload;
      })
      .addCase(toggleSolvedProblem.fulfilled, (state, action) => {
        state.solvedByProblemId[action.payload.problemId] = action.payload.isSolved;
        persistProgress(state.solvedByProblemId);
      })
      .addCase(markSolvedProblem.fulfilled, (state, action) => {
        state.solvedByProblemId[action.payload.problemId] = true;
        persistProgress(state.solvedByProblemId);
      });
  },
});

export default problemProgressSlice.reducer;
