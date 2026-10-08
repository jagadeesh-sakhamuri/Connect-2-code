import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { toggleBookmarkItem, fetchBookmarks } from '../../bookmarks/redux/bookmarkSlice';
import { fetchProblemById } from '../redux/problemSlice';
import { markSolvedProblem } from '../../progress/redux/progressSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { fetchLanguages } from '../../languages/redux/languageSlice';
import type { Problem } from '../../../core/types/domain';
import {
  executionService,
  LanguageDropdownItem,
  ExecutionResultData,
} from '../../../services/executionService';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { toast } from 'react-hot-toast';
import { userScopedStorage } from '../../../core/storage/userScopedStorage';

interface QuestionTestCase {
  id?: number;
  testCaseId?: number;
  input: string;
  expectedOutput: string;
  explanation?: string;
  isHidden?: boolean;
  typeRefName?: string;
  typeRefCode?: string;
  displayOrder?: number;
}

interface SubmissionRecord {
  id: string;
  status: 'Accepted' | 'Wrong Answer';
  passedTestCases: number;
  totalTestCases: number;
  runtimeMs?: number | string;
  memoryMb?: number | string;
  language: string;
  timestamp: string;
}

interface EditorialApproach {
  intuition: string;
  bruteForce: {
    title: string;
    description: string;
    timeComplexity: string;
    spaceComplexity: string;
  };
  optimal: {
    title: string;
    description: string;
    timeComplexity: string;
    spaceComplexity: string;
    pseudocode?: string;
  };
  tips: string[];
}

const DEFAULT_STARTER_CODE: Record<string, string> = {
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
        
    }
}`,
  python: `import sys

def main():
    # Read standard input
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    # Write your solution here
    

if __name__ == '__main__':
    main()
`,
  cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}
`,
  javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;
    // Write your solution here
    
}

solve();
`,
};

/**
 * Editorial generator providing takeUforward/LeetCode style DSA breakdowns
 */
function getProblemEditorial(p: Problem | null): EditorialApproach {
  const title = (p?.title || '').toLowerCase();
  const topic = (p?.topicRefName || p?.topic || '').toLowerCase();

  if (title.includes('largest') && !title.includes('second')) {
    return {
      intuition:
        'To find the maximum element in an unsorted array, we examine each element sequentially while maintaining a running maximum value.',
      bruteForce: {
        title: 'Sorting Approach',
        description: 'Sort the entire array in ascending order and return the element at the last index (n - 1).',
        timeComplexity: 'O(N log N)',
        spaceComplexity: 'O(1)',
      },
      optimal: {
        title: 'Single-Pass Linear Scan',
        description:
          'Initialize a variable `maxVal` with the first element `arr[0]`. Iterate through indices 1 to n - 1, updating `maxVal = max(maxVal, arr[i])`.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        pseudocode: `int maxVal = arr[0];
for (int i = 1; i < n; i++) {
    if (arr[i] > maxVal) {
        maxVal = arr[i];
    }
}
return maxVal;`,
      },
      tips: [
        'Always initialize with arr[0] or Integer.MIN_VALUE instead of 0 to support arrays containing only negative integers.',
        'Single element arrays (n = 1) should instantly return arr[0].',
      ],
    };
  }

  if (title.includes('second largest')) {
    return {
      intuition:
        'We need the greatest value that is strictly less than the array maximum. Tracking two running variables lets us accomplish this in a single scan.',
      bruteForce: {
        title: 'Two-Pass Scan / Sorting',
        description:
          'Sort the array (O(N log N)) or find the maximum in pass 1, then find the greatest element strictly smaller than max in pass 2.',
        timeComplexity: 'O(N log N) or O(2N)',
        spaceComplexity: 'O(1)',
      },
      optimal: {
        title: 'Single-Pass Dual Variable Tracking',
        description:
          'Maintain `largest = -1` and `secondLargest = -1`. For each element, update both variables conditionally when a strictly larger value appears.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        pseudocode: `int largest = arr[0], second = -1;
for (int i = 1; i < n; i++) {
    if (arr[i] > largest) {
        second = largest;
        largest = arr[i];
    } else if (arr[i] < largest && arr[i] > second) {
        second = arr[i];
    }
}
return second;`,
      },
      tips: [
        'If all elements in the array are identical (e.g., [10, 10, 10]), return -1 as no second largest exists.',
        'Beware of duplicate maximums.',
      ],
    };
  }

  if (title.includes('reverse') && title.includes('array')) {
    return {
      intuition:
        'Reversing an array is equivalent to swapping symmetrical elements moving from both boundary ends inward toward the center.',
      bruteForce: {
        title: 'Auxiliary Array Method',
        description:
          'Allocate a new array of size N. Iterate the original array backwards from n - 1 to 0 and insert into the auxiliary array.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
      },
      optimal: {
        title: 'Two-Pointers In-Place Swap',
        description:
          'Place `left = 0` and `right = n - 1`. While `left < right`, swap `arr[left]` and `arr[right]`, then advance `left++` and decrement `right--`.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        pseudocode: `int left = 0, right = n - 1;
while (left < right) {
    swap(arr[left], arr[right]);
    left++;
    right--;
}`,
      },
      tips: [
        'Loop condition must be `left < right` (not `left <= right`) to avoid redundant self-swaps.',
        'This in-place algorithm uses zero extra memory.',
      ],
    };
  }

  if (title.includes('two sum') || title.includes('sum')) {
    return {
      intuition:
        'For any element X, the required complement to reach the target is (target - X). A hash table allows O(1) existence checks.',
      bruteForce: {
        title: 'Nested Loops',
        description: 'Iterate over all pairs (i, j) with i < j and check if arr[i] + arr[j] == target.',
        timeComplexity: 'O(N²)',
        spaceComplexity: 'O(1)',
      },
      optimal: {
        title: 'Hash Map Lookup',
        description:
          'Maintain a hash map of value to index. As you iterate each number, check if (target - arr[i]) exists in the map.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        pseudocode: `Map<Integer, Integer> map = new HashMap<>();
for (int i = 0; i < n; i++) {
    int complement = target - arr[i];
    if (map.containsKey(complement)) {
        return new int[]{map.get(complement), i};
    }
    map.put(arr[i], i);
}`,
      },
      tips: [
        'The same element cannot be used twice.',
        'Hash map average lookup time is O(1), making this optimal for large arrays.',
      ],
    };
  }

  // General algorithmic fallback based on topic
  return {
    intuition: `Break down the problem into smaller invariant subproblems. For ${topic || 'algorithms'}, determine the optimal data structure that satisfies the runtime constraints.`,
    bruteForce: {
      title: 'Exhaustive Search / Simulation',
      description: 'Explore all possible combinations or simulate step-by-step.',
      timeComplexity: 'O(N²) or O(2^N)',
      spaceComplexity: 'O(1)',
    },
    optimal: {
      title: 'Optimized Algorithmic Approach',
      description:
        'Leverage two pointers, hash mapping, binary search, or dynamic programming to avoid redundant computation.',
      timeComplexity: 'O(N) or O(N log N)',
      spaceComplexity: 'O(1) to O(N)',
      pseudocode: `// Process input efficiently
// Maintain state invariants
// Handle boundary and null inputs early`,
    },
    tips: [
      'Analyze the constraints: N <= 10^5 indicates an O(N) or O(N log N) algorithm is required.',
      'Check edge cases: empty input, single element, negative numbers, or duplicates.',
    ],
  };
}

export const ProblemDetails: React.FC = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const navigate = useNavigate();
  const questionIdParam = id || slug || '1';
  const numericQuestionId = Number(questionIdParam) || 1;

  const dispatch = useAppDispatch();
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const userRole = user?.role?.toUpperCase();
  const isAdmin = isAuthenticated && (userRole === 'ADMIN' || userRole === 'ROLE_ADMIN');

  // Server state owned by Redux; only editor/execution/UI state stays local.
  const { selectedProblem: problem, loading: loadingProblem } = useAppSelector((state) => state.problems);
  const { languages: serverLanguages, loading: loadingLanguages } = useAppSelector((state) => state.languages);

  const languages = serverLanguages;

  const [selectedLanguage, setSelectedLanguage] = useState<LanguageDropdownItem | null>(null);

  // Editor State
  const [codeByLang, setCodeByLang] = useState<Record<number, string>>({});
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Execution State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionType, setExecutionType] = useState<'run' | 'submit' | null>(null);
  const [lastExecutionMode, setLastExecutionMode] = useState<'run' | 'submit' | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResultData | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState<number>(0);

  // Console layout state: 'normal' | 'collapsed' | 'expanded'
  const [consoleHeight, setConsoleHeight] = useState<'normal' | 'collapsed' | 'expanded'>('normal');

  // Active Tabs
  const [leftTab, setLeftTab] = useState<'description' | 'editorial' | 'submissions' | 'companies' | 'hints'>('description');
  const [bottomTab, setBottomTab] = useState<'testcases' | 'results'>('testcases');

  // Submissions history for this session / problem
  const [submissionsHistory, setSubmissionsHistory] = useState<SubmissionRecord[]>(() => {
    try {
      const saved = userScopedStorage.getItem(`submissions_${numericQuestionId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Map language name to Monaco language
  const monacoLang = useMemo(() => {
    const name = selectedLanguage?.name.toLowerCase() || '';
    if (name.includes('python')) return 'python';
    if (name.includes('c++') || name.includes('cpp')) return 'cpp';
    if (name.includes('javascript') || name.includes('js')) return 'javascript';
    return selectedLanguage ? 'java' : 'plaintext';
  }, [selectedLanguage]);

  // Current active code in editor
  const currentCode = useMemo(() => {
    if (!selectedLanguage) return '';
    if (codeByLang[selectedLanguage.id] !== undefined) {
      return codeByLang[selectedLanguage.id];
    }
    return DEFAULT_STARTER_CODE[monacoLang] || DEFAULT_STARTER_CODE.java;
  }, [codeByLang, selectedLanguage, monacoLang]);

  // Load shared server state once; Redux owns both resources.
  useEffect(() => {
    dispatch(fetchLanguages());
  }, [dispatch]);

  useEffect(() => {
    const request = dispatch(fetchProblemById(questionIdParam));
    return () => {
      request.abort();
    };
  }, [dispatch, questionIdParam]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchBookmarks());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (serverLanguages.length > 0) {
      setSelectedLanguage((prev) => {
        const found = serverLanguages.find(
          (language) =>
            prev &&
            (language.id === prev.id || language.referenceId === prev.referenceId)
        );
        return found || serverLanguages[0];
      });
    }
  }, [serverLanguages]);

  // Sync title
  useEffect(() => {
    if (problem?.title) {
      document.title = `${problem.title} | Connect 2 Code`;
    }
  }, [problem?.title]);

  // Handle Editor Code Change
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (!selectedLanguage) return;
      const newCode = value || '';
      setCodeByLang((prev) => ({
        ...prev,
        [selectedLanguage.id]: newCode,
      }));
    },
    [selectedLanguage?.id]
  );

  // Handle Language Dropdown Change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLangId = Number(e.target.value);
    const targetLang = languages.find((l) => l.id === newLangId);
    if (targetLang) {
      setSelectedLanguage(targetLang);
      const newMonacoLang = targetLang.name.toLowerCase().includes('python')
        ? 'python'
        : targetLang.name.toLowerCase().includes('c++')
        ? 'cpp'
        : targetLang.name.toLowerCase().includes('javascript')
        ? 'javascript'
        : 'java';

      setCodeByLang((prev) => {
        if (prev[targetLang.id] === undefined) {
          return {
            ...prev,
            [targetLang.id]: DEFAULT_STARTER_CODE[newMonacoLang] || DEFAULT_STARTER_CODE.java,
          };
        }
        return prev;
      });
    }
  };

  // Reset Code
  const handleResetCode = () => {
    if (!selectedLanguage) return;
    const template = DEFAULT_STARTER_CODE[monacoLang] || DEFAULT_STARTER_CODE.java;
    setCodeByLang((prev) => ({
      ...prev,
      [selectedLanguage.id]: template,
    }));
    toast.success('Code reset to default starter template');
  };

  // Copy Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopiedCode(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Bookmark Status
  const isBookmarked = useMemo(() => {
    if (!problem) return false;
    return bookmarks.some((b) => String(b.itemId) === String(problem.id));
  }, [problem, bookmarks]);

  const handleBookmarkToggle = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to bookmark questions');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }
    if (problem) {
      dispatch(
        toggleBookmarkItem({
          itemId: String(problem.id),
          type: 'PROBLEM',
          title: problem.title,
          difficulty: problem.difficultyRefName || problem.difficulty || 'Medium',
          category: problem.topicRefName || problem.topic || 'DSA',
        })
      );
      toast.success(isBookmarked ? 'Bookmark removed' : 'Problem bookmarked!');
    }
  };

  // RUN CODE (Visible Sample Test Cases only)
  const handleRunCode = useCallback(async () => {
    if (isExecuting || !selectedLanguage) {
      if (!selectedLanguage) {
        toast.error('No supported execution language is available');
      }
      return;
    }

    setIsExecuting(true);
    setExecutionType('run');
    setLastExecutionMode('run');
    setExecutionError(null);
    setBottomTab('results');
    if (consoleHeight === 'collapsed') setConsoleHeight('normal');

    const payload = {
      questionId: numericQuestionId,
      languageId: selectedLanguage.referenceId || selectedLanguage.id,
      sourceCode: currentCode,
    };

    try {
      let result: ExecutionResultData;
      if (isAdmin) {
        result = await executionService.adminTestCode(payload);
        toast.success('Admin: Sample test code executed');
      } else {
        result = await executionService.runCode(payload);
        if (result.failedTestCases === 0 && result.passedTestCases > 0) {
          toast.success('Sample test cases passed!');
        } else {
          toast.error(`${result.failedTestCases} sample case(s) failed`);
        }
      }
      setExecutionResult(result);
      setSelectedTestCaseIdx(0);
    } catch (err: any) {
      const msg = err?.message || (err?.errors && err.errors[0]) || 'Failed to execute code';
      setExecutionError(msg);
      toast.error(msg);
    } finally {
      setIsExecuting(false);
      setExecutionType(null);
    }
  }, [isExecuting, numericQuestionId, selectedLanguage, currentCode, isAdmin, consoleHeight]);

  // SUBMIT CODE (Evaluation across all test cases - TEST CASES ARE HIDDEN)
  const handleSubmitCode = useCallback(async () => {
    if (isExecuting || !selectedLanguage) {
      if (!selectedLanguage) {
        toast.error('No supported execution language is available');
      }
      return;
    }

    setIsExecuting(true);
    setExecutionType('submit');
    setLastExecutionMode('submit');
    setExecutionError(null);
    setBottomTab('results');
    if (consoleHeight === 'collapsed') setConsoleHeight('normal');

    const payload = {
      questionId: numericQuestionId,
      languageId: selectedLanguage.referenceId || selectedLanguage.id,
      sourceCode: currentCode,
    };

    try {
      let result: ExecutionResultData;
      if (isAdmin) {
        result = await executionService.adminSubmitCode(payload);
        toast.success('Admin: Code evaluated successfully');
      } else {
        result = await executionService.submitCode(payload);
        if (result.failedTestCases === 0 && result.passedTestCases > 0) {
          toast.success('Accepted! All test cases passed!');
          dispatch(markSolvedProblem({ id: String(numericQuestionId) }));
        } else {
          toast.error(`Submission: ${result.failedTestCases} test case(s) failed`);
        }
      }
      setExecutionResult(result);

      // Record in Session Submissions History
      const isAccepted = result.failedTestCases === 0 && result.passedTestCases > 0;
      const newRecord: SubmissionRecord = {
        id: `sub_${Date.now()}`,
        status: isAccepted ? 'Accepted' : 'Wrong Answer',
        passedTestCases: result.passedTestCases,
        totalTestCases: result.totalTestCases,
        runtimeMs: result.runtimeMs,
        memoryMb: result.memoryMb,
        language: selectedLanguage.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSubmissionsHistory((prev) => {
        const updated = [newRecord, ...prev].slice(0, 10);
        try {
          userScopedStorage.setItem(`submissions_${numericQuestionId}`, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    } catch (err: any) {
      const msg = err?.message || (err?.errors && err.errors[0]) || 'Failed to submit code';
      setExecutionError(msg);
      toast.error(msg);
    } finally {
      setIsExecuting(false);
      setExecutionType(null);
    }
  }, [isExecuting, numericQuestionId, selectedLanguage, currentCode, isAdmin, consoleHeight, dispatch]);

  // Keyboard Shortcuts (Ctrl+' or Cmd+' to Run, Ctrl+Enter or Cmd+Enter to Submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "'") {
        e.preventDefault();
        handleRunCode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRunCode, handleSubmitCode]);

  // Difficulty badge styling
  const difficultyName = problem?.difficultyRefName || problem?.difficulty || '—';
  const difficultyBadgeStyle =
    difficultyName.toLowerCase() === 'basic'
      ? 'text-teal-400 bg-teal-500/10 border-teal-500/30'
      : difficultyName.toLowerCase() === 'easy'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : difficultyName.toLowerCase() === 'medium'
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

  // Sample visible test cases from problem statement
  const sampleTestCases: QuestionTestCase[] = useMemo(() => {
    if (problem?.testCases && problem.testCases.length > 0) {
      return problem.testCases.filter((tc) => !tc.isHidden);
    }
    if (problem?.examples && problem.examples.length > 0) {
      return problem.examples.map((ex, i) => ({
        id: i + 1,
        input: ex.input,
        expectedOutput: ex.output,
        explanation: ex.explanation,
        isHidden: false,
      }));
    }
    return [];
  }, [problem]);

  const editorial = useMemo(() => getProblemEditorial(problem), [problem]);

  if (loadingProblem) {
    return (
      <div className="w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 font-sans">
        <Skeleton className="h-10 w-80 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[740px]">
          <Skeleton className="lg:col-span-5 h-full rounded-2xl" />
          <Skeleton className="lg:col-span-7 h-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const activeSampleCase = sampleTestCases[selectedTestCaseIdx];
  const activeRunCase = executionResult?.testCases?.[selectedTestCaseIdx];

  return (
    <div className={`w-full flex-1 flex flex-col px-3 sm:px-5 lg:px-6 py-3 max-w-[1750px] mx-auto font-sans text-gray-200 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0e0f11] p-3' : ''}`}>
      
      {/* 1. TOP NAVBAR / WORKSPACE TOOLBAR (LeetCode / CodeChef Style) */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 mb-3 bg-[#18191c] border border-white/10 rounded-xl shadow-lg">
        
        {/* Left: Breadcrumbs, Problem Title & Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/practice"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-[#A3E635] bg-[#222428] border border-white/10 hover:border-[#A3E635]/40 px-3 py-1.5 rounded-lg transition-all shadow-xs"
            title="Back to All Problems"
          >
            <i className="fa-solid fa-chevron-left text-[11px] text-[#A3E635]"></i>
            <span>Problems</span>
          </Link>

          {/* Prev / Next Question Navigation */}
          <div className="flex items-center bg-[#222428] border border-white/10 rounded-lg overflow-hidden">
            <button
              onClick={() => numericQuestionId > 1 && navigate(`/problems/${numericQuestionId - 1}`)}
              disabled={numericQuestionId <= 1}
              className="px-2 py-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors cursor-pointer"
              title="Previous Problem"
            >
              <i className="fa-solid fa-angle-left text-xs"></i>
            </button>
            <span className="text-[11px] font-mono text-gray-500 px-1 border-x border-white/5">
              #{numericQuestionId}
            </span>
            <button
              onClick={() => numericQuestionId < 22 && navigate(`/problems/${numericQuestionId + 1}`)}
              disabled={numericQuestionId >= 22}
              className="px-2 py-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors cursor-pointer"
              title="Next Problem"
            >
              <i className="fa-solid fa-angle-right text-xs"></i>
            </button>
          </div>

          <h1 className="text-sm sm:text-base font-heading font-bold text-white tracking-tight truncate max-w-xs sm:max-w-md">
            {problem?.title || 'Problem'}
          </h1>

          {/* Difficulty Badge */}
          <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md border shadow-xs ${difficultyBadgeStyle}`}>
            {difficultyName}
          </span>

          {/* Topic Badge */}
          {(problem?.topicRefName || problem?.topic) && (
            <span className="text-[11px] font-sans font-medium px-2.5 py-0.5 rounded-md bg-[#222428] border border-white/10 text-gray-300 hidden md:inline">
              {problem.topicRefName || problem.topic}
            </span>
          )}

          {/* ADMIN Indicator */}
          {isAdmin && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/40 text-purple-300 font-bold">
              <i className="fa-solid fa-shield-halved text-[10px]"></i>
              <span>ADMIN</span>
            </span>
          )}
        </div>

        {/* Right: Quick Actions & Primary Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Bookmark Button */}
          <button
            onClick={handleBookmarkToggle}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-[#222428] border-white/10 text-gray-400 hover:text-amber-400'
            }`}
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
          >
            <i className={`fa-${isBookmarked ? 'solid' : 'regular'} fa-star text-xs`}></i>
          </button>

          {/* RUN CODE BUTTON */}
          <button
            onClick={handleRunCode}
            disabled={isExecuting}
            className="px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold bg-[#222428] hover:bg-white/10 text-white border border-white/15 transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            title="Run against Sample Test Cases (Ctrl + ')"
          >
            {isExecuting && executionType === 'run' ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin text-[#A3E635]"></i>
                <span>Running...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-play text-[#A3E635] text-[11px]"></i>
                <span>Run</span>
                <span className="text-[10px] text-gray-500 hidden sm:inline font-sans">Ctrl + '</span>
              </>
            )}
          </button>

          {/* SUBMIT CODE BUTTON */}
          <button
            onClick={handleSubmitCode}
            disabled={isExecuting}
            className="px-4 py-1.5 rounded-lg font-mono text-xs font-bold bg-[#A3E635] hover:bg-[#b0f53c] text-black transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
            title="Submit solution for grading (Ctrl + Enter)"
          >
            {isExecuting && executionType === 'submit' ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-cloud-arrow-up text-[11px]"></i>
                <span>Submit</span>
                <span className="text-[10px] text-black/70 hidden sm:inline font-sans">Ctrl + ↵</span>
              </>
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-2 rounded-lg bg-[#222428] border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer hidden md:block"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Editor'}
          >
            <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-xs`}></i>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE (2-COLUMN SPLIT PANE) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 items-start">
        
        {/* ========================================================
            LEFT COLUMN: PROBLEM SPECIFICATION & DETAILS TABS (5 COLS)
           ======================================================== */}
        <div className="lg:col-span-5 flex flex-col bg-[#18191c] border border-white/10 rounded-xl shadow-xl h-[780px] overflow-hidden">
          
          {/* Tab Bar: Description | Editorial | Submissions | Companies | Hints */}
          <div className="flex items-center border-b border-white/10 bg-[#141517] px-2 py-1.5 overflow-x-auto no-scrollbar gap-1">
            <button
              onClick={() => setLeftTab('description')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                leftTab === 'description'
                  ? 'bg-[#222428] text-white shadow-xs border border-white/15'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <i className="fa-solid fa-file-lines text-xs text-[#A3E635]"></i>
              <span>Description</span>
            </button>

            <button
              onClick={() => setLeftTab('editorial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                leftTab === 'editorial'
                  ? 'bg-[#222428] text-white shadow-xs border border-white/15'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <i className="fa-solid fa-lightbulb text-xs text-amber-400"></i>
              <span>Editorial</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold">Approach</span>
            </button>

            <button
              onClick={() => setLeftTab('submissions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                leftTab === 'submissions'
                  ? 'bg-[#222428] text-white shadow-xs border border-white/15'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <i className="fa-solid fa-clock-rotate-left text-xs text-sky-400"></i>
              <span>Submissions</span>
              {submissionsHistory.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-white font-bold">
                  {submissionsHistory.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setLeftTab('companies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                leftTab === 'companies'
                  ? 'bg-[#222428] text-white shadow-xs border border-white/15'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <i className="fa-solid fa-building text-xs text-indigo-400"></i>
              <span>Companies</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-gray-300">
                {problem?.companies?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setLeftTab('hints')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                leftTab === 'hints'
                  ? 'bg-[#222428] text-white shadow-xs border border-white/15'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <i className="fa-solid fa-key text-xs text-emerald-400"></i>
              <span>Hints</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-gray-300">
                {problem?.questionHints?.length || problem?.hints?.length || 0}
              </span>
            </button>
          </div>

          {/* Left Panel Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-sm leading-relaxed text-gray-300">
            
            {/* 1. DESCRIPTION TAB */}
            {leftTab === 'description' && (
              <div className="space-y-5">
                {/* Topic & Exam Platform Chips */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  {(problem?.topicRefName || problem?.topic) && (
                    <span className="px-2.5 py-1 bg-[#121113] border border-white/10 rounded-lg text-gray-300">
                      Topic: <strong className="text-white">{problem.topicRefName || problem.topic}</strong>
                    </span>
                  )}
                  {problem?.qpfRefName && (
                    <span className="px-2.5 py-1 bg-[#121113] border border-white/10 rounded-lg text-[#A3E635]">
                      Platform: <strong>{problem.qpfRefName}</strong>
                    </span>
                  )}
                </div>

                {/* Problem Statement Body */}
                <div>
                  <h3 className="text-xs uppercase font-mono font-bold text-gray-400 tracking-wider mb-2">
                    Problem Statement
                  </h3>
                  <div className="p-4 bg-[#121113] border border-white/10 rounded-xl text-gray-200 whitespace-pre-line leading-relaxed font-sans text-sm">
                    {problem?.description || 'No problem description is available from the backend.'}
                  </div>
                </div>

                {/* Examples */}
                <div>
                  <h3 className="text-xs uppercase font-mono font-bold text-gray-400 tracking-wider mb-2">
                    Examples
                  </h3>
                  {sampleTestCases.length > 0 ? (
                    <div className="space-y-3">
                      {sampleTestCases.map((tc, idx) => (
                        <div key={idx} className="p-3.5 bg-[#121113] border border-white/10 rounded-xl space-y-2 font-mono text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[#A3E635] font-bold">Example {idx + 1}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(tc.input);
                                toast.success('Input copied!');
                              }}
                              className="text-gray-500 hover:text-white transition-colors text-[10px] cursor-pointer flex items-center gap-1"
                            >
                              <i className="fa-solid fa-copy"></i>
                              <span>Copy</span>
                            </button>
                          </div>
                          <div>
                            <span className="text-gray-400">Input: </span>
                            <span className="text-white whitespace-pre-wrap">{tc.input}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Output: </span>
                            <span className="text-[#A3E635] font-bold whitespace-pre-wrap">{tc.expectedOutput}</span>
                          </div>
                          {tc.explanation && (
                            <div className="pt-1.5 border-t border-white/5 text-gray-400 text-[11px] font-sans">
                              <span className="font-mono text-gray-500">Explanation: </span>
                              {tc.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="p-4 bg-[#121113] border border-white/10 rounded-xl text-xs text-gray-500">
                      No visible examples were returned for this problem.
                    </p>
                  )}
                </div>

                {/* Constraints */}
                {problem?.constraints && (
                  <div>
                    <h3 className="text-xs uppercase font-mono font-bold text-gray-400 tracking-wider mb-2">
                      Constraints
                    </h3>
                    <div className="p-3 bg-[#121113] border border-white/10 rounded-xl text-xs font-mono text-gray-300 whitespace-pre-line">
                      {problem.constraints}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. EDITORIAL TAB (takeUforward Style) */}
            {leftTab === 'editorial' && (
              <div className="space-y-5 animate-fade-in">
                {/* Intuition Card */}
                <div className="p-4 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
                    <i className="fa-solid fa-lightbulb"></i>
                    <span>Core Intuition</span>
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed font-sans">
                    {editorial.intuition}
                  </p>
                </div>

                {/* Approach 1: Brute Force */}
                <div className="p-4 bg-[#121113] border border-white/10 rounded-xl space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-white font-bold">{editorial.bruteForce.title}</span>
                    <span className="text-[10px] text-gray-400">Sub-optimal</span>
                  </div>
                  <p className="text-gray-300 font-sans leading-relaxed text-xs">
                    {editorial.bruteForce.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 bg-[#1a1b1e] rounded-lg">
                      <span className="text-gray-500 text-[10px] block">Time Complexity</span>
                      <span className="text-amber-400 font-bold">{editorial.bruteForce.timeComplexity}</span>
                    </div>
                    <div className="p-2 bg-[#1a1b1e] rounded-lg">
                      <span className="text-gray-500 text-[10px] block">Space Complexity</span>
                      <span className="text-emerald-400 font-bold">{editorial.bruteForce.spaceComplexity}</span>
                    </div>
                  </div>
                </div>

                {/* Approach 2: Optimal */}
                <div className="p-4 bg-[#121113] border border-[#A3E635]/30 rounded-xl space-y-3 font-mono text-xs shadow-md">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-[#A3E635] font-bold flex items-center gap-1.5">
                      <i className="fa-solid fa-bolt"></i>
                      <span>{editorial.optimal.title}</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#A3E635]/20 text-[#A3E635] font-bold">
                      Recommended
                    </span>
                  </div>
                  <p className="text-gray-200 font-sans leading-relaxed text-xs">
                    {editorial.optimal.description}
                  </p>
                  {editorial.optimal.pseudocode && (
                    <pre className="p-3 bg-[#0a0a0c] border border-white/10 rounded-lg text-gray-300 overflow-x-auto text-[11px] leading-relaxed">
                      {editorial.optimal.pseudocode}
                    </pre>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 bg-[#1a1b1e] rounded-lg">
                      <span className="text-gray-500 text-[10px] block">Time Complexity</span>
                      <span className="text-[#A3E635] font-bold">{editorial.optimal.timeComplexity}</span>
                    </div>
                    <div className="p-2 bg-[#1a1b1e] rounded-lg">
                      <span className="text-gray-500 text-[10px] block">Space Complexity</span>
                      <span className="text-emerald-400 font-bold">{editorial.optimal.spaceComplexity}</span>
                    </div>
                  </div>
                </div>

                {/* Practical Tips */}
                {editorial.tips && editorial.tips.length > 0 && (
                  <div className="p-4 bg-[#121113] border border-white/10 rounded-xl space-y-2 text-xs">
                    <div className="text-gray-400 font-mono font-bold uppercase tracking-wider text-[11px]">
                      Key Takeaways & Edge Cases
                    </div>
                    <ul className="list-disc list-inside space-y-1.5 text-gray-300 font-sans text-xs">
                      {editorial.tips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 3. SUBMISSIONS TAB (LeetCode Session History) */}
            {leftTab === 'submissions' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-mono text-gray-400 font-bold uppercase tracking-wider">
                    Recent Submissions
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">
                    Session Records
                  </span>
                </div>

                {submissionsHistory.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-xs font-mono space-y-2 bg-[#121113] border border-white/10 rounded-xl">
                    <i className="fa-solid fa-clock-rotate-left text-2xl text-gray-600 block mb-1"></i>
                    <span>No submissions yet in this session.</span>
                    <p className="text-[11px] text-gray-500 font-sans">
                      Write your solution in the editor and click "Submit" to test against the full test suite.
                    </p>
                  </div>
                ) : (
                  submissionsHistory.map((sub) => {
                    const isAccepted = sub.status === 'Accepted';
                    return (
                      <div
                        key={sub.id}
                        className={`p-3.5 bg-[#121113] border rounded-xl flex items-center justify-between font-mono text-xs transition-all ${
                          isAccepted ? 'border-emerald-500/30' : 'border-rose-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              isAccepted
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            }`}
                          >
                            {isAccepted ? '✓ Accepted' : '✗ Wrong Answer'}
                          </span>
                          <span className="text-gray-300 font-sans text-xs">
                            {sub.passedTestCases}/{sub.totalTestCases} Tests
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-gray-400 text-[11px]">
                          <span>{sub.language}</span>
                          <span className="text-white font-bold">{sub.runtimeMs ?? '—'}{sub.runtimeMs !== undefined && sub.runtimeMs !== null ? ' ms' : ''}</span>
                          <span className="text-gray-500">{sub.timestamp}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 4. COMPANIES TAB */}
            {leftTab === 'companies' && (
              <div className="space-y-4 animate-fade-in">
                <div className="text-xs font-mono text-gray-400 uppercase tracking-wider font-bold">
                  Top Companies Asking This Question
                </div>
                {problem?.companies && problem.companies.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {problem.companies.map((c, idx) => {
                      const name = String(c);
                      const logo = null;
                      return (
                        <div
                          key={idx}
                          className="p-3 bg-[#121113] border border-white/10 rounded-xl flex items-center gap-2.5 font-mono text-xs text-gray-200 shadow-sm"
                        >
                          {logo ? (
                            <img src={logo} alt={name} className="w-5 h-5 rounded object-contain bg-white/5 p-0.5" />
                          ) : (
                            <div className="w-5 h-5 rounded bg-[#A3E635]/15 border border-[#A3E635]/30 flex items-center justify-center text-[#A3E635] text-[10px]">
                              <i className="fa-solid fa-building"></i>
                            </div>
                          )}
                          <span className="font-semibold">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 font-mono p-4 bg-[#121113] border border-white/10 rounded-xl">
                    No company associations were returned for this problem.
                  </p>
                )}
              </div>
            )}

            {/* 5. HINTS TAB */}
            {leftTab === 'hints' && (
              <div className="space-y-3 animate-fade-in">
                <div className="text-xs font-mono text-gray-400 uppercase tracking-wider font-bold">
                  Progressive Solution Hints
                </div>
                {problem?.questionHints && problem.questionHints.length > 0 ? (
                  problem.questionHints.map((h, i) => (
                    <div key={i} className="p-3.5 bg-[#121113] border border-white/10 rounded-xl text-xs text-gray-300 space-y-1">
                      <div className="text-amber-400 font-mono font-bold flex items-center gap-1.5">
                        <i className="fa-solid fa-key text-[10px]"></i>
                        <span>Hint {i + 1}</span>
                      </div>
                      <p className="font-sans leading-relaxed text-gray-200">{h.hintText}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 font-mono p-4 bg-[#121113] border border-white/10 rounded-xl">
                    No hints currently recorded for this question. Analyze time/space complexity and edge cases.
                  </p>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: MONACO CODE EDITOR & INTERACTIVE TESTBENCH (7 COLS)
           ======================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          
          {/* EDITOR CARD CONTAINER */}
          <div className="bg-[#18191c] border border-white/10 rounded-xl shadow-xl overflow-hidden flex flex-col">
            
            {/* Editor Action Bar (Language Selector, Reset, Copy) */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-[#141517] border-b border-white/10">
              
              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <select
                  id="languageSelect"
,
                  value={selectedLanguage?.id ?? ''}
                  onChange={handleLanguageChange}
                  disabled={loadingLanguages || isExecuting || languages.length === 0}
                  className="bg-[#222428] border border-white/15 text-white font-mono text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#A3E635]/60 cursor-pointer shadow-xs"
                >
                  {languages.length === 0 ? (
                    <option value="" disabled>
                      {loadingLanguages ? 'Loading languages…' : 'No languages available'}
                    </option>
                  ) : (
                    languages.map((l) => (
                    <option key={l.id} value={l.id} className="bg-[#222428] text-white">
                      {l.name}
                    </option>
                    ))
                  )}
                </select>
                <span className="text-[11px] font-mono text-gray-500 hidden sm:inline">
                  {monacoLang.toUpperCase()}
                </span>
              </div>

              {/* Editor Actions: Reset, Copy */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleResetCode}
                  disabled={isExecuting}
                  title="Reset to default starter template"
                  className="px-2.5 py-1 rounded-lg text-xs font-mono text-gray-400 hover:text-white bg-[#222428] hover:bg-white/10 border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-rotate-left text-[10px]"></i>
                  <span className="hidden sm:inline">Reset</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  title="Copy code to clipboard"
                  className="px-2.5 py-1 rounded-lg text-xs font-mono text-gray-400 hover:text-white bg-[#222428] hover:bg-white/10 border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <i className={`fa-solid ${copiedCode ? 'fa-check text-[#A3E635]' : 'fa-copy'} text-[10px]`}></i>
                  <span className="hidden sm:inline">{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className={`w-full bg-[#121113] transition-all duration-300 ${consoleHeight === 'expanded' ? 'h-[260px]' : consoleHeight === 'collapsed' ? 'h-[680px]' : 'h-[430px]'}`}>
              <Editor
                height="100%"
                language={monacoLang}
                value={currentCode}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13.5,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  padding: { top: 12, bottom: 12 },
                  fontFamily: "JetBrains Mono, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
                  cursorBlinking: 'smooth',
                  smoothScrolling: true,
                }}
              />
            </div>
          </div>

          {/* ========================================================
              BOTTOM RESULTS & INTERACTIVE CONSOLE (LeetCode Testbench)
             ======================================================== */}
          <div className={`bg-[#18191c] border border-white/10 rounded-xl shadow-xl flex flex-col transition-all duration-300 overflow-hidden ${consoleHeight === 'collapsed' ? 'h-[46px]' : consoleHeight === 'expanded' ? 'h-[480px]' : 'h-[320px]'}`}>
            
            {/* Console Header Bar */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#141517] px-3 py-2 flex-wrap gap-2 shrink-0">
              
              {/* Console Tabs: Testcase | Result */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setBottomTab('testcases');
                    if (consoleHeight === 'collapsed') setConsoleHeight('normal');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    bottomTab === 'testcases'
                      ? 'bg-[#222428] text-white shadow-xs border border-white/15'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-list-check text-xs text-[#A3E635]"></i>
                  <span>Testcase</span>
                </button>

                <button
                  onClick={() => {
                    setBottomTab('results');
                    if (consoleHeight === 'collapsed') setConsoleHeight('normal');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    bottomTab === 'results'
                      ? 'bg-[#222428] text-white shadow-xs border border-white/15'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-square-poll-vertical text-xs text-sky-400"></i>
                  <span>
                    {lastExecutionMode === 'submit' ? 'Submission Verdict' : 'Run Result'}
                  </span>
                  {executionResult && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                        executionResult.failedTestCases === 0
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {executionResult.passedTestCases}/{executionResult.totalTestCases}
                    </span>
                  )}
                </button>
              </div>

              {/* Console Height & Execution Controls */}
              <div className="flex items-center gap-2">
                {isExecuting && (
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[#A3E635]">
                    <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                    <span className="hidden sm:inline">Executing...</span>
                  </div>
                )}

                {/* Minimize / Normal / Maximize Height Toggle */}
                <div className="flex items-center bg-[#222428] border border-white/10 rounded-lg overflow-hidden text-gray-400 text-xs">
                  <button
                    onClick={() => setConsoleHeight((prev) => (prev === 'collapsed' ? 'normal' : 'collapsed'))}
                    className="p-1.5 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title={consoleHeight === 'collapsed' ? 'Expand Console' : 'Minimize Console'}
                  >
                    <i className={`fa-solid ${consoleHeight === 'collapsed' ? 'fa-chevron-up' : 'fa-minus'} text-[11px]`}></i>
                  </button>
                  <button
                    onClick={() => setConsoleHeight((prev) => (prev === 'expanded' ? 'normal' : 'expanded'))}
                    className="p-1.5 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title={consoleHeight === 'expanded' ? 'Restore Size' : 'Maximize Console'}
                  >
                    <i className={`fa-solid ${consoleHeight === 'expanded' ? 'fa-compress' : 'fa-expand'} text-[11px]`}></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Console Scrollable Body (Visible when not collapsed) */}
            {consoleHeight !== 'collapsed' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* 1. TESTCASE TAB (Sample Case Inspection) */}
                {bottomTab === 'testcases' && (
                  <div className="space-y-3 animate-fade-in">
                    {/* Case Selector Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {sampleTestCases.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedTestCaseIdx(i)}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                            selectedTestCaseIdx === i
                              ? 'bg-[#A3E635] text-black shadow-xs font-bold'
                              : 'bg-[#121113] text-gray-400 hover:text-white border border-white/10'
                          }`}
                        >
                          Case {i + 1}
                        </button>
                      ))}
                    </div>

                    {/* Active Sample Case Content */}
                    {activeSampleCase ? (
                      <div className="space-y-3 font-mono text-xs">
                        <div>
                          <span className="text-gray-400 block mb-1 text-[11px]">Input:</span>
                          <pre className="p-3 bg-[#121113] border border-white/10 rounded-xl text-gray-200 overflow-x-auto whitespace-pre-wrap">
                            {activeSampleCase.input}
                          </pre>
                        </div>
                        <div>
                          <span className="text-gray-400 block mb-1 text-[11px]">Expected Output:</span>
                          <pre className="p-3 bg-[#121113] border border-white/10 rounded-xl text-[#A3E635] overflow-x-auto whitespace-pre-wrap font-bold">
                            {activeSampleCase.expectedOutput}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <p className="p-4 bg-[#121113] border border-white/10 rounded-xl text-xs text-gray-500">
                        No visible test cases were returned for this problem.
                      </p>
                    )}
                  </div>
                )}

                {/* 2. RESULTS TAB */}
                {bottomTab === 'results' && (
                  <div className="space-y-4 animate-fade-in">
                    
                    {/* Error Box */}
                    {executionError && (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono space-y-1">
                        <div className="font-bold flex items-center gap-2 text-rose-400">
                          <i className="fa-solid fa-triangle-exclamation"></i>
                          <span>Execution Error</span>
                        </div>
                        <pre className="whitespace-pre-wrap text-[11px] text-rose-200/90">{executionError}</pre>
                      </div>
                    )}

                    {/* Empty State before running/submitting */}
                    {!executionResult && !executionError && !isExecuting && (
                      <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 text-xs font-mono gap-2">
                        <i className="fa-solid fa-terminal text-2xl text-gray-600 mb-1"></i>
                        <span>Click "Run" to test sample test cases, or "Submit" for full evaluation.</span>
                      </div>
                    )}

                    {/* A. RUN CODE RESULTS VIEW (Sample Test Cases only) */}
                    {lastExecutionMode === 'run' && executionResult && (
                      <div className="space-y-4">
                        {/* Status Summary Banner */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-[#121113] border border-white/10 rounded-xl font-mono">
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                                executionResult.failedTestCases === 0
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {executionResult.failedTestCases === 0 ? '✓ Sample Cases Passed' : '✗ Sample Cases Failed'}
                            </span>
                            <span className="text-xs text-gray-400">
                              Passed: <strong className="text-white">{executionResult.passedTestCases}/{executionResult.totalTestCases}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Sample Case Selector Pills */}
                        {executionResult.testCases && executionResult.testCases.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {executionResult.testCases.map((tc, idx) => {
                              const isPassed = String(tc.status).toLowerCase() === 'passed';
                              return (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedTestCaseIdx(idx)}
                                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    selectedTestCaseIdx === idx
                                      ? 'bg-white/15 text-white border border-white/30 shadow-xs'
                                      : 'bg-[#121113] text-gray-400 hover:text-white border border-white/10'
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${isPassed ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
                                  <span>Case {idx + 1}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Selected Sample Case Details */}
                        {activeRunCase && (
                          <div className="p-4 bg-[#121113] border border-white/10 rounded-xl space-y-3 font-mono text-xs">
                            <div className="flex items-center justify-between pb-2 border-b border-white/10">
                              <span className="text-gray-400">
                                Case {selectedTestCaseIdx + 1}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  String(activeRunCase.status).toLowerCase() === 'passed'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {activeRunCase.status}
                              </span>
                            </div>

                            {activeRunCase.input && (
                              <div>
                                <span className="text-gray-500 block mb-1 text-[11px]">Input:</span>
                                <pre className="p-2.5 bg-[#18191c] border border-white/10 rounded-lg text-gray-200 overflow-x-auto whitespace-pre-wrap">
                                  {activeRunCase.input}
                                </pre>
                              </div>
                            )}

                            {activeRunCase.expectedOutput && (
                              <div>
                                <span className="text-gray-500 block mb-1 text-[11px]">Expected Output:</span>
                                <pre className="p-2.5 bg-[#18191c] border border-white/10 rounded-lg text-emerald-400 overflow-x-auto whitespace-pre-wrap font-bold">
                                  {activeRunCase.expectedOutput}
                                </pre>
                              </div>
                            )}

                            {activeRunCase.actualOutput && (
                              <div>
                                <span className="text-gray-500 block mb-1 text-[11px]">Your Output:</span>
                                <pre
                                  className={`p-2.5 bg-[#18191c] border rounded-lg overflow-x-auto whitespace-pre-wrap ${
                                    String(activeRunCase.status).toLowerCase() === 'passed'
                                      ? 'border-emerald-500/30 text-emerald-400 font-bold'
                                      : 'border-rose-500/30 text-rose-300'
                                  }`}
                                >
                                  {activeRunCase.actualOutput}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* B. SUBMIT VERDICT VIEW (TEST CASES ARE HIDDEN!) */}
                    {lastExecutionMode === 'submit' && executionResult && (
                      <div className="space-y-4 animate-fade-in">
                        {executionResult.failedTestCases === 0 ? (
                          /* ACCEPTED SCREEN (LeetCode Style) */
                          <div className="p-6 bg-gradient-to-br from-[#121113] to-emerald-950/20 border border-emerald-500/30 rounded-2xl flex flex-col gap-5 shadow-2xl relative overflow-hidden">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl shadow-lg">
                                <i className="fa-solid fa-check"></i>
                              </div>
                              <div>
                                <div className="text-2xl font-heading font-extrabold text-emerald-400 tracking-tight">
                                  Accepted
                                </div>
                                <div className="text-xs text-gray-400 font-sans">
                                  All {executionResult.totalTestCases} test cases passed successfully!
                                </div>
                              </div>
                            </div>

                            {/* Stats Grid: Test Cases, Runtime, Memory, Language */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                              <div className="p-3 bg-[#18191c] border border-white/10 rounded-xl">
                                <span className="text-gray-400 text-[10px] block">TEST CASES</span>
                                <span className="text-emerald-400 font-bold text-sm">
                                  {executionResult.passedTestCases} / {executionResult.totalTestCases}
                                </span>
                                <span className="text-[10px] text-gray-500 block">100% Passed</span>
                              </div>

                              <div className="p-3 bg-[#18191c] border border-white/10 rounded-xl">
                                <span className="text-gray-400 text-[10px] block">RUNTIME</span>
                                <span className="text-white font-bold text-sm">
                                  {executionResult.runtimeMs ?? '—'}{executionResult.runtimeMs !== undefined && executionResult.runtimeMs !== null ? ' ms' : ''}
                                </span>
                                <span className="text-[10px] text-gray-500 block">{executionResult.runtimeMs !== undefined && executionResult.runtimeMs !== null ? 'Reported by execution service' : 'Not provided'}</span>
                              </div>

                              <div className="p-3 bg-[#18191c] border border-white/10 rounded-xl">
                                <span className="text-gray-400 text-[10px] block">MEMORY</span>
                                <span className="text-white font-bold text-sm">
                                  {executionResult.memoryMb ?? '—'}{executionResult.memoryMb !== undefined && executionResult.memoryMb !== null ? ' MB' : ''}
                                </span>
                                <span className="text-[10px] text-gray-500 block">{executionResult.memoryMb !== undefined && executionResult.memoryMb !== null ? 'Reported by execution service' : 'Not provided'}</span>
                              </div>

                              <div className="p-3 bg-[#18191c] border border-white/10 rounded-xl">
                                <span className="text-gray-400 text-[10px] block">LANGUAGE</span>
                                <span className="text-[#A3E635] font-bold text-sm truncate block">
                                  {selectedLanguage?.name || '—'}
                                </span>
                                <span className="text-[10px] text-gray-500 block">Verified</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-2 border-t border-white/10 flex-wrap gap-2">
                              <span className="text-xs text-gray-400 font-sans">
                                Submitted just now
                              </span>
                              {numericQuestionId < 22 && (
                                <button
                                  onClick={() => navigate(`/problems/${numericQuestionId + 1}`)}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#A3E635] hover:bg-[#8ece28] text-black text-xs font-bold font-sans rounded-xl transition-all shadow-md cursor-pointer"
                                >
                                  <span>Next Problem</span>
                                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* WRONG ANSWER SCREEN (LeetCode Style) */
                          <div className="p-6 bg-gradient-to-br from-[#121113] to-rose-950/20 border border-rose-500/30 rounded-2xl flex flex-col gap-4 shadow-2xl">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 text-2xl shadow-lg">
                                <i className="fa-solid fa-xmark"></i>
                              </div>
                              <div>
                                <div className="text-2xl font-heading font-extrabold text-rose-400 tracking-tight">
                                  Wrong Answer
                                </div>
                                <div className="text-xs text-gray-400 font-sans">
                                  Failed {executionResult.failedTestCases} out of {executionResult.totalTestCases} test cases
                                </div>
                              </div>
                            </div>

                            {/* Ratio Progress Bar */}
                            <div className="space-y-1.5 font-mono text-xs">
                              <div className="flex justify-between text-[11px] text-gray-400">
                                <span>Tests Passed: <strong className="text-emerald-400">{executionResult.passedTestCases}</strong> / {executionResult.totalTestCases}</span>
                                <span>Failed: <strong className="text-rose-400">{executionResult.failedTestCases}</strong></span>
                              </div>
                              <div className="w-full h-2 bg-[#121113] rounded-full overflow-hidden flex border border-white/5">
                                <div
                                  className="bg-emerald-400 h-full transition-all duration-300"
                                  style={{ width: `${(executionResult.passedTestCases / (executionResult.totalTestCases || 1)) * 100}%` }}
                                ></div>
                                <div
                                  className="bg-rose-500 h-full transition-all duration-300"
                                  style={{ width: `${(executionResult.failedTestCases / (executionResult.totalTestCases || 1)) * 100}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Hidden Test Case Security Shield Banner */}
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
                              <i className="fa-solid fa-shield-halved text-[#A3E635] text-lg mt-0.5 shrink-0"></i>
                              <div className="space-y-1 font-sans text-xs">
                                <div className="font-semibold text-white">Submit Test Cases Guarded</div>
                                <div className="text-gray-400 leading-relaxed text-[11px]">
                                  Internal assessment test cases and evaluation inputs are hidden to uphold competitive programming standards. Review edge cases, boundary constraints, empty inputs, or negative numbers in your solution.
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  );
};

export default ProblemDetails;
