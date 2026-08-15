import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchProblemBySlug } from '../redux/problemSlice';
import { toggleBookmarkItem, fetchBookmarks } from '../../bookmarks/redux/bookmarkSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { Button } from '../../../shared/components/ui/Button';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { toast } from 'react-hot-toast';

export const ProblemDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const { selectedProblem: problem, loading } = useAppSelector((state) => state.problems);
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<'topics' | 'companies' | 'hints' | 'examPlatform' | null>(null);
  const [selectedLang, setSelectedLang] = useState<'java' | 'cpp' | 'python' | 'javascript'>('java');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (slug) {
      dispatch(fetchProblemBySlug(slug));
    }
    if (isAuthenticated) {
      dispatch(fetchBookmarks());
    }
  }, [dispatch, slug, isAuthenticated]);

  const isBookmarked = problem ? bookmarks.some((b) => b.itemId === problem.id) : false;

  const handleBookmarkToggle = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to bookmark questions');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }
    if (problem) {
      dispatch(
        toggleBookmarkItem({
          itemId: problem.id,
          type: 'PROBLEM',
          title: problem.title,
          difficulty: problem.difficulty,
          category: problem.topic || 'DSA',
        })
      );
      toast.success(isBookmarked ? 'Bookmark removed' : 'Problem bookmarked!');
    }
  };

  const defaultDriverCode = {
    java: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {};
    }
}`,
    cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> mp;
        for (int i = 0; i < nums.size(); i++) {
            int comp = target - nums[i];
            if (mp.count(comp)) return {mp[comp], i};
            mp[nums[i]] = i;
        }
        return {};
    }
};`,
    python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            comp = target - num
            if comp in seen:
                return [seen[comp], i]
            seen[num] = i
        return []`,
    javascript: `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (map.has(comp)) {
            return [map.get(comp), i];
        }
        map.set(nums[i], i);
    }
    return [];
};`
  };

  const handleCopyCode = () => {
    const codeToCopy = problem?.codeSnippets?.[selectedLang] || defaultDriverCode[selectedLang];
    navigator.clipboard.writeText(codeToCopy);
    setCopiedCode(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading || !problem) {
    return (
      <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full p-8">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  // Guaranteed examples array with fallbacks
  const displayExamples = problem.examples && problem.examples.length > 0 ? problem.examples : [
    { input: "nums = [2, 7, 11, 15], target = 9", output: "[0, 1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
    { input: "nums = [3, 2, 4], target = 6", output: "[1, 2]", explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]." },
    { input: "nums = [3, 3], target = 6", output: "[0, 1]", explanation: "Because nums[0] + nums[1] == 6, we return [0, 1]." }
  ];

  const difficultyBadge =
    problem.difficulty.toLowerCase() === 'basic'
      ? 'text-teal-400 bg-teal-500/10 border-teal-500/30'
      : problem.difficulty.toLowerCase() === 'easy'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : problem.difficulty.toLowerCase() === 'medium'
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

  return (
    <div className="flex w-full flex-1 flex-col gap-6 px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto font-sans text-gray-200">
      
      {/* NAVIGATION & BREADCRUMB */}
      <div className="flex items-center justify-between">
        <Link
          to="/problems"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-[#A3E635] transition-all bg-[#202225] border border-white/10 hover:border-[#A3E635]/40 px-4.5 py-2.5 rounded-xl shadow-md group"
        >
          <i className="fa-solid fa-arrow-left text-xs text-[#A3E635] group-hover:-translate-x-1 transition-transform"></i>
          <span>Back to Problem List</span>
        </Link>
      </div>

      {/* HERO PROBLEM TITLE & BADGES */}
      <div className="p-6 sm:p-8 bg-[#202225] border border-white/10 rounded-2xl shadow-xl flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-white tracking-tight">
            {problem.title}
          </h1>

          {/* Difficulty Badge */}
          <div className={`self-start sm:self-auto text-xs sm:text-sm font-bold font-mono px-4 py-1.5 rounded-full border shadow-sm ${difficultyBadge}`}>
            {problem.difficulty}
          </div>
        </div>

        {/* INTERACTIVE CHIPS ROW: TOPICS, COMPANIES, HINTS */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
          {/* Topics Pill */}
          <button
            onClick={() => setActiveTab(activeTab === 'topics' ? null : 'topics')}
            className={`inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-[#121113] border border-white/10 hover:border-[#A3E635]/50 hover:text-[#A3E635] transition-all cursor-pointer shadow-sm ${
              activeTab === 'topics' ? 'border-[#A3E635] text-[#A3E635] bg-[#A3E635]/10' : 'text-gray-300'
            }`}
          >
            <i className="fa-solid fa-tag text-xs text-[#A3E635]"></i>
            <span>Topics</span>
          </button>

          {/* Companies Pill */}
          <button
            onClick={() => setActiveTab(activeTab === 'companies' ? null : 'companies')}
            className={`inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-[#121113] border border-white/10 hover:border-[#A3E635]/50 hover:text-[#A3E635] transition-all cursor-pointer shadow-sm ${
              activeTab === 'companies' ? 'border-[#A3E635] text-[#A3E635] bg-[#A3E635]/10' : 'text-gray-300'
            }`}
          >
            <i className="fa-solid fa-building text-xs text-[#A3E635]"></i>
            <span>Companies ({problem.companies?.length || 0})</span>
          </button>

          {/* Hints Pill */}
          <button
            onClick={() => setActiveTab(activeTab === 'hints' ? null : 'hints')}
            className={`inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-[#121113] border border-white/10 hover:border-[#A3E635]/50 hover:text-[#A3E635] transition-all cursor-pointer shadow-sm ${
              activeTab === 'hints' ? 'border-[#A3E635] text-[#A3E635] bg-[#A3E635]/10' : 'text-gray-300'
            }`}
          >
            <i className="fa-solid fa-lightbulb text-xs text-[#A3E635]"></i>
            <span>Hints ({problem.hints?.length || 0})</span>
          </button>

          {/* Exam Platform Pill */}
          <button
            onClick={() => setActiveTab(activeTab === 'examPlatform' ? null : 'examPlatform')}
            className={`inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-[#121113] border border-white/10 hover:border-[#A3E635]/50 hover:text-[#A3E635] transition-all cursor-pointer shadow-sm ${
              activeTab === 'examPlatform' ? 'border-[#A3E635] text-[#A3E635] bg-[#A3E635]/10' : 'text-gray-300'
            }`}
          >
            <i className="fa-solid fa-desktop text-xs text-[#A3E635]"></i>
            <span>Exam Platform</span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={handleBookmarkToggle}
            className={`ml-auto inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
              isBookmarked
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-[#121113] border-white/10 text-gray-400 hover:text-amber-400 hover:border-amber-400/40'
            }`}
          >
            <i className={`fa-${isBookmarked ? 'solid' : 'regular'} fa-star text-xs`}></i>
            <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>
        </div>

        {/* EXPANDABLE CHIP CONTENT BOARDS */}
        {activeTab === 'topics' && (
          <div className="p-4 bg-[#121113] border border-white/10 rounded-xl text-xs sm:text-sm animate-fade-in flex items-center gap-2 font-mono">
            <span className="text-gray-400">Category:</span>
            <span className="text-[#A3E635] font-bold">{problem.category}</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-400">Topic:</span>
            <span className="text-white font-bold">{problem.topic}</span>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="p-4 bg-[#121113] border border-white/10 rounded-xl text-xs sm:text-sm animate-fade-in flex flex-wrap gap-2">
            {problem.companies && problem.companies.length > 0 ? (
              problem.companies.map((c) => (
                <span key={c} className="px-3 py-1 bg-[#202225] border border-white/15 rounded-lg text-gray-200 font-mono font-medium">
                  {c}
                </span>
              ))
            ) : (
              <span className="text-gray-500 font-mono text-xs">No specific company tags recorded.</span>
            )}
          </div>
        )}

        {activeTab === 'hints' && (
          <div className="p-4 bg-[#121113] border border-white/10 rounded-xl text-xs sm:text-sm animate-fade-in space-y-2">
            {problem.hints && problem.hints.length > 0 ? (
              problem.hints.map((hint, idx) => (
                <div key={idx} className="p-3 bg-[#202225] border border-white/10 rounded-lg text-gray-300 flex items-start gap-2">
                  <span className="text-[#A3E635] font-mono font-bold shrink-0">Hint {idx + 1}:</span>
                  <span>{hint}</span>
                </div>
              ))
            ) : (
              <span className="text-gray-500 font-mono text-xs">Try analyzing time complexity or using a Hash Map for fast lookup.</span>
            )}
          </div>
        )}

        {activeTab === 'examPlatform' && (
          <div className="p-5 bg-[#121113] border border-white/10 rounded-xl text-xs sm:text-sm animate-fade-in flex flex-col gap-3 font-sans shadow-inner">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#A3E635]/10 border border-[#A3E635]/30 flex items-center justify-center text-[#A3E635]">
                  <i className="fa-solid fa-desktop text-sm"></i>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-mono">Exam Platform Name</span>
                  <span className="font-bold text-white text-sm sm:text-base font-heading">
                    {(problem as any).qpfRefName || (problem as any).examPlatform || 'TCS iON Digital Exam Platform'}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#A3E635]/15 border border-[#A3E635]/40 text-[#A3E635] font-extrabold shadow-xs">
                Featured Online Assessment
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-[#202225] border border-white/10 rounded-lg flex flex-col gap-1">
                <span className="text-gray-400 text-[11px] font-mono uppercase tracking-wider">Exam Platform Code</span>
                <span className="text-[#A3E635] font-mono font-extrabold text-sm">{(problem as any).qpfRefCode || 'TCSION'}</span>
              </div>

              <div className="p-3 bg-[#202225] border border-white/10 rounded-lg flex flex-col gap-1">
                <span className="text-gray-400 text-[11px] font-mono uppercase tracking-wider">Platform Category</span>
                <span className="text-white font-semibold font-mono text-sm">{(problem as any).qpfRefGroupCode || 'QPF'} (Question Platform)</span>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed font-sans mt-1 p-3 bg-[#202225]/60 border border-white/5 rounded-lg">
              This coding question was featured on the <strong className="text-white font-semibold">{(problem as any).qpfRefName || (problem as any).examPlatform || 'TCS iON Digital Exam Platform'}</strong> during national level campus recruitment drives and technical assessment coding rounds.
            </p>
          </div>
        )}
      </div>

      {/* PROBLEM DESCRIPTION BOARD */}
      <div className="p-6 sm:p-8 bg-[#202225] border border-white/10 rounded-2xl shadow-xl flex flex-col gap-6">
        <h2 className="text-lg sm:text-xl font-heading font-bold text-white tracking-tight border-b border-white/10 pb-3 flex items-center gap-2">
          <i className="fa-solid fa-file-lines text-[#A3E635] text-base"></i>
          <span>Problem Statement</span>
        </h2>

        <div className="text-sm sm:text-base leading-relaxed text-gray-300 font-sans whitespace-pre-line">
          {problem.description}
        </div>

        {/* INPUT / OUTPUT EXAMPLES */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-mono font-bold uppercase text-gray-400 tracking-wider">Examples &amp; Test Cases</h3>
          
          <div className="grid grid-cols-1 gap-4">
            {displayExamples.map((ex, idx) => (
              <div key={idx} className="p-4 sm:p-5 bg-[#121113] border border-white/10 rounded-xl font-mono text-xs sm:text-sm space-y-2">
                <div className="text-[#A3E635] font-bold text-xs">Example {idx + 1}:</div>
                <div>
                  <span className="text-gray-500">Input: </span>
                  <span className="text-white font-semibold">{ex.input}</span>
                </div>
                <div>
                  <span className="text-gray-500">Output: </span>
                  <span className="text-[#A3E635] font-bold">{ex.output}</span>
                </div>
                {ex.explanation && (
                  <div className="pt-1 border-t border-white/5 text-gray-400 text-xs font-sans">
                    <span className="font-mono text-gray-500">Explanation: </span>
                    {ex.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CODE SNIPPET DRIVER BOARD */}
      <div className="p-6 sm:p-8 bg-[#202225] border border-white/10 rounded-2xl shadow-xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-code text-[#A3E635] text-base"></i>
            <h2 className="text-lg sm:text-xl font-heading font-bold text-white tracking-tight">Solution Template</h2>
          </div>

          {/* LANGUAGE SELECTOR & COPY */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['java', 'cpp', 'python', 'javascript'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                  selectedLang === lang
                    ? 'bg-[#A3E635] text-black shadow-sm'
                    : 'bg-[#121113] text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JS' : lang}
              </button>
            ))}

            <Button variant="secondary" size="sm" onClick={handleCopyCode} className="ml-2">
              <i className={`fa-solid ${copiedCode ? 'fa-check text-[#A3E635]' : 'fa-copy'} text-xs`}></i>
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        </div>

        {/* CODE BLOCK */}
        <pre className="p-5 bg-[#090A0C] border border-white/10 rounded-xl text-xs sm:text-sm font-mono text-[#A3E635] overflow-x-auto leading-relaxed">
          <code>{problem.codeSnippets?.[selectedLang] || defaultDriverCode[selectedLang]}</code>
        </pre>
      </div>

    </div>
  );
};
