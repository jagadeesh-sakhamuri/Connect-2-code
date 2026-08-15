import { GfgLogoIcon, LeetCodeLogoIcon, HackerRankLogoIcon } from '../../../shared/components/ui/PlatformIcons';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchProblems, toggleSolveProblem } from '../redux/problemSlice';
import { toggleBookmarkItem, fetchBookmarks } from '../../bookmarks/redux/bookmarkSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { toast } from 'react-hot-toast';

export const ProblemList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { problems, loading } = useAppSelector((state) => state.problems);
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [expandedModuleNum, setExpandedModuleNum] = useState<string | null>('01');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Answered' | 'Bookmarked'>('All');

  useEffect(() => {
    dispatch(fetchProblems({ limit: 100 }));
    if (isAuthenticated) {
      dispatch(fetchBookmarks());
    }
  }, [dispatch, isAuthenticated]);

  const handleSolveToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to track your solved problems');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }
    dispatch(toggleSolveProblem(id));
    toast.success('Problem solved status updated');
  };

  const handleBookmarkToggle = (q: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to bookmark questions');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }
    dispatch(
      toggleBookmarkItem({
        itemId: q.id,
        type: 'PROBLEM',
        title: q.title,
        difficulty: q.difficulty,
        category: q.topic || 'DSA',
      })
    );
    toast.success('Bookmark updated');
  };

  // Ultimate DSA Sheet & GFG 160 Topic Modules
  const dsaModules = [
    { num: '01', title: 'Prerequisites', topic: 'Prerequisites', total: 6, solved: 2 },
    { num: '02', title: 'Time Complexity', topic: 'Time Complexity', total: 4, solved: 2 },
    { num: '03', title: 'Space Complexity', topic: 'Space Complexity', total: 2, solved: 0 },
    { num: '04', title: 'Pattern & String Conversion', topic: 'Pattern', total: 2, solved: 1 },
    { num: '05', title: 'String Basics & KMP', topic: 'Strings', total: 3, solved: 1 },
    { num: '06', title: 'Array Basics & Dutch Flag', topic: 'Arrays & Hashing', total: 4, solved: 2 },
    { num: '07', title: 'Two Pointers Approach', topic: 'Two Pointers', total: 3, solved: 1 },
    { num: '08', title: 'Sliding Window', topic: 'Sliding Window', total: 3, solved: 0 },
    { num: '09', title: 'Binary Search & Answers Range', topic: 'Binary Search', total: 3, solved: 0 },
    { num: '10', title: 'Sorting & Intervals', topic: 'Sorting', total: 3, solved: 1 },
    { num: '11', title: 'Matrixes & Traversals', topic: 'Matrixes', total: 2, solved: 1 },
    { num: '12', title: 'Bit Manipulation', topic: 'Bit Manipulation', total: 2, solved: 1 },
    { num: '13', title: 'Recursion & Backtracking', topic: 'Backtracking', total: 2, solved: 0 },
    { num: '14', title: 'Linked List', topic: 'Linked List', total: 3, solved: 2 },
    { num: '15', title: 'Stack & Queue', topic: 'Stack', total: 3, solved: 1 },
    { num: '16', title: 'Binary Trees', topic: 'Trees', total: 2, solved: 1 },
    { num: '17', title: 'Binary Search Trees', topic: 'BST', total: 2, solved: 1 },
    { num: '18', title: 'Heaps & Priority Queues', topic: 'Heap', total: 2, solved: 1 },
    { num: '19', title: 'Graphs & BFS / DFS', topic: 'Graphs', total: 3, solved: 1 },
    { num: '20', title: 'Dynamic Programming', topic: '1-D Dynamic Programming', total: 3, solved: 0 },
    { num: '21', title: 'Tries & Segment Trees', topic: 'Tries', total: 2, solved: 1 },
  ];

  return (
    <div className="w-full flex flex-col items-center pb-20 font-sans">
      {/* BeyondBasics Hero Header Section - Matching Companies Page Typography */}
      <section id="dsaHero" className="relative mx-auto mt-16 max-w-7xl px-6 text-center md:px-8 flex flex-col items-center">
        <h1 className="animate-fade-in -translate-y-4 text-balance whitespace-nowrap bg-gradient-to-br from-white from-30% to-white/40 bg-clip-text py-6 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-none tracking-tighter text-transparent opacity-100 font-heading">
          Ultimate DSA Sheet
        </h1>
        <p className="animate-fade-in mb-6 -translate-y-4 text-balance text-lg tracking-tight text-gray-400 opacity-100 md:text-xl font-sans">
          Problem Solving: Everything from Basics to Advanced
        </p>
        <div className="flex justify-center mb-6">
          <div className="shrink-0 bg-white/10 h-0.5 rounded-lg w-60 bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC]"></div>
        </div>

        {/* Status & Bookmarks Filter Tabs */}
        <div className="flex items-center justify-center gap-2 bg-[#202225] p-1.5 rounded-xl border border-white/10 shadow-md mt-2">
          {(['All', 'Answered', 'Bookmarked'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#A3E635] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {st === 'All' ? 'All Questions' : st === 'Answered' ? 'Answered Only' : 'Bookmarked Questions'}
            </button>
          ))}
        </div>
      </section>

      {/* DSA Topic Modules Accordion Section */}
      <section id="dsaModules" className="relative mx-auto mt-12 max-w-6xl px-4 sm:px-6 w-full flex flex-col gap-4">
        {dsaModules.map((module) => {
          const isExpanded = expandedModuleNum === module.num;
          
          // Filter questions for this module
          const topicQuestions = problems.filter((p) => {
            const pTopic = (p.topic || '').toLowerCase();
            const mTopic = module.topic.toLowerCase();
            const mTitle = module.title.toLowerCase();

            const matchesTopic =
              pTopic === mTopic ||
              pTopic === mTitle ||
              pTopic.includes(mTopic) ||
              mTopic.includes(pTopic) ||
              p.title.toLowerCase().includes(mTopic);

            if (!matchesTopic) return false;

            const isBookmarked = bookmarks.some((b) => b.itemId === p.id);
            if (statusFilter === 'Answered') return p.isSolved;
            if (statusFilter === 'Bookmarked') return isBookmarked;

            return true;
          });

          const totalCount = topicQuestions.length;
          const solvedCount = topicQuestions.filter((q) => q.isSolved).length;
          const progressPercent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

          return (
            <div
              key={module.num}
              className={`w-full rounded-2xl transition-all duration-300 border overflow-hidden shadow-lg ${
                isExpanded
                  ? 'bg-[#202225] border-white/20 ring-1 ring-white/10'
                  : 'bg-[#090A0C] hover:bg-[#202225] border-white/10'
              }`}
            >
              {/* Module Accordion Header */}
              <div
                onClick={() => setExpandedModuleNum(isExpanded ? null : module.num)}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-center gap-4">
                  {/* Module Number Badge */}
                  <div className="w-12 h-12 rounded-xl bg-[#121113] border border-white/10 flex items-center justify-center font-mono font-bold text-[#A3E635] text-lg shrink-0 shadow-inner">
                    {module.num}
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white font-heading tracking-tight">
                      {module.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-400 mt-1">
                      <span className="text-[#A3E635] font-semibold">{solvedCount}/{totalCount} Completed</span>
                      <span>•</span>
                      <span>{progressPercent}% Done</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Toggle Arrow */}
                <div className="flex items-center gap-4">
                  <div className="w-32 sm:w-40 bg-[#121113] h-2 rounded-full border border-white/10 overflow-hidden hidden sm:block">
                    <div
                      className="bg-gradient-to-r from-[#A3E635] to-[#84CC16] h-full transition-all duration-500 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>

                  <i
                    className={`fa-solid fa-chevron-down text-sm text-gray-400 transition-transform duration-300 ${
                      isExpanded ? 'rotate-180 text-[#A3E635]' : ''
                    }`}
                  ></i>
                </div>
              </div>

              {/* Inline Questions List */}
              {isExpanded && (
                <div className="border-t border-white/10 bg-[#17191c] p-5 flex flex-col gap-3 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider">
                    <span>{module.title} Questions ({topicQuestions.length})</span>
                    <span>Status &amp; Action</span>
                  </div>

                  {loading ? (
                    <div className="py-4 text-center text-xs font-sans text-gray-400">
                      Loading questions...
                    </div>
                  ) : topicQuestions.length === 0 ? (
                    <div className="py-4 text-center text-xs font-sans text-gray-400">
                      No questions match the current filter ({statusFilter}).
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {topicQuestions.map((q) => {
                        const isBookmarked = bookmarks.some((b) => b.itemId === q.id);

                        return (
                          <div
                            key={q.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#202225] hover:bg-[#2f3136] border border-white/10 hover:border-white/30 rounded-lg transition-all gap-3 shadow-sm"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Tick / Untick Circle Button */}
                              <button
                                onClick={(e) => handleSolveToggle(q.id, e)}
                                className={`text-lg transition-colors shrink-0 cursor-pointer ${
                                  q.isSolved ? 'text-[#A3E635]' : 'text-gray-600 hover:text-gray-400'
                                }`}
                                title={q.isSolved ? 'Mark as Not Answered' : 'Mark as Answered'}
                              >
                                <i className={`fa-solid ${q.isSolved ? 'fa-circle-check' : 'fa-circle'}`}></i>
                              </button>

                              {/* Bookmark Star Button */}
                              <button
                                onClick={(e) => handleBookmarkToggle(q, e)}
                                className={`p-1.5 rounded-md border transition-all text-xs shrink-0 cursor-pointer ${
                                  isBookmarked
                                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                    : 'bg-[#121113] border-white/10 text-gray-500 hover:text-amber-400 hover:border-amber-400/40'
                                }`}
                                title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
                              >
                                <i className={`fa-${isBookmarked ? 'solid' : 'regular'} fa-star`}></i>
                              </button>

                              <div className="flex flex-col truncate">
                                <Link
                                  to={`/problems/${q.slug}`}
                                  className="text-sm sm:text-base font-semibold text-white hover:text-gray-200 transition-colors truncate font-sans tracking-tight"
                                >
                                  {q.title}
                                </Link>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span
                                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                                      q.difficulty === 'Basic'
                                        ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                                        : q.difficulty === 'Easy'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : q.difficulty === 'Medium'
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}
                                  >
                                    {q.difficulty}
                                  </span>

                                  {q.companies && q.companies.length > 0 && (
                                    <span className="text-[10px] text-gray-400 font-mono">
                                      {q.companies.slice(0, 2).join(', ')}
                                      {q.companies.length > 2 ? ` +${q.companies.length - 2}` : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Practice Link Action or External Platform Links */}
                            <div className="flex items-center gap-2 shrink-0">
                              {q.isOwnProblem !== false ? (
                                <Link
                                  to={`/problems/${q.slug}`}
                                  className="px-3.5 py-1.5 bg-[#A3E635] hover:bg-[#84CC16] text-black font-bold rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5 font-mono cursor-pointer"
                                >
                                  <span>Practice</span>
                                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                                </Link>
                              ) : (
                                <div className="flex items-center gap-2 shrink-0">
                                  {/* GeeksforGeeks Circle Logo Icon */}
                                  <a
                                    href={q.gfgUrl || `https://www.geeksforgeeks.org/${q.slug}/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Solve on GeeksforGeeks"
                                    className="w-8.5 h-8.5 rounded-full bg-[#121113] hover:bg-emerald-500/25 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 flex items-center justify-center shadow-sm transition-all hover:scale-110 cursor-pointer"
                                  >
                                    <GfgLogoIcon className="w-4.5 h-4.5" />
                                  </a>

                                  {/* LeetCode Circle Logo Icon */}
                                  <a
                                    href={q.leetCodeUrl || `https://leetcode.com/problems/${q.slug}/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Solve on LeetCode"
                                    className="w-8.5 h-8.5 rounded-full bg-[#121113] hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-400 text-amber-400 flex items-center justify-center shadow-sm transition-all hover:scale-110 cursor-pointer"
                                  >
                                    <LeetCodeLogoIcon className="w-4.5 h-4.5" />
                                  </a>

                                  {/* HackerRank Circle Logo Icon */}
                                  <a
                                    href={q.hackerRankUrl || `https://www.hackerrank.com/challenges/${q.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Solve on HackerRank"
                                    className="w-8.5 h-8.5 rounded-full bg-[#121113] hover:bg-teal-500/25 border border-teal-500/40 hover:border-teal-400 text-teal-400 flex items-center justify-center shadow-sm transition-all hover:scale-110 cursor-pointer"
                                  >
                                    <HackerRankLogoIcon className="w-4.5 h-4.5" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
};
