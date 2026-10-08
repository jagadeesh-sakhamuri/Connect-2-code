import type { Problem } from '../types/domain';

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
  value: Record<string, unknown>,
  context: ProblemMappingContext = {}
): Problem => {
  const rawId = value.id ?? value._id ?? '';
  const topic =
    value.topicName ||
    value.topicRefName ||
    value.category ||
    value.topic ||
    context.fallbackTopic ||
    'General';
  const difficulty =
    value.difficultyName ||
    value.difficultyRefName ||
    value.difficulty ||
    value.level ||
    'Medium';

  return {
    id: String(rawId),
    title: String(value.title || value.name || ''),
    slug: String(value.slug || rawId),
    difficulty: String(difficulty),
    difficultyId:
      value.difficultyId !== undefined
        ? Number(value.difficultyId)
        : value.levelId !== undefined
        ? Number(value.levelId)
        : undefined,
    category: String(topic),
    topic: String(topic),
    topicId: value.topicId !== undefined ? Number(value.topicId) : undefined,
    companies: readCompanies(value.companies, context.fallbackCompany),
    acceptanceRate: String(value.acceptanceRate || '75%'),
    isSolved: !!value.isSolved,
    isBookmarked: !!value.isBookmarked,
    isOwnProblem: value.isOwnProblem !== undefined ? !!value.isOwnProblem : true,
    leetCodeUrl: value.leetCodeUrl ? String(value.leetCodeUrl) : undefined,
    gfgUrl: value.gfgUrl ? String(value.gfgUrl) : undefined,
    hackerRankUrl: value.hackerRankUrl ? String(value.hackerRankUrl) : undefined,
    description: value.description ? String(value.description) : '',
    constraints: value.constraints ? String(value.constraints) : undefined,
    difficultyRefName: value.difficultyRefName ? String(value.difficultyRefName) : undefined,
    difficultyRefCode: value.difficultyRefCode ? String(value.difficultyRefCode) : undefined,
    topicRefName: value.topicRefName ? String(value.topicRefName) : undefined,
    topicRefCode: value.topicRefCode ? String(value.topicRefCode) : undefined,
    qpfRefGroupCode: value.qpfRefGroupCode ? String(value.qpfRefGroupCode) : undefined,
    qpfRefCode: value.qpfRefCode ? String(value.qpfRefCode) : undefined,
    qpfRefName: value.qpfRefName ? String(value.qpfRefName) : undefined,
    examPlatform: value.examPlatform ? String(value.examPlatform) : undefined,
    questionHints: Array.isArray(value.questionHints) ? value.questionHints : undefined,
    hints: Array.isArray(value.hints) ? value.hints.map(String) : undefined,
    testCases: Array.isArray(value.testCases) ? value.testCases : undefined,
    codeSnippets:
      value.codeSnippets && typeof value.codeSnippets === 'object'
        ? (value.codeSnippets as Record<string, string>)
        : undefined,
    examples: Array.isArray(value.examples) ? value.examples : undefined,
  };
};
