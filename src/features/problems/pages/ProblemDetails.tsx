import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { toggleBookmarkItem, fetchBookmarks } from '../../bookmarks/redux/bookmarkSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { apiClient } from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/api/endpoints';
import {
  executionService,
  LanguageDropdownItem,
  ExecutionResultData,
  ExecutionTestCaseResult,
} from '../../../services/executionService';
import { Button } from '../../../shared/components/ui/Button';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { toast } from 'react-hot-toast';

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

interface QuestionDetailsData {
  id: number | string;
  title: string;
  description: string;
  constraints?: string;
  difficultyRefName?: string;
  difficulty?: string;
  difficultyRefCode?: string;
  topicRefName?: string;
  topic?: string;
  category?: string;
  qpfRefName?: string;
  qpfRefCode?: string;
  qpfRefGroupCode?: string;
  examPlatform?: string;
  companies?: Array<string | { id?: number; name?: string; companyName?: string }>;
  questionHints?: Array<{ id?: number | null; hintText: string; displayOrder?: number }>;
  hints?: string[];
  testCases?: QuestionTestCase[];
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  codeSnippets?: Record<string, string>;
}

const DEFAULT_STARTER_CODE: Record<string, string> = {
  java: `import java.util.*;

class Solution {
    // Write your code here
    public void solve() {
        
    }
}`,
  python: `from typing import List, Dict, Optional

class Solution:
    # Write your code here
    def solve(self):
        pass
`,
  cpp: `#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
using namespace std;

class Solution {
public:
    // Write your code here
    void solve() {
        
    }
};
`,
  javascript: `/**
 * Write your code here
 */
function solve() {
    
}
`,
};

export const ProblemDetails: React.FC = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const questionIdParam = id || slug || '1';
  const numericQuestionId = Number(questionIdParam) || 1;

  const dispatch = useAppDispatch();
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Determine ADMIN role using existing standard
  const userRole = user?.role?.toUpperCase();
  const isAdmin = isAuthenticated && (userRole === 'ADMIN' || userRole === 'ROLE_ADMIN');

  // Question State
  const [problem, setProblem] = useState<QuestionDetailsData | null>(null);
  const [loadingProblem, setLoadingProblem] = useState<boolean>(true);

  // Language Dropdown State
  const [languages, setLanguages] = useState<LanguageDropdownItem[]>([
    { id: 1, name: 'Java' },
    { id: 2, name: 'Python' },
    { id: 3, name: 'C++' },
    { id: 4, name: 'JavaScript' },
  ]);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageDropdownItem>({ id: 1, name: 'Java' });
  const [loadingLanguages, setLoadingLanguages] = useState<boolean>(false);

  // Code Editor State per language
  const [codeByLang, setCodeByLang] = useState<Record<number, string>>({});
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Execution State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionType, setExecutionType] = useState<'run' | 'submit' | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResultData | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState<number>(0);

  // Active Left Pane Tab
  const [leftTab, setLeftTab] = useState<'description' | 'hints' | 'companies' | 'examPlatform'>('description');
  // Active Right Bottom Tab
  const [bottomTab, setBottomTab] = useState<'testcases' | 'results'>('testcases');

  // Map language name to Monaco language
  const monacoLang = useMemo(() => {
    const name = selectedLanguage.name.toLowerCase();
    if (name.includes('python')) return 'python';
    if (name.includes('c++') || name.includes('cpp')) return 'cpp';
    if (name.includes('javascript') || name.includes('js')) return 'javascript';
    return 'java';
  }, [selectedLanguage.name]);

  // Current active code in editor
  const currentCode = useMemo(() => {
    if (codeByLang[selectedLanguage.id] !== undefined) {
      return codeByLang[selectedLanguage.id];
    }
    return DEFAULT_STARTER_CODE[monacoLang] || DEFAULT_STARTER_CODE.java;
  }, [codeByLang, selectedLanguage.id, monacoLang]);

  // 1. Fetch Languages Dropdown from Backend API
  useEffect(() => {
    let isMounted = true;
    const loadLanguages = async () => {
      setLoadingLanguages(true);
      try {
        const data = await executionService.getLanguageDropdown();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setLanguages(data);
          // Preserve selected language if it exists in returned list, else default to first
          setSelectedLanguage((prev) => {
            const found = data.find((l) => l.id === prev.id);
            return found || data[0];
          });
        }
      } catch (err: any) {
        console.warn('Language dropdown load fallback:', err);
      } finally {
        if (isMounted) setLoadingLanguages(false);
      }
    };

    loadLanguages();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Question Details from Backend API
  useEffect(() => {
    let isMounted = true;
    const fetchQuestionDetails = async () => {
      setLoadingProblem(true);
      try {
        const res: any = await apiClient.get(API_ENDPOINTS.QUESTION.DETAILS(questionIdParam));
        const data = res?.data || res;

        if (isMounted) {
          if (data && (data.title || data.description || data.id)) {
            setProblem(data);
          } else {
            // Attempt fallback to problem list if single detail is missing
            setProblem({
              id: numericQuestionId,
              title: `Problem #${numericQuestionId}`,
              description: 'Solve the problem according to standard algorithmic constraints.',
              difficulty: 'Medium',
              difficultyRefName: 'Medium',
              topic: 'Algorithms',
              topicRefName: 'Algorithms',
            });
          }
        }
      } catch (err: any) {
        console.warn('Failed to fetch question details from backend:', err);
        if (isMounted) {
          // Graceful fallback question template so user can still test code
          setProblem({
            id: numericQuestionId,
            title: `Problem #${numericQuestionId}`,
            description: 'Solve the problem according to standard algorithmic constraints.',
            difficulty: 'Medium',
            difficultyRefName: 'Medium',
            topic: 'DSA',
          });
        }
      } finally {
        if (isMounted) setLoadingProblem(false);
      }
    };

    fetchQuestionDetails();
    if (isAuthenticated) {
      dispatch(fetchBookmarks());
    }
  }, [questionIdParam, numericQuestionId, isAuthenticated, dispatch]);

  // Update document title dynamically
  useEffect(() => {
    if (problem?.title) {
      document.title = `${problem.title} | Connect 2 Code`;
    }
  }, [problem?.title]);

  // Handle Editor Code Change
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      const newCode = value || '';
      setCodeByLang((prev) => ({
        ...prev,
        [selectedLanguage.id]: newCode,
      }));
    },
    [selectedLanguage.id]
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

      // If no code exists yet for this language, initialize with template
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

  // Reset Code to default starter template
  const handleResetCode = () => {
    const template = DEFAULT_STARTER_CODE[monacoLang] || DEFAULT_STARTER_CODE.java;
    setCodeByLang((prev) => ({
      ...prev,
      [selectedLanguage.id]: template,
    }));
    toast.success('Code reset to default starter template');
  };

  // Copy current code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopiedCode(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Check Bookmark Status
  const isBookmarked = useMemo(() => {
    if (!problem) return false;
    return bookmarks.some((b) => String(b.itemId) === String(problem.id));
  }, [problem, bookmarks]);

  // Toggle Bookmark
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

  // RUN CODE (User or Admin)
  const handleRunCode = async () => {
    if (isExecuting) return;

    setIsExecuting(true);
    setExecutionType('run');
    setExecutionError(null);
    setBottomTab('results');

    const payload = {
      questionId: numericQuestionId,
      languageId: selectedLanguage.id, // Table ID (1, 2, 3, 4)
      sourceCode: currentCode,
    };

    try {
      let result: ExecutionResultData;
      if (isAdmin) {
        // ADMIN RUN: POST /api/v1/admin/testCode (Sample/visible test cases only, no persistence)
        result = await executionService.adminTestCode(payload);
        toast.success('Admin: Test code executed successfully');
      } else {
        // USER RUN: POST /api/v1/runCode (Sample/visible test cases only)
        result = await executionService.runCode(payload);
        if (result.failedTestCases === 0 && result.passedTestCases > 0) {
          toast.success('All sample test cases passed!');
        } else {
          toast.error(`${result.failedTestCases} test case(s) failed`);
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
  };

  // SUBMIT CODE (User or Admin)
  const handleSubmitCode = async () => {
    if (isExecuting) return;

    setIsExecuting(true);
    setExecutionType('submit');
    setExecutionError(null);
    setBottomTab('results');

    const payload = {
      questionId: numericQuestionId,
      languageId: selectedLanguage.id, // Table ID (1, 2, 3, 4)
      sourceCode: currentCode,
    };

    try {
      let result: ExecutionResultData;
      if (isAdmin) {
        // ADMIN SUBMIT: POST /api/v1/admin/submitCode (All test cases, no submission record)
        result = await executionService.adminSubmitCode(payload);
        toast.success('Admin: Validation submitted successfully');
      } else {
        // USER SUBMIT: POST /api/v1/submitCode (All test cases)
        result = await executionService.submitCode(payload);
        if (result.failedTestCases === 0 && result.passedTestCases > 0) {
          toast.success('Accepted! All test cases passed!');
        } else {
          toast.error(`Submission: ${result.failedTestCases} test case(s) failed`);
        }
      }
      setExecutionResult(result);
      setSelectedTestCaseIdx(0);
    } catch (err: any) {
      const msg = err?.message || (err?.errors && err.errors[0]) || 'Failed to submit code';
      setExecutionError(msg);
      toast.error(msg);
    } finally {
      setIsExecuting(false);
      setExecutionType(null);
    }
  };

  // Helper: Hidden Test Case Security Check
  const isHiddenCase = (tc?: ExecutionTestCaseResult): boolean => {
    if (!tc) return false;
    if (tc.isHidden === true) return true;
    const type = (tc.testCaseType || '').toLowerCase();
    if (type.includes('sample') || type.includes('visible')) return false;
    if (
      type.includes('hidden') ||
      type.includes('mandatory') ||
      type.includes('corner') ||
      type.includes('edge')
    ) {
      return true;
    }
    return false;
  };

  // Difficulty badge styling
  const difficultyName = problem?.difficultyRefName || problem?.difficulty || 'Medium';
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
    return [
      { id: 1, input: '5\n10 20 30 40 50', expectedOutput: '50', explanation: 'Sample visible test case 1' },
      { id: 2, input: '3\n1 2 3', expectedOutput: '3', explanation: 'Sample visible test case 2' },
    ];
  }, [problem]);

  if (loadingProblem) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 font-sans">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[700px]">
          <Skeleton className="h-full w-full rounded-2xl" />
          <Skeleton className="h-full w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const activeResultCase = executionResult?.testCases?.[selectedTestCaseIdx];
  const activeSampleCase = sampleTestCases[selectedTestCaseIdx] || sampleTestCases[0];

  return (
    <div className="w-full flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-5 max-w-[1700px] mx-auto font-sans text-gray-200">
      
      {/* 1. TOP HEADER & WORKSPACE TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-white/10">
        
        {/* Breadcrumb & Title */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/practice"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-300 hover:text-[#A3E635] bg-[#202225] border border-white/10 hover:border-[#A3E635]/40 px-3.5 py-2 rounded-xl transition-all shadow-sm"
          >
            <i className="fa-solid fa-arrow-left text-xs text-[#A3E635]"></i>
            <span>Practice</span>
          </Link>

          <span className="text-gray-600">/</span>

          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
              #{numericQuestionId}
            </span>
            <h1 className="text-lg sm:text-xl font-heading font-extrabold text-white tracking-tight">
              {problem?.title || `Question #${numericQuestionId}`}
            </h1>
          </div>

          {/* Difficulty Badge */}
          <span className={`text-xs font-bold font-mono px-3 py-1 rounded-full border shadow-xs ${difficultyBadgeStyle}`}>
            {difficultyName}
          </span>

          {/* ADMIN Mode Indicator */}
          {isAdmin && (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 font-bold">
              <i className="fa-solid fa-shield-halved text-xs text-purple-400"></i>
              <span>ADMIN MODE (Testing Only)</span>
            </span>
          )}
        </div>

        {/* Global Problem Actions: Bookmark, Run, Submit */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Bookmark Button */}
          <button
            onClick={handleBookmarkToggle}
            className={`inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
              isBookmarked
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-[#202225] border-white/10 text-gray-400 hover:text-amber-400 hover:border-amber-400/40'
            }`}
          >
            <i className={`fa-${isBookmarked ? 'solid' : 'regular'} fa-star text-xs`}></i>
            <span className="hidden sm:inline">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>

          {/* RUN BUTTON */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRunCode}
            disabled={isExecuting}
            className="bg-[#202225] hover:bg-white/10 text-white border-white/15 px-4 py-2 font-mono text-xs flex items-center gap-2 font-semibold shadow-sm"
          >
            {isExecuting && executionType === 'run' ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin text-[#A3E635]"></i>
                <span>Running...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-play text-[#A3E635] text-xs"></i>
                <span>Run</span>
              </>
            )}
          </Button>

          {/* SUBMIT BUTTON */}
          <Button
            size="sm"
            onClick={handleSubmitCode}
            disabled={isExecuting}
            className="bg-[#A3E635] hover:bg-[#8ece28] text-black px-5 py-2 font-mono text-xs flex items-center gap-2 font-bold shadow-md cursor-pointer"
          >
            {isExecuting && executionType === 'submit' ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
                <span>Submit</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 2. SPLIT LAYOUT (LEFT: Problem Statement / RIGHT: Code Editor & Results) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================
            LEFT COLUMN: PROBLEM SPECIFICATION & DETAILS (5 COLS)
           ======================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-[#202225] border border-white/10 rounded-2xl p-5 shadow-xl h-[780px] overflow-hidden">
          
          {/* Left Panel Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-3 flex-wrap">
            <button
              onClick={() => setLeftTab('description')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                leftTab === 'description'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-file-lines text-xs text-[#A3E635]"></i>
              <span>Description</span>
            </button>

            <button
              onClick={() => setLeftTab('hints')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                leftTab === 'hints'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-lightbulb text-xs text-amber-400"></i>
              <span>Hints ({problem?.questionHints?.length || problem?.hints?.length || 0})</span>
            </button>

            <button
              onClick={() => setLeftTab('companies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                leftTab === 'companies'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-building text-xs text-blue-400"></i>
              <span>Companies ({problem?.companies?.length || 0})</span>
            </button>

            <button
              onClick={() => setLeftTab('examPlatform')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                leftTab === 'examPlatform'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-desktop text-xs text-[#A3E635]"></i>
              <span>Exam Platform</span>
            </button>
          </div>

          {/* Left Panel Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-5 text-sm leading-relaxed text-gray-300">
            
            {/* TAB: DESCRIPTION */}
            {leftTab === 'description' && (
              <div className="space-y-6">
                
                {/* Meta Chips */}
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  {(problem?.topicRefName || problem?.topic || problem?.category) && (
                    <span className="px-2.5 py-1 bg-[#121113] border border-white/10 rounded-lg text-gray-300">
                      Topic: <strong className="text-white">{problem.topicRefName || problem.topic || problem.category}</strong>
                    </span>
                  )}
                  {problem?.qpfRefName && (
                    <span className="px-2.5 py-1 bg-[#121113] border border-white/10 rounded-lg text-[#A3E635]">
                      Platform: <strong>{problem.qpfRefName}</strong>
                    </span>
                  )}
                </div>

                {/* Main Problem Statement */}
                <div>
                  <h3 className="text-xs uppercase font-mono font-bold text-gray-400 tracking-wider mb-2">
                    Problem Statement
                  </h3>
                  <div className="p-4 bg-[#121113] border border-white/10 rounded-xl text-gray-200 whitespace-pre-line leading-relaxed font-sans text-sm">
                    {problem?.description || 'No description provided.'}
                  </div>
                </div>

                {/* Constraints */}
                {problem?.constraints && (
                  <div>
                    <h3 className="text-xs uppercase font-mono font-bold text-gray-400 tracking-wider mb-2">
                      Constraints
                    </h3>
                    <div className="p-3.5 bg-[#121113] border border-white/10 rounded-xl text-xs font-mono text-gray-300 whitespace-pre-line">
                      {problem.constraints}
                    </div>
                  </div>
                )}

                {/* Sample Test Cases / Examples */}
                <div>
                  <h3 className="text-xs uppercase font-mono font-bold text-gray-400 tracking-wider mb-2">
                    Sample Examples
                  </h3>
                  <div className="space-y-3">
                    {sampleTestCases.map((tc, idx) => (
                      <div key={idx} className="p-3.5 bg-[#121113] border border-white/10 rounded-xl space-y-2 font-mono text-xs">
                        <div className="text-[#A3E635] font-bold">Example {idx + 1}:</div>
                        <div>
                          <span className="text-gray-500">Input: </span>
                          <span className="text-white whitespace-pre-wrap">{tc.input}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Output: </span>
                          <span className="text-[#A3E635] font-bold whitespace-pre-wrap">{tc.expectedOutput}</span>
                        </div>
                        {tc.explanation && (
                          <div className="pt-1 border-t border-white/5 text-gray-400 text-[11px] font-sans">
                            <span className="font-mono text-gray-500">Explanation: </span>
                            {tc.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB: HINTS */}
            {leftTab === 'hints' && (
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-mono font-bold text-gray-400 tracking-wider">
                  Question Hints
                </h3>
                {problem?.questionHints && problem.questionHints.length > 0 ? (
                  problem.questionHints.map((h, i) => (
                    <div key={i} className="p-3.5 bg-[#121113] border border-white/10 rounded-xl text-xs text-gray-300 flex items-start gap-2.5">
                      <span className="text-amber-400 font-mono font-bold shrink-0">Hint {i + 1}:</span>
                      <span>{h.hintText}</span>
                    </div>
                  ))
                ) : problem?.hints && problem.hints.length > 0 ? (
                  problem.hints.map((h, i) => (
                    <div key={i} className="p-3.5 bg-[#121113] border border-white/10 rounded-xl text-xs text-gray-300 flex items-start gap-2.5">
                      <span className="text-amber-400 font-mono font-bold shrink-0">Hint {i + 1}:</span>
                      <span>{h}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 font-mono p-4 bg-[#121113] border border-white/10 rounded-xl">
                    No hints currently recorded for this question. Analyze time/space complexity and edge cases.
                  </p>
                )}
              </div>
            )}

            {/* TAB: COMPANIES */}
            {leftTab === 'companies' && (
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-mono font-bold text-gray-400 tracking-wider">
                  Companies Asking This Question
                </h3>
                {problem?.companies && problem.companies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {problem.companies.map((c, i) => {
                      const name = typeof c === 'object' ? c.name || c.companyName || 'Company' : String(c);
                      return (
                        <span key={i} className="px-3 py-1.5 bg-[#121113] border border-white/15 rounded-xl text-xs font-mono text-gray-200">
                          {name}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 font-mono p-4 bg-[#121113] border border-white/10 rounded-xl">
                    Featured across multiple national recruitment technical assessments.
                  </p>
                )}
              </div>
            )}

            {/* TAB: EXAM PLATFORM */}
            {leftTab === 'examPlatform' && (
              <div className="p-4 bg-[#121113] border border-white/10 rounded-xl space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-desktop text-[#A3E635] text-sm"></i>
                  <span className="font-bold text-white text-sm">
                    {problem?.qpfRefName || problem?.examPlatform || 'TCS iON Digital Exam Platform'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 bg-[#202225] border border-white/10 rounded-lg">
                    <span className="text-gray-400 text-[10px] font-mono block">PLATFORM CODE</span>
                    <span className="text-[#A3E635] font-mono font-bold">{problem?.qpfRefCode || 'TCSION'}</span>
                  </div>
                  <div className="p-2.5 bg-[#202225] border border-white/10 rounded-lg">
                    <span className="text-gray-400 text-[10px] font-mono block">CATEGORY</span>
                    <span className="text-white font-mono font-bold">{problem?.qpfRefGroupCode || 'QPF'}</span>
                  </div>
                </div>
                <p className="text-gray-400 leading-relaxed font-sans text-xs">
                  This problem mirrors technical coding challenges featured in national placement drives.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: MONACO CODE EDITOR & EXECUTION AREA (7 COLS)
           ======================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* EDITOR CARD CONTAINER */}
          <div className="bg-[#202225] border border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            
            {/* Editor Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#17181a] border-b border-white/10">
              
              {/* Language Selector Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="languageSelect" className="text-xs text-gray-400 font-mono">
                  Language:
                </label>
                <select
                  id="languageSelect"
                  value={selectedLanguage.id}
                  onChange={handleLanguageChange}
                  disabled={loadingLanguages || isExecuting}
                  className="bg-[#202225] border border-white/15 text-white font-mono text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#A3E635]/60 cursor-pointer"
                >
                  {languages.map((l) => (
                    <option key={l.id} value={l.id} className="bg-[#202225] text-white">
                      {l.name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] font-mono text-gray-500 hidden sm:inline">
                  (ID: {selectedLanguage.id})
                </span>
              </div>

              {/* Editor Secondary Actions (Reset, Copy) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetCode}
                  disabled={isExecuting}
                  title="Reset to starter template"
                  className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-gray-400 hover:text-white bg-[#202225] hover:bg-white/5 border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-rotate-left text-[11px]"></i>
                  <span className="hidden sm:inline">Reset</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  title="Copy code"
                  className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-gray-400 hover:text-white bg-[#202225] hover:bg-white/5 border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <i className={`fa-solid ${copiedCode ? 'fa-check text-[#A3E635]' : 'fa-copy'} text-[11px]`}></i>
                  <span className="hidden sm:inline">{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* MONACO CODE EDITOR */}
            <div className="h-[430px] w-full bg-[#121113]">
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
              BOTTOM RESULTS & TEST CASES PANEL
             ======================================================== */}
          <div className="bg-[#202225] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4 min-h-[300px]">
            
            {/* Bottom Tabs */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBottomTab('testcases')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    bottomTab === 'testcases'
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-list-check text-xs text-[#A3E635]"></i>
                  <span>Sample Test Cases</span>
                </button>

                <button
                  onClick={() => setBottomTab('results')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    bottomTab === 'results'
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-square-poll-vertical text-xs text-[#38BDF8]"></i>
                  <span>Execution Results</span>
                  {executionResult && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                        executionResult.failedTestCases === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {executionResult.passedTestCases}/{executionResult.totalTestCases}
                    </span>
                  )}
                </button>
              </div>

              {/* Execution Status Tag */}
              {isExecuting && (
                <div className="flex items-center gap-2 text-xs font-mono text-[#A3E635]">
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>Executing on server...</span>
                </div>
              )}
            </div>

            {/* TAB CONTENT: TEST CASES (INPUT INSPECTION) */}
            {bottomTab === 'testcases' && (
              <div className="flex flex-col gap-3">
                {/* Case Selector Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  {sampleTestCases.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedTestCaseIdx(i)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                        selectedTestCaseIdx === i
                          ? 'bg-[#A3E635] text-black shadow-xs'
                          : 'bg-[#121113] text-gray-400 hover:text-white border border-white/10'
                      }`}
                    >
                      Case {i + 1}
                    </button>
                  ))}
                </div>

                {/* Active Sample Case Details */}
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-gray-400 block mb-1 text-[11px]">Input:</span>
                    <pre className="p-3 bg-[#121113] border border-white/10 rounded-xl text-gray-200 overflow-x-auto whitespace-pre-wrap">
                      {activeSampleCase.input}
                    </pre>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1 text-[11px]">Expected Output:</span>
                    <pre className="p-3 bg-[#121113] border border-white/10 rounded-xl text-[#A3E635] overflow-x-auto whitespace-pre-wrap">
                      {activeSampleCase.expectedOutput}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: EXECUTION RESULTS */}
            {bottomTab === 'results' && (
              <div className="flex flex-col gap-4">
                
                {/* Error Banner */}
                {executionError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono space-y-1">
                    <div className="font-bold flex items-center gap-2 text-rose-400">
                      <i className="fa-solid fa-triangle-exclamation"></i>
                      <span>Execution Error</span>
                    </div>
                    <pre className="whitespace-pre-wrap text-[11px] text-rose-200/90">{executionError}</pre>
                  </div>
                )}

                {/* Empty State before any run */}
                {!executionResult && !executionError && !isExecuting && (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 text-xs font-mono gap-2">
                    <i className="fa-solid fa-terminal text-2xl text-gray-600 mb-1"></i>
                    <span>Run or Submit your code to see real execution test results.</span>
                  </div>
                )}

                {/* Loaded Execution Result Display */}
                {executionResult && (
                  <div className="flex flex-col gap-4">
                    
                    {/* Status Summary Banner */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-[#121113] border border-white/10 rounded-xl font-mono">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm font-bold px-3 py-1 rounded-lg ${
                            executionResult.failedTestCases === 0
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {executionResult.failedTestCases === 0 ? '✓ Accepted' : '✗ Tests Failed'}
                        </span>
                        <span className="text-xs text-gray-400">
                          Total Tests: <strong className="text-white">{executionResult.totalTestCases}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-400 font-semibold">
                          Passed: {executionResult.passedTestCases}
                        </span>
                        <span className="text-gray-600">|</span>
                        <span className="text-rose-400 font-semibold">
                          Failed: {executionResult.failedTestCases}
                        </span>
                      </div>
                    </div>

                    {/* Progress Ratio Bar */}
                    <div className="w-full h-1.5 bg-[#121113] rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-400 h-full transition-all duration-300"
                        style={{
                          width: `${(executionResult.passedTestCases / (executionResult.totalTestCases || 1)) * 100}%`,
                        }}
                      ></div>
                      <div
                        className="bg-rose-500 h-full transition-all duration-300"
                        style={{
                          width: `${(executionResult.failedTestCases / (executionResult.totalTestCases || 1)) * 100}%`,
                        }}
                      ></div>
                    </div>

                    {/* Test Case Selection Pills */}
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
                              <span
                                className={`w-2 h-2 rounded-full ${isPassed ? 'bg-emerald-400' : 'bg-rose-500'}`}
                              ></span>
                              <span>Case {idx + 1}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Selected Test Case Detail Box */}
                    {activeResultCase && (
                      <div className="p-4 bg-[#121113] border border-white/10 rounded-xl space-y-3 font-mono text-xs">
                        {/* Header with Type & Status */}
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <span className="text-gray-400 text-xs">
                            Type: <strong className="text-white">{activeResultCase.testCaseType || 'Test Case'}</strong>
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                              String(activeResultCase.status).toLowerCase() === 'passed'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {activeResultCase.status}
                          </span>
                        </div>

                        {/* STRICT HIDDEN TEST CASE SECURITY CHECK */}
                        {isHiddenCase(activeResultCase) ? (
                          <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-gray-400 flex items-center gap-3">
                            <i className="fa-solid fa-lock text-[#A3E635] text-base"></i>
                            <div className="space-y-0.5 font-sans">
                              <div className="font-semibold text-white text-xs">Hidden Test Case</div>
                              <div className="text-[11px] text-gray-400">
                                Input and output details are hidden to maintain assessment integrity.
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Visible Sample Test Case Details */
                          <div className="space-y-3">
                            {activeResultCase.input !== undefined && (
                              <div>
                                <span className="text-gray-500 block mb-1 text-[11px]">Input:</span>
                                <pre className="p-2.5 bg-[#202225] border border-white/10 rounded-lg text-gray-200 overflow-x-auto whitespace-pre-wrap">
                                  {activeResultCase.input}
                                </pre>
                              </div>
                            )}

                            {activeResultCase.expectedOutput !== undefined && (
                              <div>
                                <span className="text-gray-500 block mb-1 text-[11px]">Expected Output:</span>
                                <pre className="p-2.5 bg-[#202225] border border-white/10 rounded-lg text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                                  {activeResultCase.expectedOutput}
                                </pre>
                              </div>
                            )}

                            {activeResultCase.actualOutput !== undefined && (
                              <div>
                                <span className="text-gray-500 block mb-1 text-[11px]">Actual Output:</span>
                                <pre
                                  className={`p-2.5 bg-[#202225] border rounded-lg overflow-x-auto whitespace-pre-wrap ${
                                    String(activeResultCase.status).toLowerCase() === 'passed'
                                      ? 'border-emerald-500/30 text-emerald-400'
                                      : 'border-rose-500/30 text-rose-300'
                                  }`}
                                >
                                  {activeResultCase.actualOutput}
                                </pre>
                              </div>
                            )}
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

      </div>

    </div>
  );
};

export default ProblemDetails;
