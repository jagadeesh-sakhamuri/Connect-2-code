import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { mockDelay } from '../mock/mockAdapter';
import verbalData from '../mock/data/verbal.json';
import { ApiResponse } from '../core/types/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const verbalService = {
  async getTopics(): Promise<ApiResponse<typeof verbalData>> {
    if (USE_MOCK) {
      return mockDelay(verbalData, 'Verbal ability topics fetched');
    }
    return apiClient.get(API_ENDPOINTS.VERBAL.LIST);
  },

  async getTopicBySlug(slug: string): Promise<ApiResponse<typeof verbalData[0] | null>> {
    if (USE_MOCK) {
      const topic = verbalData.find((t) => t.slug === slug || t.id === slug) || null;
      return mockDelay(topic, topic ? 'Verbal topic fetched' : 'Topic not found');
    }
    return apiClient.get(API_ENDPOINTS.VERBAL.TOPICS, { params: { slug } });
  },
};
