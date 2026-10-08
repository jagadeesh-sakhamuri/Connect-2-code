import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { companyService } from '../../../services/companyService';
import type { Company, Problem } from '../../../core/types/domain';

export type CompanyItem = Company;

export interface CompanyState {
  companies: CompanyItem[];
  selectedCompany: CompanyItem | null;
  companyProblems: Problem[];
  loading: boolean;
  error: string | null;
}

const initialState: CompanyState = {
  companies: [],
  selectedCompany: null,
  companyProblems: [],
  loading: false,
  error: null,
};

export const fetchCompanies = createAsyncThunk(
  'companies/fetchList',
  async (search: string | undefined, { rejectWithValue }) => {
    try {
      const res = await companyService.getCompanies(search);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch companies');
    }
  }
);

export const fetchCompanyBySlug = createAsyncThunk(
  'companies/fetchBySlug',
  async (slug: string, { rejectWithValue }) => {
    try {
      const res = await companyService.getCompanyBySlug(slug);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch company detail');
    }
  }
);

export const fetchCompanyProblems = createAsyncThunk(
  'companies/fetchProblems',
  async (payload: { id?: string | number; name?: string } | string | number) => {
    let companyId: string | number | undefined;
    let companyName: string | undefined;

    if (typeof payload === 'object' && payload !== null) {
      companyId = payload.id;
      companyName = payload.name;
    } else if (typeof payload === 'number' || (!isNaN(Number(payload)) && String(payload).trim() !== '')) {
      companyId = payload;
    } else {
      companyName = String(payload);
    }

    const res = await companyService.getCompanyProblems(companyId, companyName);
    return res.data;
  }
);

const companySlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = action.payload;
      })
      .addCase(fetchCompanyBySlug.fulfilled, (state, action) => {
        state.selectedCompany = action.payload;
      })
      .addCase(fetchCompanyProblems.fulfilled, (state, action) => {
        state.companyProblems = action.payload;
      });
  },
});

export default companySlice.reducer;
