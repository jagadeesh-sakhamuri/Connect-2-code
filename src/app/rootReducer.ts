import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/redux/authSlice';
import problemReducer from '../features/problems/redux/problemSlice';
import companyReducer from '../features/companies/redux/companySlice';
import bookmarkReducer from '../features/bookmarks/redux/bookmarkSlice';
import profileReducer from '../features/profile/redux/profileSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  problems: problemReducer,
  companies: companyReducer,
  bookmarks: bookmarkReducer,
  profile: profileReducer,
});
