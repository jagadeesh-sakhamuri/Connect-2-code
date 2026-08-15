import { apiClient } from '../core/api/apiClient';
import { API_ENDPOINTS } from '../core/api/endpoints';
import { mockDelay } from '../mock/mockAdapter';
import logicalData from '../mock/data/logical.json';
import { ApiResponse } from '../core/types/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const logicalService = {
  async getTopics(): Promise<ApiResponse<typeof logicalData>> {
    if (USE_MOCK) {
      return mockDelay(logicalData, 'Logical reasoning topics fetched');
    }
    return apiClient.get(API_ENDPOINTS.LOGICAL.LIST);
  },

  async getTopicBySlug(slug: string): Promise<ApiResponse<typeof logicalData[0] | null>> {
    if (USE_MOCK) {
      const topic = logicalData.find((t) => t.slug === slug || t.id === slug) || null;
      return mockDelay(topic, topic ? 'Logical reasoning topic fetched' : 'Topic not found');
    }
    return apiClient.get(API_ENDPOINTS.LOGICAL.TOPICS, { params: { slug } });
  },
};
