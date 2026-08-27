/**
 * Centralized REST API Endpoint Constants
 * Maps directly to Java Spring Boot REST Controllers
 */
export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/signUp',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  REFERENCE: {
    GROUP: (refGroupCode: string) => `/referenceLibrary/refGroupCode/${refGroupCode}`,
  },
  COMPANY: {
    BASE: '/company',
    DETAILS: (id: string | number) => `/company/${id}`,
    PROBLEMS: (id: string | number) => `/company/${id}/problems`,
  },
  QUESTION: {
    BASE: '/question',
    DETAILS: (id: string | number) => `/question/${id}`,
    TEST_CASES: (id: string | number) => `/question/${id}/testCases`,
  },
  PROBLEMS: {
    LIST: '/questions',
    DETAILS: (id: string) => `/question/${id}`,
    SUBMIT: (id: string) => `/question/${id}/submit`,
    CATEGORIES: '/question/categories',
  },
  COMPANIES: {
    LIST: '/company',
    DETAILS: (id: string) => `/company/${id}`,
    PROBLEMS: (id: string) => `/company/${id}/problems`,
  },
  BOOKMARKS: {
    LIST: '/bookmarks',
    TOGGLE: (id: string) => `/bookmarks/toggle/${id}`,
  },
} as const;
