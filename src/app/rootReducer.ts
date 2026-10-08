import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/redux/authSlice';
import problemReducer from '../features/problems/redux/problemSlice';
import companyReducer from '../features/companies/redux/companySlice';
import bookmarkReducer from '../features/bookmarks/redux/bookmarkSlice';
import profileReducer from '../features/profile/redux/profileSlice';
import referenceReducer from '../features/references/redux/referenceSlice';
import languageReducer from '../features/languages/redux/languageSlice';
import progressReducer from '../features/progress/redux/progressSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  problems: problemReducer,
  companies: companyReducer,
  bookmarks: bookmarkReducer,
  profile: profileReducer,
  references: referenceReducer,
  languages: languageReducer,
  progress: progressReducer,
});
