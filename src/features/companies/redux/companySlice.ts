import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { companyService } from '../../../services/companyService';

export interface CompanyItem {
  id: string | number;
  name: string;
  slug: string;
  logo?: string;
  industry?: string;
  problemCount?: number;
  description?: string;
  websiteUrl?: string;
  difficultyBreakdown?: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface CompanyState {
  companies: CompanyItem[];
  selectedCompany: CompanyItem | null;
  companyProblems: any[];
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
  async (companyName: string) => {
    const res = await companyService.getCompanyProblems(companyName);
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
