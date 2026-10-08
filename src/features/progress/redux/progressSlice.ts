import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../../../app/store';
import { userScopedStorage } from '../../../core/storage/userScopedStorage';

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
  async () => loadInitialProgress()
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
