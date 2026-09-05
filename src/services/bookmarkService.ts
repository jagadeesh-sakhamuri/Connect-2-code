import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { ApiResponse } from '../core/types/api';

export interface BookmarkItem {
  id: string;
  itemId: string;
  type: 'PROBLEM' | 'APTITUDE' | 'COMPANY';
  title: string;
  difficulty?: string;
  category?: string;
  createdAt?: string;
}

export const bookmarkService = {
  async getBookmarks(): Promise<ApiResponse<BookmarkItem[]>> {
    const res: any = await apiClient.get(API_ENDPOINTS.BOOKMARKS.LIST);
    const data = res?.data || res || [];
    return {
      statusCode: 200,
      message: 'Bookmarks list retrieved',
      data: Array.isArray(data) ? data : [],
    };
  },

  async toggleBookmark(itemId: string, type: 'PROBLEM' | 'APTITUDE' | 'COMPANY' = 'PROBLEM'): Promise<ApiResponse<any>> {
    const res: any = await apiClient.post(API_ENDPOINTS.BOOKMARKS.TOGGLE(itemId), { type });
    return {
      statusCode: 200,
      message: 'Bookmark toggled',
      data: res?.data || { itemId, type, isBookmarked: true },
    };
  },
};
