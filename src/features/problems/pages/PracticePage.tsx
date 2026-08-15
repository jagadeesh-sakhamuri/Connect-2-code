import { GfgLogoIcon, LeetCodeLogoIcon, HackerRankLogoIcon } from '../../../shared/components/ui/PlatformIcons';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchProblems, toggleSolveProblem, setFilter, resetFilters } from '../redux/problemSlice';
import { toggleBookmarkItem, fetchBookmarks } from '../../bookmarks/redux/bookmarkSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { toast } from 'react-hot-toast';

export const PracticePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { problems, loading, filters, pagination } = useAppSelector((state) => state.problems);
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [activeSheetTab, setActiveSheetTab] = useState<'all' | 'answered' | 'bookmarked'>('all');
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');

  useEffect(() => {
    dispatch(
      fetchProblems({
        search: searchInput,
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        page: pagination.page,
        limit: 20,
      })
    );
    if (isAuthenticated) {
      dispatch(fetchBookmarks());
    }
  }, [dispatch, searchInput, selectedTopic, selectedDifficulty, pagination.page, isAuthenticated]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setFilter({ search: searchInput }));
  };

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

  const handleBookmarkToggle = (problem: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to bookmark problems');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }
    dispatch(
      toggleBookmarkItem({
        itemId: problem.id,
        type: 'PROBLEM',
        title: problem.title,
        difficulty: problem.difficulty,
        category: problem.category || problem.topic || 'DSA',
      })
    );
    toast.success('Bookmark updated');
  };

  const topicsList = [
    'All',
    'Arrays & Hashing',
    'Two Pointers',
    'Sliding Window',
    'Stack',
    'Binary Search',
    'Linked List',
    'Trees',
    'Tries',
    'Backtracking',
    'Heap',
    'Graphs',
    '1-D Dynamic Programming',
    '2-D Dynamic Programming',
    'Bit Manipulation',
    'Math & Geometry',
  ];

  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  const displayedProblems = problems.filter((p) => {
    if (activeSheetTab === 'answered') return p.isSolved;
    if (activeSheetTab === 'bookmarked') return p.isBookmarked || bookmarks.some((b) => b.itemId === p.id);
    return true;
  });

  const solvedCount = problems.filter((p) => p.isSolved).length;
  const progressPercent = Math.round((solvedCount / (problems.length || 1)) * 100);

  return (
    <div className="w-full flex flex-col items-center pb-16 font-sans">
      {/* BeyondBasics Hero Section - Exactly Matching Companies Page */}
      <section id="practiceHero" className="relative mx-auto mt-16 max-w-7xl px-6 text-center md:px-8 flex flex-col items-center">
        <h1 className="animate-fade-in -translate-y-4 text-balance whitespace-nowrap bg-gradient-to-br from-white from-30% to-white/40 bg-clip-text py-6 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-medium leading-none tracking-tighter text-transparent opacity-100 font-heading">
          Practice Problems
        </h1>
        <p className="animate-fade-in mb-6 -translate-y-4 text-balance text-lg tracking-tight text-gray-400 opacity-100 md:text-xl font-sans max-w-2xl">
          Master coding interview patterns with interactive problem sets and step-by-step solutions
        </p>
        <div className="flex justify-center">
          <div className="shrink-0 bg-white/10 h-0.5 rounded-lg w-60 bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC]"></div>
        </div>
      </section>

      {/* Sheet Category Tabs */}
      <div className="w-full max-w-5xl mt-10 px-4 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-[#202225] p-1.5 rounded-lg border border-white/10 shadow-md">
            <button
              onClick={() => setActiveSheetTab('all')}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all font-sans cursor-pointer ${
                activeSheetTab === 'all'
                  ? 'bg-[#A3E635] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Problems
            </button>
            <button
              onClick={() => setActiveSheetTab('answered')}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all font-sans cursor-pointer ${
                activeSheetTab === 'answered'
                  ? 'bg-[#A3E635] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Answered ✓
            </button>
            <button
              onClick={() => setActiveSheetTab('bookmarked')}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all font-sans cursor-pointer ${
                activeSheetTab === 'bookmarked'
                  ? 'bg-[#A3E635] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Bookmarked
            </button>
          </div>

          {/* Solved Progress Counter */}
          <div className="flex items-center gap-3 bg-[#202225] border border-white/10 px-4 py-2 rounded-lg shadow-md">
            <span className="text-xs text-gray-400 font-sans">Solved Progress:</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {solvedCount} / {problems.length} ({progressPercent}%)
            </span>
            <div className="w-20 h-1.5 bg-[#121113] rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar - Companies Page Styling */}
        <div className="bg-[#202225] border border-white/10 p-4 rounded-lg shadow-md flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <i className="fa-solid fa-magnifying-glass text-xs absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"></i>
            <input
              type="text"
              placeholder="Search problem title or topic..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-[#121113] border border-white/10 text-sm text-gray-200 placeholder-gray-500 rounded-lg pl-10 pr-4 py-2 outline-none focus:border-white/30 transition-colors font-sans"
            />
          </form>

          {/* Topic & Difficulty Filters */}
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {/* Topic Dropdown Selector */}
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-[#121113] border border-white/10 text-xs text-gray-200 rounded-lg px-3 py-2 outline-none focus:border-white/30 font-sans"
            >
              {topicsList.map((t) => (
                <option key={t} value={t} className="bg-[#202225] text-white">
                  {t === 'All' ? 'All Topics' : t}
                </option>
              ))}
            </select>

            {/* Difficulty Pills */}
            <div className="flex items-center gap-1 bg-[#121113] p-1 rounded-lg border border-white/10">
              {difficulties.map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all font-sans cursor-pointer ${
                    selectedDifficulty === diff
                      ? 'bg-white/10 text-white border border-white/20 shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            {(searchInput || selectedTopic !== 'All' || selectedDifficulty !== 'All') && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSelectedTopic('All');
                  setSelectedDifficulty('All');
                  dispatch(resetFilters());
                }}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Reset Filters"
              >
                <i className="fa-solid fa-rotate-left text-xs"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Problems Cards List - DSA Sheet Single Line Item Design */}
      <div className="w-full max-w-5xl mt-6 px-4">
        {loading ? (
          <div className="flex flex-col gap-3.5">
            <Skeleton className="h-16 w-full rounded-lg" count={6} />
          </div>
        ) : displayedProblems.length === 0 ? (
          <EmptyState
            title="No practice problems found"
            description="No problem matches your search criteria or filter options."
            actionText="Reset All Filters"
            onAction={() => {
              setSearchInput('');
              setSelectedTopic('All');
              setSelectedDifficulty('All');
              setActiveSheetTab('all');
              dispatch(resetFilters());
            }}
            icon={<i className="fa-solid fa-code text-2xl text-gray-500"></i>}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {displayedProblems.map((problem) => {
              const isBookmarked = problem.isBookmarked || bookmarks.some((b) => b.itemId === problem.id);
              const companyList = problem.companies || problem.companyTags || ['Amazon', 'Microsoft', 'TCS'];

              return (
                <div
                  key={problem.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#202225] hover:bg-[#2f3136] border border-white/10 hover:border-white/30 rounded-lg transition-all gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Tick / Untick Button */}
                    <button
                      onClick={(e) => handleSolveToggle(problem.id, e)}
                      className={`text-lg transition-colors shrink-0 cursor-pointer ${
                        problem.isSolved ? 'text-[#A3E635]' : 'text-gray-600 hover:text-gray-400'
                      }`}
                      title={problem.isSolved ? 'Mark as Not Answered' : 'Mark as Answered'}
                    >
                      <i className={`fa-solid ${problem.isSolved ? 'fa-circle-check' : 'fa-circle'}`}></i>
                    </button>

                    {/* Bookmark Star Button */}
                    <button
                      onClick={(e) => handleBookmarkToggle(problem, e)}
                      className={`p-1.5 rounded-md border transition-all text-xs shrink-0 cursor-pointer ${
                        isBookmarked
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : 'bg-[#121113] border-white/10 text-gray-500 hover:text-amber-400 hover:border-amber-400/40'
                      }`}
                      title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
                    >
                      <i className={`fa-${isBookmarked ? 'solid' : 'regular'} fa-star`}></i>
                    </button>

                    {/* Title & Metadata */}
                    <div className="flex flex-col truncate">
                      <Link
                        to={`/problems/${problem.slug}`}
                        className="text-sm sm:text-base font-semibold text-white hover:text-gray-200 transition-colors truncate font-sans tracking-tight"
                      >
                        {problem.title}
                      </Link>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                            problem.difficulty === 'Easy'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : problem.difficulty === 'Medium'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {problem.difficulty}
                        </span>

                        {companyList && companyList.length > 0 && (
                          <div className="flex items-center gap-1">
                            {companyList.slice(0, 3).map((comp: string) => (
                              <span key={comp} className="text-[10px] font-mono text-gray-400 bg-[#121113] px-1.5 py-0.5 rounded border border-white/5">
                                {comp}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Solve Problem Action Button or 3 External Platform Icons */}
                  {problem.isOwnProblem !== false ? (
                    <Link
                      to={`/problems/${problem.slug}`}
                      className="shrink-0 px-4 py-2 text-xs font-semibold bg-[#A3E635] hover:bg-[#84CC16] text-black font-extrabold rounded-lg transition-all border border-[#A3E635]/50 flex items-center justify-center gap-1.5 font-sans shadow-md"
                    >
                      <span>Solve Problem</span>
                      <i className="fa-solid fa-arrow-right text-[10px]"></i>
                    </Link>
                  ) : (
                    <div className="shrink-0 flex items-center gap-2">
                      {/* GeeksforGeeks Circle Logo Icon */}
                      <a
                        href={problem.gfgUrl || `https://www.geeksforgeeks.org/${problem.slug}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Solve on GeeksforGeeks"
                        className="w-8.5 h-8.5 rounded-full bg-[#121113] hover:bg-emerald-500/25 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 flex items-center justify-center shadow-sm transition-all hover:scale-110 cursor-pointer"
                      >
                        <GfgLogoIcon className="w-4.5 h-4.5" />
                      </a>

                      {/* LeetCode Circle Logo Icon */}
                      <a
                        href={problem.leetCodeUrl || `https://leetcode.com/problems/${problem.slug}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Solve on LeetCode"
                        className="w-8.5 h-8.5 rounded-full bg-[#121113] hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-400 text-amber-400 flex items-center justify-center shadow-sm transition-all hover:scale-110 cursor-pointer"
                      >
                        <LeetCodeLogoIcon className="w-4.5 h-4.5" />
                      </a>

                      {/* HackerRank Circle Logo Icon */}
                      <a
                        href={problem.hackerRankUrl || `https://www.hackerrank.com/challenges/${problem.slug}`}
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
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="mt-8">
          <Pagination
            currentPage={pagination.page}
            totalPages={Math.ceil(pagination.total / pagination.limit) || 1}
            onPageChange={(page) => dispatch(setFilter({ page }))}
          />
        </div>
      </div>
    </div>
  );
};
