import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { profileService, UserProfileData } from '../../../services/profileService';

export interface ProfileState {
  profile: UserProfileData | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  error: null,
};

export const fetchUserProfile = createAsyncThunk('profile/fetch', async () => {
  const res = await profileService.getProfile();
  return res.data;
});

export const updateUserProfile = createAsyncThunk(
  'profile/update',
  async (payload: Partial<UserProfileData>) => {
    const res = await profileService.updateProfile(payload);
    return res.data;
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      });
  },
});

export default profileSlice.reducer;
