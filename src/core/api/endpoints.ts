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
    GENERATE_PASSWORD_RESET_OTP: '/auth/generatePasswordResetOtp',
    VERIFY_PASSWORD_RESET_OTP: '/auth/verifyPasswordResetOtp',
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
  USER: {
    PROFILE: '/user/profile',
    UPDATE: '/user/profile',
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
  },
  APTITUDE: {
    LIST: '/aptitude',
    TOPICS: '/aptitude/topics',
  },
  LOGICAL: {
    LIST: '/logical',
    TOPICS: '/logical/topics',
  },
  VERBAL: {
    LIST: '/verbal',
    TOPICS: '/verbal/topics',
  },
  INTERVIEW: {
    LIST: '/interviews',
    DETAILS: (id: string | number) => `/interviews/${id}`,
  },
} as const;
