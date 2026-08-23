import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService, LoginPayload, SignUpPayload } from '../../../services/authService';
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
  authModalMode: 'login' | 'signup';
}

const initialToken = tokenStorage.getAccessToken();
const initialUser = tokenStorage.getUser();

const initialState: AuthState = {
  user: initialUser,
  token: null,
  refreshToken: null,
  isAuthenticated: Boolean(initialToken),
  loading: false,
  error: null,
  isAuthModalOpen: false,
  authModalMode: 'login',
};

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

export const registerUser = createAsyncThunk(
  'auth/signUp',
  async (payload: SignUpPayload, { rejectWithValue }) => {
    try {
      const res = await authService.signUp(payload);
      if (res.statusCode === 200) {
        return res.data || res.message;
      }
      return rejectWithValue(res.message || (res.errors && res.errors[0]) || 'Error while Creating the User');
    } catch (err: any) {
      const errMsg = err.message || (err.errors && err.errors[0]) || 'Error while Creating the User';
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
      const hasToken = Boolean(tokenStorage.getAccessToken());
      const savedUser = tokenStorage.getUser();
      state.isAuthenticated = hasToken;
      state.user = hasToken ? savedUser : null;
    },
    clearAuthError(state) {
      state.error = null;
    },
    openAuthModal(state, action: PayloadAction<{ mode?: 'login' | 'signup' } | undefined>) {
      state.isAuthModalOpen = true;
      if (action?.payload?.mode) {
        state.authModalMode = action.payload.mode;
      }
    },
    closeAuthModal(state) {
      state.isAuthModalOpen = false;
    },
    setAuthModalMode(state, action: PayloadAction<'login' | 'signup'>) {
      state.authModalMode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
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
      // SignUp
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        state.authModalMode = 'login';
      })
      .addCase(registerUser.rejected, (state, action) => {
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
