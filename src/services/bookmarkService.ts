import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { mockDelay } from '../mock/mockAdapter';
import bookmarksData from '../mock/data/bookmarks.json';
import { ApiResponse } from '../core/types/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const bookmarkService = {
  async getBookmarks(): Promise<ApiResponse<typeof bookmarksData>> {
    if (USE_MOCK) {
      return mockDelay(bookmarksData, 'Bookmarks list retrieved');
    }
    return apiClient.get(API_ENDPOINTS.BOOKMARKS.LIST);
  },

  async toggleBookmark(itemId: string, type: 'PROBLEM' | 'COMPANY' = 'PROBLEM'): Promise<ApiResponse<any>> {
    if (USE_MOCK) {
      return mockDelay({ itemId, type, isBookmarked: true }, 'Bookmark toggled');
    }
    return apiClient.post(API_ENDPOINTS.BOOKMARKS.TOGGLE(itemId), { type });
  },
};
