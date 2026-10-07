import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService, LoginPayload } from '../../../services/authService';
import { tokenStorage } from '../../../core/security/tokenStorage';

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
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup' | 'forgot';
}

const initialToken = tokenStorage.getAccessToken();
const initialRefreshToken = tokenStorage.getRefreshToken();
const initialUser = tokenStorage.getUser();

// User is authenticated if they have an active access token, a valid refresh token, or a persisted user profile
const initialIsAuthenticated = Boolean(
  initialToken || initialRefreshToken || (initialUser && initialUser.email)
);

const initialState: AuthState = {
  user: initialUser,
  token: initialToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: initialIsAuthenticated,
  loading: false,
  error: null,
  isAuthModalOpen: false,
  authModalMode: 'login',
};

export const silentRefreshSession = createAsyncThunk(
  'auth/silentRefresh',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) return null;
      const res = await authService.refreshToken();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Session refresh failed');
    }
  }
);

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

export const loginWithGoogleRefreshToken = createAsyncThunk(
  'auth/loginWithGoogleRefreshToken',
  async (refreshToken: string, { rejectWithValue }) => {
    try {
      const response = await authService.exchangeRefreshToken(refreshToken);
      return response.data;
    } catch (err: any) {
      const errMsg = err.message || (err.errors && err.errors[0]) || 'Failed to authenticate with Google';
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
      const refreshToken = tokenStorage.getRefreshToken();
      const savedUser = tokenStorage.getUser();
      const hasAuth = Boolean(token || refreshToken || (savedUser && savedUser.email));
      state.isAuthenticated = hasAuth;
      state.user = hasAuth ? savedUser : null;
      state.token = token;
      state.refreshToken = refreshToken;
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
      // Silent Refresh
      .addCase(silentRefreshSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.isAuthenticated = true;
          const data = action.payload;
          if (data.user || data.email) {
            const u = data.user || data;
            const userObj = {
              id: u.id,
              firstName: u.firstName,
              lastName: u.lastName,
              fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
              email: u.email,
              role: u.role,
            };
            state.user = userObj;
            tokenStorage.setUser(userObj);
          }
        }
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.isAuthModalOpen = false;
        const data = action.payload;
        state.token = null;
        state.refreshToken = null;
        const userObj = {
          id: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
          email: data.email,
          role: data.role,
        };
        state.user = userObj;
        tokenStorage.setUser(userObj);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Google OAuth loginWithGoogleRefreshToken
      .addCase(loginWithGoogleRefreshToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogleRefreshToken.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.isAuthModalOpen = false;
        const data = action.payload;
        state.token = null;
        state.refreshToken = null;
        const userObj = {
          id: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
          email: data.email,
          role: data.role,
        };
        state.user = userObj;
        tokenStorage.setUser(userObj);
      })
      .addCase(loginWithGoogleRefreshToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        tokenStorage.clearTokens();
      });
  },
});

export const { initializeAuth, clearAuthError, openAuthModal, closeAuthModal, setAuthModalMode } = authSlice.actions;
export default authSlice.reducer;
