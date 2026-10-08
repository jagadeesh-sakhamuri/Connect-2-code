import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { referenceService } from '../../../services/referenceService';
import type { ReferenceItem } from '../../../core/types/domain';

export interface ReferenceState {
  groups: Record<string, ReferenceItem[]>;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
}

const initialState: ReferenceState = {
  groups: {},
  loading: {},
  errors: {},
};

export const fetchReferenceGroup = createAsyncThunk(
  'references/fetchGroup',
  async (groupCode: string, { rejectWithValue }) => {
    try {
      const response = await referenceService.getByGroupCode(groupCode);
      return { groupCode, items: response.data };
    } catch (error: any) {
      return rejectWithValue({
        groupCode,
        message: error?.message || 'Failed to load reference data',
      });
    }
  },
  {
    condition: (groupCode, { getState }) => {
      const state = getState() as { references: ReferenceState };
      const items = state.references.groups[groupCode];
      return !items || items.length === 0;
    },
  }
);

const referenceSlice = createSlice({
  name: 'references',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReferenceGroup.pending, (state, action) => {
        const groupCode = action.meta.arg;
        state.loading[groupCode] = true;
        state.errors[groupCode] = null;
      })
      .addCase(fetchReferenceGroup.fulfilled, (state, action) => {
        const { groupCode, items } = action.payload;
        state.loading[groupCode] = false;
        state.groups[groupCode] = items;
      })
      .addCase(fetchReferenceGroup.rejected, (state, action) => {
        const groupCode = action.meta.arg;
        state.loading[groupCode] = false;
        const payload = action.payload as { groupCode?: string; message?: string } | undefined;
        state.errors[groupCode] = payload?.message || action.error.message || 'Failed to load reference data';
      });
  },
});

export default referenceSlice.reducer;
