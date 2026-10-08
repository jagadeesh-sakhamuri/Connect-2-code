import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { companyService } from '../../../services/companyService';
import { isRequestCanceled } from '../../../core/api/apiClient';
import type { Company, Problem } from '../../../core/types/domain';

const COMPANY_LIST_CACHE_TTL_MS = 5 * 60_000;
const COMPANY_DETAIL_CACHE_TTL_MS = 5 * 60_000;
const COMPANY_PROBLEMS_CACHE_TTL_MS = 2 * 60_000;

export type CompanyItem = Company;

export interface CompanyState {
  companies: CompanyItem[];
  selectedCompany: CompanyItem | null;
  companyProblems: Problem[];
  loading: boolean;
  companyProblemsLoading: boolean;
  error: string | null;
  companiesRequestKey: string | null;
  companiesFetchedAt: number;
  companyDetailRequestKey: string | null;
  companyDetailFetchedAt: number;
  companyProblemsRequestKey: string | null;
  companyProblemsFetchedAt: number;
}

const initialState: CompanyState = {
  companies: [],
  selectedCompany: null,
  companyProblems: [],
  loading: false,
  companyProblemsLoading: false,
  error: null,
  companiesRequestKey: null,
  companiesFetchedAt: 0,
  companyDetailRequestKey: null,
  companyDetailFetchedAt: 0,
  companyProblemsRequestKey: null,
  companyProblemsFetchedAt: 0,
};

const getCompanyListKey = (search?: string): string => (search || '').trim().toLowerCase();

const getCompanyDetailKey = (slug: string): string => slug.trim().toLowerCase();

const normalizeProblemLookup = (
  payload: { id?: string | number; name?: string } | string | number
): { id?: string | number; name?: string; key: string } => {
  let id: string | number | undefined;
  let name: string | undefined;

  if (typeof payload === 'object' && payload !== null) {
    id = payload.id;
    name = payload.name;
  } else if (typeof payload === 'number' || (!isNaN(Number(payload)) && String(payload).trim() !== '')) {
    id = payload;
  } else {
    name = String(payload);
  }

  const normalizedId = id !== undefined ? String(id).trim().toLowerCase() : '';
  const normalizedName = name ? name.trim().toLowerCase() : '';
  return {
    id,
    name,
    key: normalizedId ? \`id:\${normalizedId}|name:\${normalizedName}\` : \`name:\${normalizedName}\`,
  };
};

export const fetchCompanies = createAsyncThunk(
  'companies/fetchList',
  async (search: string | undefined, { rejectWithValue, getState, signal }) => {
    const key = getCompanyListKey(search);
    const state = getState() as { companies: CompanyState };

    if (!key && state.companies.companies.length > 0 && Date.now() - state.companies.companiesFetchedAt < COMPANY_LIST_CACHE_TTL_MS) {
      return {
        key,
        companies: state.companies.companies,
        fetchedAt: state.companies.companiesFetchedAt,
      };
    }

    try {
      const res = await companyService.getCompanies(search, signal);
      return {
        key,
        companies: res.data,
        fetchedAt: Date.now(),
      };
    } catch (err: any) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      return rejectWithValue(err?.message || 'Failed to fetch companies');
    }
  },
  {
    condition: (search, { getState }) => {
      const state = getState() as { companies: CompanyState };
      const key = getCompanyListKey(search);

      if (state.companies.loading && state.companies.companiesRequestKey === key) {
        return false;
      }

      if (!key && state.companies.companies.length > 0 && Date.now() - state.companies.companiesFetchedAt < COMPANY_LIST_CACHE_TTL_MS) {
        return false;
      }

      return true;
    },
  }
);

export const fetchCompanyBySlug = createAsyncThunk(
  'companies/fetchBySlug',
  async (slug: string, { rejectWithValue, getState, signal }) => {
    const key = getCompanyDetailKey(slug);
    const state = getState() as { companies: CompanyState };

    if (
      state.companies.selectedCompany &&
      state.companies.companyDetailRequestKey === key &&
      Date.now() - state.companies.companyDetailFetchedAt < COMPANY_DETAIL_CACHE_TTL_MS
    ) {
      return {
        key,
        company: state.companies.selectedCompany,
        fetchedAt: state.companies.companyDetailFetchedAt,
      };
    }

    try {
      const res = await companyService.getCompanyBySlug(slug, signal);
      return {
        key,
        company: res.data,
        fetchedAt: Date.now(),
      };
    } catch (err: any) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      return rejectWithValue(err?.message || 'Failed to fetch company detail');
    }
  },
  {
    condition: (slug, { getState }) => {
      const state = getState() as { companies: CompanyState };
      const key = getCompanyDetailKey(slug);

      if (state.companies.loading && state.companies.companyDetailRequestKey === key) {
        return false;
      }

      return !(
        state.companies.selectedCompany &&
        state.companies.companyDetailRequestKey === key &&
        Date.now() - state.companies.companyDetailFetchedAt < COMPANY_DETAIL_CACHE_TTL_MS
      );
    },
  }
);

export const fetchCompanyProblems = createAsyncThunk(
  'companies/fetchProblems',
  async (
    payload: { id?: string | number; name?: string } | string | number,
    { rejectWithValue, getState, signal }
  ) => {
    const lookup = normalizeProblemLookup(payload);
    const state = getState() as { companies: CompanyState };

    if (
      state.companies.companyProblemsRequestKey === lookup.key &&
      Date.now() - state.companies.companyProblemsFetchedAt < COMPANY_PROBLEMS_CACHE_TTL_MS
    ) {
      return {
        key: lookup.key,
        problems: state.companies.companyProblems,
        fetchedAt: state.companies.companyProblemsFetchedAt,
      };
    }

    try {
      const res = await companyService.getCompanyProblems(lookup.id, lookup.name, signal);
      return {
        key: lookup.key,
        problems: res.data,
        fetchedAt: Date.now(),
      };
    } catch (err: any) {
      if (isRequestCanceled(err)) {
        throw err;
      }
      return rejectWithValue(err?.message || 'Failed to fetch company problems');
    }
  },
  {
    condition: (payload, { getState }) => {
      const state = getState() as { companies: CompanyState };
      const lookup = normalizeProblemLookup(payload);

      if (state.companies.companyProblemsLoading && state.companies.companyProblemsRequestKey === lookup.key) {
        return false;
      }

      return !(
        state.companies.companyProblemsRequestKey === lookup.key &&
        Date.now() - state.companies.companyProblemsFetchedAt < COMPANY_PROBLEMS_CACHE_TTL_MS
      );
    },
  }
);

const companySlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.companiesRequestKey = getCompanyListKey(action.meta.arg);
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        const { key, companies, fetchedAt } = action.payload;
        state.companies = companies;
        state.companiesFetchedAt = fetchedAt;
        state.loading = false;
        state.companiesRequestKey = key;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        if (action.meta.aborted || state.companiesRequestKey !== getCompanyListKey(action.meta.arg)) {
          return;
        }
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to fetch companies';
      })
      .addCase(fetchCompanyBySlug.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.companyDetailRequestKey = getCompanyDetailKey(action.meta.arg);
        state.selectedCompany = null;
        state.companyProblems = [];
      })
      .addCase(fetchCompanyBySlug.fulfilled, (state, action) => {
        const { key, company, fetchedAt } = action.payload;
        if (state.companyDetailRequestKey !== key) {
          return;
        }
        state.loading = false;
        state.selectedCompany = company;
        state.companyDetailFetchedAt = fetchedAt;
      })
      .addCase(fetchCompanyBySlug.rejected, (state, action) => {
        if (action.meta.aborted || state.companyDetailRequestKey !== getCompanyDetailKey(action.meta.arg)) {
          return;
        }
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to fetch company detail';
      })
      .addCase(fetchCompanyProblems.pending, (state, action) => {
        state.error = null;
        state.companyProblemsLoading = true;
        state.companyProblemsRequestKey = normalizeProblemLookup(action.meta.arg).key;
        state.companyProblems = [];
      })
      .addCase(fetchCompanyProblems.fulfilled, (state, action) => {
        const { key, problems, fetchedAt } = action.payload;
        if (state.companyProblemsRequestKey !== key) {
          return;
        }
        state.companyProblemsLoading = false;
        state.companyProblems = problems;
        state.companyProblemsFetchedAt = fetchedAt;
      })
      .addCase(fetchCompanyProblems.rejected, (state, action) => {
        if (action.meta.aborted || state.companyProblemsRequestKey !== normalizeProblemLookup(action.meta.arg).key) {
          return;
        }
        state.companyProblemsLoading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to fetch company problems';
      });
  },
});

export default companySlice.reducer;
