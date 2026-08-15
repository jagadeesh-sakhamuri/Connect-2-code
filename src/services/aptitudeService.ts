import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { mockDelay } from '../mock/mockAdapter';
import aptitudeData from '../mock/data/aptitude.json';
import { ApiResponse } from '../core/types/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const aptitudeService = {
  async getTopics(): Promise<ApiResponse<typeof aptitudeData>> {
    if (USE_MOCK) {
      return mockDelay(aptitudeData, 'Aptitude topics fetched');
    }
    return apiClient.get(API_ENDPOINTS.APTITUDE.LIST);
  },

  async getTopicBySlug(slug: string): Promise<ApiResponse<typeof aptitudeData[0] | null>> {
    if (USE_MOCK) {
      const topic = aptitudeData.find((t) => t.slug === slug || t.id === slug) || null;
      return mockDelay(topic, topic ? 'Aptitude topic fetched' : 'Topic not found');
    }
    return apiClient.get(API_ENDPOINTS.APTITUDE.TOPICS, { params: { slug } });
  },
};
