import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { executionService } from '../../../services/executionService';
import type { Language } from '../../../core/types/domain';

export interface LanguageState {
  languages: Language[];
  loading: boolean;
  error: string | null;
}

const initialState: LanguageState = {
  languages: [],
  loading: false,
  error: null,
};

export const fetchLanguages = createAsyncThunk(
  'languages/fetchDropdown',
  async (_, { rejectWithValue }) => {
    try {
      return await executionService.getLanguageDropdown();
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to load languages');
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { languages: LanguageState };
      return state.languages.languages.length === 0 && !state.languages.loading;
    },
  }
);

const languageSlice = createSlice({
  name: 'languages',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLanguages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLanguages.fulfilled, (state, action) => {
        state.loading = false;
        state.languages = action.payload;
      })
      .addCase(fetchLanguages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default languageSlice.reducer;
