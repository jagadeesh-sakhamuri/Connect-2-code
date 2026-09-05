import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export interface BookmarkItem {
  id: string;
  itemId: string;
  type: 'PROBLEM' | 'COMPANY' | 'APTITUDE';
  title: string;
  difficulty?: string;
  category?: string;
  savedAt: string;
}

export interface BookmarkState {
  bookmarks: BookmarkItem[];
  loading: boolean;
  error: string | null;
}

const LOCAL_STORAGE_KEY = 'myjo_bookmarks';

const loadBookmarksFromStorage = (): BookmarkItem[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load bookmarks from storage', e);
  }
  return [];
};

const saveBookmarksToStorage = (bookmarks: BookmarkItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bookmarks));
  } catch (e) {
    console.error('Failed to save bookmarks to storage', e);
  }
};

const initialState: BookmarkState = {
  bookmarks: loadBookmarksFromStorage(),
  loading: false,
  error: null,
};

export const fetchBookmarks = createAsyncThunk('bookmarks/fetchList', async () => {
  return loadBookmarksFromStorage();
});

export const toggleBookmarkItem = createAsyncThunk(
  'bookmarks/toggle',
  async (payload: {
    itemId: string;
    type?: 'PROBLEM' | 'COMPANY' | 'APTITUDE';
    title?: string;
    difficulty?: string;
    category?: string;
  }) => {
    const { itemId, type = 'PROBLEM', title, difficulty, category } = payload;
    const current = loadBookmarksFromStorage();
    const exists = current.some((b) => b.itemId === itemId);

    let updated: BookmarkItem[];
    if (exists) {
      updated = current.filter((b) => b.itemId !== itemId);
    } else {
      const newItem: BookmarkItem = {
        id: `bm-${Date.now()}`,
        itemId,
        type,
        title: title || itemId,
        difficulty,
        category,
        savedAt: new Date().toISOString(),
      };
      updated = [newItem, ...current];
    }

    saveBookmarksToStorage(updated);
    return updated;
  }
);

const bookmarkSlice = createSlice({
  name: 'bookmarks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookmarks.fulfilled, (state, action) => {
        state.bookmarks = action.payload;
      })
      .addCase(toggleBookmarkItem.fulfilled, (state, action) => {
        state.bookmarks = action.payload;
      });
  },
});

export default bookmarkSlice.reducer;
