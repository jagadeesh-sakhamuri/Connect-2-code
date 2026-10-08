import type { ApiPage } from './api';

export interface ReferenceItem {
  id: number;
  refGroupCode: string;
  refCode: string;
  refName: string;
  isActive: boolean;
}

export interface Company {
  id?: string | number | null;
  name: string;
  slug?: string;
  logo?: string;
  logoUrl?: string;
  industry?: string;
  problemCount?: number;
  description?: string;
  website?: string;
  websiteUrl?: string;
  headquarters?: string;
  isActive?: boolean;
  difficultyBreakdown?: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  difficultyId?: number;
  category: string;
  topic: string;
  topicId?: number;
  companies: string[];
  acceptanceRate: string;
  isSolved: boolean;
  isBookmarked: boolean;
  isOwnProblem?: boolean;
  leetCodeUrl?: string;
  gfgUrl?: string;
  hackerRankUrl?: string;
  description?: string;
  constraints?: string;
  difficultyRefName?: string;
  difficultyRefCode?: string;
  topicRefName?: string;
  topicRefCode?: string;
  qpfRefGroupCode?: string;
  qpfRefCode?: string;
  qpfRefName?: string;
  examPlatform?: string;
  questionHints?: QuestionHint[];
  hints?: string[];
  testCases?: QuestionTestCase[];
  codeSnippets?: Record<string, string>;
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
}

export interface ProblemFilter {
  category?: string;
  topic?: number[] | string | number | null;
  difficulty?: number[] | string | number | null;
  level?: number[] | string | number | null;
  search?: string | null;
  searchText?: string | null;
  company?: number[] | string | number | null;
  companies?: number[] | string[] | null;
  page?: number;
  limit?: number;
}

export interface QuestionHint {
  id?: number | null;
  questionId?: number;
  hintText: string;
  displayOrder?: number;
}

export interface QuestionTestCase {
  id?: number;
  questionId?: number;
  input: string;
  expectedOutput: string;
  explanation: string;
  isHidden: boolean;
  displayOrder: number;
  typeRefGroupCode: string;
  typeRefCode: string;
  typeRefName?: string;
}

export interface Question {
  id?: number;
  title: string;
  description: string;
  constraints?: string;
  difficultyRefGroupCode: string;
  difficultyRefCode: string;
  difficultyRefName: string;
  topicRefGroupCode: string;
  topicRefCode: string;
  topicRefName: string;
  qpfRefGroupCode: string;
  qpfRefCode: string;
  qpfRefName: string;
  questionHints: QuestionHint[];
  companies: Company[];
  hackerRankUrl?: string;
  leetCodeUrl?: string;
  gfgUrl?: string;
  isOwnProblem?: boolean;
  isActive?: boolean;
  askedDate?: string | null;
  testCases?: QuestionTestCase[];
}

export interface QuestionListItem {
  id: number;
  title: string;
  description: string;
  difficultyId?: number;
  difficultyName?: string;
  topicId?: number;
  topicName?: string;
  isOwnProblem?: boolean;
  isActive?: boolean;
}

export interface PageRequest {
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
}

export interface QuestionListRequest {
  level: number[] | null;
  companies: number[] | null;
  topic: number[] | null;
  searchText: string | null;
  pageRequest: PageRequest;
}

export type QuestionPage = ApiPage<QuestionListItem>;

export interface Language {
  id: number;
  name: string;
  referenceId?: number;
  judge0LanguageId?: number;
  version?: string;
  languageName?: string;
  isActive?: boolean;
}

export interface AdminLanguage {
  id?: number;
  referenceId: number;
  languageName?: string;
  judge0LanguageId: number;
  version?: string;
  isActive?: boolean;
}

export interface UserProfile {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  collegeName?: string;
  graduationYear?: number | string;
  phone?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  leetcodeUrl?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface CodeExecutionPayload {
  questionId: number;
  languageId: number;
  sourceCode: string;
}

export interface ExecutionTestCaseResult {
  testCaseId: number;
  testCaseType: string;
  isHidden?: boolean | null;
  status: 'Passed' | 'Failed' | 'Compilation Error' | string;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
}

export interface ExecutionResult {
  totalTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
  runtimeMs?: number | string;
  memoryMb?: number | string;
  testCases: ExecutionTestCaseResult[];
}
