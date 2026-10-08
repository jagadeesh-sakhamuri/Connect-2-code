import type { Problem } from '../types/domain';

type ProblemDto = Record<string, unknown> | Problem;

interface ProblemMappingContext {
  fallbackCompany?: string;
  fallbackTopic?: string;
}

const readCompanies = (value: unknown, fallbackCompany?: string): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((company) => {
        if (typeof company === 'object' && company !== null) {
          const item = company as Record<string, unknown>;
          return String(item.name || item.companyName || '').trim();
        }
        return String(company).trim();
      })
      .filter(Boolean);
  }

  return fallbackCompany ? [fallbackCompany] : [];
};

export const mapProblemDto = (
  value: ProblemDto,
  context: ProblemMappingContext = {}
): Problem => {
  const rawValue = value as Record<string, unknown>;
  const rawId = rawValue.id ?? rawValue._id ?? '';
  const topic =
    rawValue.topicName ||
    rawValue.topicRefName ||
    rawValue.category ||
    rawValue.topic ||
    context.fallbackTopic ||
    '';
  const difficulty =
    rawValue.difficultyName ||
    rawValue.difficultyRefName ||
    rawValue.difficulty ||
    rawValue.level ||
    '';

  return {
    id: String(rawId),
    title: String(rawValue.title || rawValue.name || ''),
    slug: String(rawValue.slug || rawId),
    difficulty: String(difficulty),
    difficultyId:
      rawValue.difficultyId !== undefined
        ? Number(rawValue.difficultyId)
        : rawValue.levelId !== undefined
        ? Number(rawValue.levelId)
        : undefined,
    category: String(topic),
    topic: String(topic),
    topicId: rawValue.topicId !== undefined ? Number(rawValue.topicId) : undefined,
    companies: readCompanies(rawValue.companies, context.fallbackCompany),
    acceptanceRate:
      rawValue.acceptanceRate !== undefined && rawValue.acceptanceRate !== null
        ? String(rawValue.acceptanceRate)
        : '—',
    isSolved: !!rawValue.isSolved,
    isBookmarked: !!rawValue.isBookmarked,
    isOwnProblem:
      rawValue.isOwnProblem !== undefined ? !!rawValue.isOwnProblem : undefined,
    leetCodeUrl: rawValue.leetCodeUrl ? String(rawValue.leetCodeUrl) : undefined,
    gfgUrl: rawValue.gfgUrl ? String(rawValue.gfgUrl) : undefined,
    hackerRankUrl: rawValue.hackerRankUrl ? String(rawValue.hackerRankUrl) : undefined,
    description: rawValue.description ? String(rawValue.description) : '',
    constraints: rawValue.constraints ? String(rawValue.constraints) : undefined,
    difficultyRefName: rawValue.difficultyRefName ? String(rawValue.difficultyRefName) : undefined,
    difficultyRefCode: rawValue.difficultyRefCode ? String(rawValue.difficultyRefCode) : undefined,
    topicRefName: rawValue.topicRefName ? String(rawValue.topicRefName) : undefined,
    topicRefCode: rawValue.topicRefCode ? String(rawValue.topicRefCode) : undefined,
    qpfRefGroupCode: rawValue.qpfRefGroupCode ? String(rawValue.qpfRefGroupCode) : undefined,
    qpfRefCode: rawValue.qpfRefCode ? String(rawValue.qpfRefCode) : undefined,
    qpfRefName: rawValue.qpfRefName ? String(rawValue.qpfRefName) : undefined,
    examPlatform: rawValue.examPlatform ? String(rawValue.examPlatform) : undefined,
    questionHints: Array.isArray(rawValue.questionHints) ? rawValue.questionHints : undefined,
    hints: Array.isArray(rawValue.hints) ? rawValue.hints.map(String) : undefined,
    testCases: Array.isArray(rawValue.testCases) ? rawValue.testCases : undefined,
    codeSnippets:
      rawValue.codeSnippets && typeof rawValue.codeSnippets === 'object'
        ? (rawValue.codeSnippets as Record<string, string>)
        : undefined,
    examples: Array.isArray(rawValue.examples) ? rawValue.examples : undefined,
  };
};
