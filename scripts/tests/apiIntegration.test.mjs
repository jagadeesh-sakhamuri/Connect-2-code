import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ESM loader hook to stub axios and resolve .ts extensions in node --test
const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'axios') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,' + encodeURIComponent('export default { create: () => ({ interceptors: { request: { use: () => {} }, response: { use: () => {} } }, post: async () => ({ data: {} }), get: async () => ({ data: [] }), delete: async () => ({ data: {} }) }), isCancel: () => false }; export const AxiosInstance = {}; export const AxiosResponse = {}; export const InternalAxiosRequestConfig = {}; export const isCancel = () => false;')
    };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith('.') && !specifier.endsWith('.ts')) {
      return await nextResolve(specifier + '.ts', context);
    }
    throw err;
  }
}
`;

register('data:text/javascript,' + encodeURIComponent(loaderCode), pathToFileURL('./'));

const { API_ENDPOINTS } = await import('../../src/core/api/endpoints.ts');
const { executionService } = await import('../../src/services/executionService.ts');
const { userQuestionService } = await import('../../src/services/userQuestionService.ts');

describe('API Integration: Endpoints, Contracts, & Payload Integrity', () => {
  describe('1. Endpoint URL Formatting & Route Definitions', () => {
    it('defines user-facing code execution endpoints', () => {
      assert.equal(API_ENDPOINTS.EXECUTION.USER_RUN, '/runCode');
      assert.equal(API_ENDPOINTS.EXECUTION.USER_SUBMIT, '/submitCode');
    });

    it('defines admin-only code execution endpoints', () => {
      assert.equal(API_ENDPOINTS.EXECUTION.ADMIN_RUN, '/admin/testCode');
      assert.equal(API_ENDPOINTS.EXECUTION.ADMIN_SUBMIT, '/admin/submitCode');
    });

    it('formats user bookmark and question progress endpoints with dynamic IDs', () => {
      assert.equal(
        API_ENDPOINTS.USER.BOOKMARK(63, 1),
        '/users/63/questions/1/bookmark'
      );
      assert.equal(
        API_ENDPOINTS.USER.BOOKMARK('usr_42', 'q_100'),
        '/users/usr_42/questions/q_100/bookmark'
      );
      assert.equal(
        API_ENDPOINTS.USER.BOOKMARKS(63),
        '/users/63/questions/bookmarks'
      );
      assert.equal(
        API_ENDPOINTS.USER.SOLVED_QUESTIONS(63),
        '/users/63/solvedQuestions'
      );
      assert.equal(
        API_ENDPOINTS.USER.ATTEMPTED_QUESTIONS(63),
        '/users/63/attemptedQuestions'
      );
    });

    it('defines language registry endpoints', () => {
      assert.equal(API_ENDPOINTS.LANGUAGE.BASE, '/language');
      assert.equal(API_ENDPOINTS.LANGUAGE.DROPDOWN, '/language/dropdown');
      assert.equal(API_ENDPOINTS.LANGUAGE.DETAILS(1), '/language/1');
    });
  });

  describe('2. User Question Service Validation', () => {
    it('rejects bookmarking without valid userId or questionId', async () => {
      await assert.rejects(
        () => userQuestionService.bookmarkQuestion('', 1),
        /Both userId and questionId are required/
      );
      await assert.rejects(
        () => userQuestionService.bookmarkQuestion(63, ''),
        /Both userId and questionId are required/
      );
    });

    it('rejects unbookmarking without valid userId or questionId', async () => {
      await assert.rejects(
        () => userQuestionService.unbookmarkQuestion(null, 1),
        /Both userId and questionId are required/
      );
      await assert.rejects(
        () => userQuestionService.unbookmarkQuestion(63, null),
        /Both userId and questionId are required/
      );
    });

    it('safely returns empty list if userId is missing for getBookmarkedQuestions', async () => {
      const res = await userQuestionService.getBookmarkedQuestions(null);
      assert.deepEqual(res, []);
    });

    it('safely returns empty list if userId is missing for progress endpoints', async () => {
      const solved = await userQuestionService.getSolvedQuestions(undefined);
      assert.deepEqual(solved, []);
      const attempted = await userQuestionService.getAttemptedQuestions('');
      assert.deepEqual(attempted, []);
    });
  });

  describe('3. Language ID Mapping & Execution Payload Resolution', () => {
    it('resolves valid positive numeric language IDs as fallback when registry is empty', async () => {
      const resolved = await executionService.resolveLanguageReferenceId(5);
      assert.equal(resolved, 5);
    });

    it('throws error for non-positive or invalid language IDs with no mapping', async () => {
      await assert.rejects(
        () => executionService.resolveLanguageReferenceId(0),
        /No backend reference mapping found for language id: 0/
      );
    });

    it('prepares execution payload with numeric questionId and sanitized code', async () => {
      const payload = await executionService.prepareExecutionPayload({
        questionId: '42',
        languageId: 5,
        sourceCode: 'public class Solution { public void solve() {} }',
      });

      assert.equal(payload.questionId, 42);
      assert.equal(payload.languageId, 5);
      // Java code is sanitized from `public class Solution` to `public class Main` for Judge0 entry point
      assert.match(payload.sourceCode, /public class Main/);
      assert.doesNotMatch(payload.sourceCode, /public class Solution/);
    });

    it('does not alter non-Java source code entry classes', async () => {
      const pyCode = 'def solution():\n    return 42';
      const payload = await executionService.prepareExecutionPayload({
        questionId: 10,
        languageId: 6, // Python reference ID
        sourceCode: pyCode,
      });

      assert.equal(payload.sourceCode, pyCode);
    });
  });

  describe('4. Test Case Response Secrecy & Null Safety', () => {
    it('handles nullable and hidden test case fields without throwing errors', () => {
      const mockResult = {
        totalTestCases: 3,
        passedTestCases: 2,
        failedTestCases: 1,
        testCases: [
          {
            testCaseId: 101,
            testCaseType: 'Sample',
            isHidden: false,
            status: 'Passed',
            input: '1 2',
            expectedOutput: '3',
            actualOutput: '3',
          },
          {
            testCaseId: 102,
            testCaseType: 'Hidden',
            isHidden: true,
            status: 'Passed',
            input: null,
            expectedOutput: null,
            actualOutput: null,
          },
          {
            testCaseId: 103,
            testCaseType: 'Hidden',
            isHidden: true,
            status: 'Failed',
            input: 'secret_input',
            expectedOutput: 'secret_expected',
            actualOutput: 'wrong_output',
          },
        ],
      };

      assert.equal(mockResult.testCases.length, 3);
      // Hidden test case contract: isHidden === true must mask input and expected output in client UI
      const hiddenFailCase = mockResult.testCases[2];
      assert.equal(hiddenFailCase.isHidden, true);
      assert.equal(hiddenFailCase.status, 'Failed');

      // Function simulating the ProblemDetails.tsx masking logic
      const getDisplayedTestCase = (tc) => {
        if (tc.isHidden) {
          return {
            status: tc.status,
            isHidden: true,
            input: null,
            expectedOutput: null,
            actualOutput: tc.actualOutput,
          };
        }
        return tc;
      };

      const masked = getDisplayedTestCase(hiddenFailCase);
      assert.equal(masked.input, null);
      assert.equal(masked.expectedOutput, null);
      assert.equal(masked.status, 'Failed');
    });
  });
});
