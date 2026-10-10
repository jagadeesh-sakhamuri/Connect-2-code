import { createSlice, createAsyncThunk, isAnyOf, type PayloadAction } from '@reduxjs/toolkit';
import { authService, type LoginPayload } from '../../../services/authService';
import { tokenStorage } from '../../../core/security/tokenStorage';

export type AuthStatus = 'LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';

export interface UserProfile {
  id?: number | string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  role?: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup' | 'forgot';
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  status: 'LOADING',
  isAuthenticated: false,
  loading: true,
  error: null,
  isAuthModalOpen: false,
  authModalMode: 'login',
};

// Canonical session refresh thunk: calls POST /api/v1/auth/refresh with HttpOnly cookie or explicit token
export const refreshSessionThunk = createAsyncThunk<
  any,
  string | undefined,
  { rejectValue: string }
>(
  'auth/refreshSession',
  async (explicitToken, { rejectWithValue }) => {
    try {
      const res = await authService.refreshToken(explicitToken);
      const data = res?.data || res;
      return data;
    } catch (err: any) {
      const errMsg = err?.message || (err?.errors && err?.errors[0]) || 'Session refresh failed';
      return rejectWithValue(errMsg);
    }
  }
);

// Backward compatibility alias for silent refresh
export const silentRefreshSession = refreshSessionThunk;

// Backward compatibility alias for legacy Google login thunk
export const loginWithGoogleRefreshToken = refreshSessionThunk;

export const loginUser = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const res = await authService.login(payload);
      if (res.statusCode === 200 && res.data) {
        return res.data;
      }
      return rejectWithValue(res.message || 'Invalid Email or Password');
    } catch (err: any) {
      const errMsg = err.message || (err.errors && err.errors[0]) || 'Invalid Email or Password';
      return rejectWithValue(errMsg);
    }
  }
);

export const generatePasswordResetOtpThunk = createAsyncThunk(
  'auth/generateOtp',
  async (email: string, { rejectWithValue }) => {
    try {
      const res = await authService.generatePasswordResetOtp(email);
      return res?.message || 'Password Reset OTP Sent Successfully';
    } catch (err: any) {
      const errMsg = err.message || (err.errors && err.errors[0]) || 'Failed to send OTP. Please try again.';
      return rejectWithValue(errMsg);
    }
  }
);

export const verifyPasswordResetOtpThunk = createAsyncThunk(
  'auth/verifyOtp',
  async (payload: { email: string; otp: string; password?: string }, { rejectWithValue }) => {
    try {
      const res = await authService.verifyPasswordResetOtp(payload);
      return res?.message || 'Password Reset Successfully';
    } catch (err: any) {
      const errMsg = err.message || (err.errors && err.errors[0]) || 'Failed to verify OTP. Please try again.';
      return rejectWithValue(errMsg);
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    initializeAuth(state) {
      const token = tokenStorage.getAccessToken();
      const savedUser = tokenStorage.getUser();
      if (token) {
        state.status = 'AUTHENTICATED';
        state.isAuthenticated = true;
        state.user = savedUser;
        state.token = token;
        state.loading = false;
      } else {
        // Keeps status as LOADING if startup refresh has not completed yet
        state.token = null;
      }
    },
    setAuthenticatedSession(state, action: PayloadAction<{ token: string; user?: any }>) {
      state.status = 'AUTHENTICATED';
      state.isAuthenticated = true;
      state.loading = false;
      state.token = action.payload.token;
      if (action.payload.user) {
        state.user = action.payload.user;
      }
    },
    setUnauthenticatedSession(state) {
      state.status = 'UNAUTHENTICATED';
      state.isAuthenticated = false;
      state.loading = false;
      state.token = null;
      state.user = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
    openAuthModal(state, action: PayloadAction<{ mode?: 'login' | 'signup' | 'forgot' } | undefined>) {
      state.isAuthModalOpen = true;
      if (action?.payload?.mode) {
        state.authModalMode = action.payload.mode;
      }
    },
    closeAuthModal(state) {
      state.isAuthModalOpen = false;
    },
    setAuthModalMode(state, action: PayloadAction<'login' | 'signup' | 'forgot'>) {
      state.authModalMode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Canonical Refresh Session
      .addCase(refreshSessionThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshSessionThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'AUTHENTICATED';
        state.isAuthenticated = true;
        state.error = null;
        state.token = tokenStorage.getAccessToken();
        const data = action.payload as any;
        if (data) {
          const u = data.user || data;
          if (u && (u.id || u.email)) {
            const userObj: UserProfile = {
              id: u.id,
              firstName: u.firstName,
              lastName: u.lastName,
              fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'User',
              email: String(u.email || ''),
              role: u.role,
            };
            state.user = userObj;
            tokenStorage.setUser(userObj);
          }
        }
      })
      .addCase(refreshSessionThunk.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.status = 'UNAUTHENTICATED';
        state.isAuthenticated = false;
        state.loading = false;
        tokenStorage.clearTokens();
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'AUTHENTICATED';
        state.isAuthenticated = true;
        state.isAuthModalOpen = false;
        const data = action.payload as any;
        state.token = tokenStorage.getAccessToken();
        const userObj: UserProfile = {
          id: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email || 'User',
          email: String(data.email || ''),
          role: data.role,
        };
        state.user = userObj;
        tokenStorage.setUser(userObj);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout - Unconditional token and state cleanup (F-035)
      .addMatcher(
        isAnyOf(logoutUser.fulfilled, logoutUser.rejected),
        (state) => {
          state.user = null;
          state.token = null;
          state.refreshToken = null;
          state.status = 'UNAUTHENTICATED';
          state.isAuthenticated = false;
          state.loading = false;
          state.error = null;
          tokenStorage.clearTokens();
        }
      );
  },
});

export const {
  initializeAuth,
  setAuthenticatedSession,
  setUnauthenticatedSession,
  clearAuthError,
  openAuthModal,
  closeAuthModal,
  setAuthModalMode,
} = authSlice.actions;

export default authSlice.reducer;
