import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchProblems, resetFilters } from '../redux/problemSlice';
import { toggleSolvedProblem } from '../../progress/redux/progressSlice';
import { toggleBookmarkItem, fetchBookmarks } from '../../bookmarks/redux/bookmarkSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { Pagination } from '../../../shared/components/ui/Pagination';
import type { Problem, ReferenceItem } from '../../../core/types/domain';
import { fetchReferenceGroup } from '../../references/redux/referenceSlice';
import { fetchCompanies } from '../../companies/redux/companySlice';
// import { GfgLogoIcon, LeetCodeLogoIcon, HackerRankLogoIcon } from '../../../shared/components/ui/PlatformIcons';
import { toast } from 'react-hot-toast';

export const PracticePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { problems, loading, pagination } = useAppSelector((state) => state.problems);
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const referenceGroups = useAppSelector((state) => state.references.groups);
  const serverCompanies = useAppSelector((state) => state.companies.companies);
  const solvedByProblemId = useAppSelector((state) => state.progress.solvedByProblemId);

  const [searchParams, setSearchParams] = useSearchParams();
  const pageSize = 20;

  // Practice navigation state lives in the URL so a detail -> back navigation
  // restores the exact filters, tab, search query, and page instead of rebuilding defaults.
  const activeSheetTabParam = searchParams.get('tab');
  const activeSheetTab: 'all' | 'answered' | 'bookmarked' =
    activeSheetTabParam === 'answered' || activeSheetTabParam === 'bookmarked' ? activeSheetTabParam : 'all';
  const searchInputParam = searchParams.get('q') || '';
  const selectedTopic = searchParams.get('topic') || '';
  const selectedDifficulty = searchParams.get('difficulty') || '';
  const selectedCompany = searchParams.get('company') || '';
  const rawPage = searchParams.get('page');
  const parsedPage = Number(rawPage || '1');
  const currentPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const [searchInput, setSearchInput] = useState(searchInputParam);
  const [debouncedSearch, setDebouncedSearch] = useState(searchInputParam);

  const updatePracticeParams = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        Object.entries(updates).forEach(([key, value]) => {
          if (value === null || value === '') next.delete(key);
          else next.set(key, value);
        });
        return next;
      }, { replace: true, preventScrollReset: true });
    },
    [setSearchParams]
  );

  // Sanitize invalid page query parameters (F-031)
  useEffect(() => {
    if (rawPage !== null && (!Number.isInteger(parsedPage) || parsedPage < 1)) {
      updatePracticeParams({ page: '1' });
    }
  }, [rawPage, parsedPage, updatePracticeParams]);

  // Synchronize local search input if URL changes externally
  useEffect(() => {
    setSearchInput(searchInputParam);
    setDebouncedSearch(searchInputParam);
  }, [searchInputParam]);

  // Debounce search input by 300ms before pushing URL updates (F-021)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed !== searchInputParam) {
        updatePracticeParams({ q: trimmed || null, page: '1' });
      }
      setDebouncedSearch(trimmed);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, searchInputParam, updatePracticeParams]);

  const difficulties: ReferenceItem[] = referenceGroups.DIFF ?? [];
  const topics: ReferenceItem[] = referenceGroups.TOPIC ?? [];
  const companies = serverCompanies;

  // Load filter catalog data through Redux instead of calling services from the page.
  useEffect(() => {
    dispatch(fetchReferenceGroup('DIFF'));
    dispatch(fetchReferenceGroup('TOPIC'));
    dispatch(fetchCompanies(undefined));
  }, [dispatch]);

  // Fetch the current page/filter combination once. Redux deduplicates repeated keys and
  // the thunk can be aborted when this page leaves the screen or its filters change.
  useEffect(() => {
    const topicId = selectedTopic && !isNaN(Number(selectedTopic)) ? Number(selectedTopic) : undefined;
    const difficultyId = selectedDifficulty && !isNaN(Number(selectedDifficulty)) ? Number(selectedDifficulty) : undefined;
    const companyId = selectedCompany && !isNaN(Number(selectedCompany)) ? Number(selectedCompany) : undefined;

    const request = dispatch(
      fetchProblems({
        search: debouncedSearch.trim() || undefined,
        searchText: debouncedSearch.trim() || undefined,
        topic: topicId ? [topicId] : undefined,
        difficulty: difficultyId ? [difficultyId] : undefined,
        level: difficultyId ? [difficultyId] : undefined,
        company: companyId ? [companyId] : undefined,
        companies: companyId ? [companyId] : undefined,
        page: currentPage,
        limit: pageSize,
      })
    );

    return () => {
      request.abort();
    };
  }, [dispatch, debouncedSearch, selectedTopic, selectedDifficulty, selectedCompany, currentPage]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchBookmarks());
    }
  }, [dispatch, isAuthenticated]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    setDebouncedSearch(trimmed);
    updatePracticeParams({ q: trimmed || null, page: '1' });
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updatePracticeParams({ topic: e.target.value || null, page: '1' });
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updatePracticeParams({ company: e.target.value || null, page: '1' });
  };

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updatePracticeParams({ difficulty: e.target.value || null, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    updatePracticeParams({ page: String(newPage) });
  };

  const handleSolveToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to track your solved problems');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }
    dispatch(toggleSolvedProblem({ id }));
    toast.success('Problem solved status updated');
  };

  const handleBookmarkToggle = (problem: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to bookmark problems');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }
    const isCurrentlyBookmarked = bookmarks.some((b) => String(b.itemId) === String(problem.id));
    dispatch(
      toggleBookmarkItem({
        itemId: problem.id,
        type: 'PROBLEM',
        title: problem.title,
        difficulty: problem.difficulty,
        category: problem.category || problem.topic || '',
      })
    )
      .unwrap()
      .then(() => {
        toast.success(isCurrentlyBookmarked ? 'Bookmark removed' : 'Problem bookmarked!');
      })
      .catch((err: any) => {
        toast.error(typeof err === 'string' ? err : 'Failed to update bookmark');
      });
  };

  const handleTabChange = (tab: 'all' | 'answered' | 'bookmarked') => {
    updatePracticeParams({ tab: tab === 'all' ? null : tab, page: '1' });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSearchParams(new URLSearchParams(), { replace: true, preventScrollReset: true });
    dispatch(resetFilters());
  };

  // Client-side Tab Filtering & Synthesis for Answered / Bookmarked (F-002)
  const problemBookmarks = useMemo(
    () => bookmarks.filter((b) => b.type === 'PROBLEM'),
    [bookmarks]
  );

  const displayedProblems = useMemo(() => {
    if (activeSheetTab === 'answered') {
      return problems.filter((p) => Boolean(solvedByProblemId[p.id] ?? p.isSolved));
    }
    if (activeSheetTab === 'bookmarked') {
      const bookmarkedIds = new Set(problemBookmarks.map((b) => String(b.itemId)));
      const onScreenBookmarked = problems.filter((p) => bookmarkedIds.has(String(p.id)) || p.isBookmarked);
      if (onScreenBookmarked.length > 0) return onScreenBookmarked;

      return problemBookmarks.map((b) => ({
        id: String(b.itemId),
        title: b.title || `Problem #${b.itemId}`,
        slug: String(b.itemId),
        difficulty: (b.difficulty as any) || 'Medium',
        topic: b.category || 'General',
        category: b.category || 'General',
        companies: [],
        acceptanceRate: '',
        isBookmarked: true,
        isSolved: Boolean(solvedByProblemId[b.itemId]),
      })) as Problem[];
    }
    return problems;
  }, [activeSheetTab, problems, solvedByProblemId, problemBookmarks]);

  // Global solved stats calculated against full catalog total (F-003)
  const isFiltered = Boolean(debouncedSearch.trim() || selectedTopic || selectedDifficulty || selectedCompany);
  const totalCatalogProblems =
    pagination.total > 0
      ? pagination.total
      : pagination.total === 0 && !loading && problems.length === 0
      ? 0
      : problems.length;

  const globalSolvedCount = Object.values(solvedByProblemId).filter(Boolean).length;
  const rawSolvedCount =
    activeSheetTab === 'bookmarked'
      ? displayedProblems.filter((p) => Boolean(solvedByProblemId[p.id] ?? p.isSolved)).length
      : isFiltered
      ? problems.filter((p) => Boolean(solvedByProblemId[p.id] ?? p.isSolved)).length
      : globalSolvedCount > 0
      ? globalSolvedCount
      : problems.filter((p) => Boolean(solvedByProblemId[p.id] ?? p.isSolved)).length;

  const solvedCount = totalCatalogProblems > 0 ? Math.min(rawSolvedCount, totalCatalogProblems) : 0;
  const progressPercent = totalCatalogProblems > 0
    ? Math.min(100, Math.round((solvedCount / totalCatalogProblems) * 100))
    : 0;

  // Pagination totals per tab (F-002)
  const tabTotalElements =
    activeSheetTab === 'all'
      ? pagination.total || problems.length
      : activeSheetTab === 'bookmarked'
      ? problemBookmarks.length || displayedProblems.length
      : globalSolvedCount || displayedProblems.length;

  const tabTotalPages =
    activeSheetTab === 'all'
      ? pagination.totalPages || Math.ceil((pagination.total || 0) / pageSize) || 1
      : Math.ceil((tabTotalElements || 1) / pageSize) || 1;

  // Client-side pagination slicing for bookmarked/answered tabs (F-002)
  const paginatedProblems = useMemo(() => {
    if (activeSheetTab === 'all') {
      return displayedProblems;
    }
    const startIndex = (currentPage - 1) * pageSize;
    return displayedProblems.slice(startIndex, startIndex + pageSize);
  }, [activeSheetTab, displayedProblems, currentPage, pageSize]);

  // Normalize out-of-bounds page query parameters when total pages decrease (F-031)
  useEffect(() => {
    if (!loading && tabTotalPages > 0 && currentPage > tabTotalPages) {
      updatePracticeParams({ page: String(tabTotalPages) });
    }
  }, [loading, tabTotalPages, currentPage, updatePracticeParams]);

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
              onClick={() => handleTabChange('all')}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all font-sans cursor-pointer ${
                activeSheetTab === 'all'
                  ? 'bg-[#A3E635] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Problems
            </button>
            <button
              onClick={() => handleTabChange('answered')}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all font-sans cursor-pointer ${
                activeSheetTab === 'answered'
                  ? 'bg-[#A3E635] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Answered ✓
            </button>
            <button
              onClick={() => handleTabChange('bookmarked')}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all font-sans cursor-pointer ${
                activeSheetTab === 'bookmarked'
                  ? 'bg-[#A3E635] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Bookmarked ★
            </button>
          </div>

          {/* Quick Stats Progress */}
          <div className="flex items-center gap-4 text-xs font-sans">
            <div className="flex items-center gap-2 bg-[#202225] px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-gray-400">Solved:</span>
              <span className="font-bold text-[#A3E635]">
                {solvedCount} / {totalCatalogProblems}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-[#202225] px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-gray-400">Progress:</span>
              <span className="font-bold text-white">{progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar - Dropdowns for Topic, Company, and Difficulty (Basic, Easy, Medium, Hard) */}
        <div className="bg-[#202225] border border-white/10 p-4 rounded-lg shadow-md flex flex-col md:flex-row gap-3.5 justify-between items-center">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
            <i className="fa-solid fa-magnifying-glass text-xs absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"></i>
            <input
              type="text"
              placeholder="Search problem title..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-[#121113] border border-white/10 text-xs sm:text-sm text-gray-200 placeholder-gray-500 rounded-lg pl-10 pr-4 py-2 outline-none focus:border-white/30 transition-colors font-sans"
            />
          </form>

          {/* Topic, Company & Difficulty Dropdown Filters */}
          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
            {/* Topic Dropdown Selector */}
            <select
              value={selectedTopic}
              onChange={handleTopicChange}
              className="bg-[#121113] border border-white/10 text-xs text-gray-200 rounded-lg px-3 py-2 outline-none focus:border-white/30 font-sans cursor-pointer"
            >
              <option value="" className="bg-[#202225] text-white">All Topics</option>
              {topics.map((t) => (
                <option key={t.id || t.refCode} value={String(t.id)} className="bg-[#202225] text-white">
                  {t.refName}
                </option>
              ))}
            </select>

            {/* Company Dropdown Selector */}
            <select
              value={selectedCompany}
              onChange={handleCompanyChange}
              className="bg-[#121113] border border-white/10 text-xs text-gray-200 rounded-lg px-3 py-2 outline-none focus:border-white/30 font-sans cursor-pointer"
            >
              <option value="" className="bg-[#202225] text-white">All Companies</option>
              {companies.map((c) => (
                <option key={c.id || c.name} value={String(c.id)} className="bg-[#202225] text-white">
                  {c.name}
                </option>
              ))}
            </select>

            {/* Difficulty Dropdown Selector: All, Basic, Easy, Medium, Hard */}
            <select
              value={selectedDifficulty}
              onChange={handleDifficultyChange}
              className="bg-[#121113] border border-white/10 text-xs text-gray-200 rounded-lg px-3 py-2 outline-none focus:border-white/30 font-sans cursor-pointer"
            >
              <option value="" className="bg-[#202225] text-white">All Difficulties</option>
              {difficulties.map((diff) => (
                <option key={diff.id || diff.refCode} value={String(diff.id)} className="bg-[#202225] text-white">
                  {diff.refName}
                </option>
              ))}
            </select>

            {(searchInput || selectedTopic || selectedCompany || selectedDifficulty) && (
              <button
                onClick={handleResetFilters}
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
            title={activeSheetTab === 'bookmarked' ? 'No bookmarked problems' : 'No practice problems found'}
            description={
              activeSheetTab === 'bookmarked'
                ? 'You have not bookmarked any problems yet.'
                : 'No problem matches your search criteria or filter options.'
            }
            actionText={activeSheetTab === 'bookmarked' ? undefined : 'Reset All Filters'}
            onAction={activeSheetTab === 'bookmarked' ? undefined : handleResetFilters}
            icon={
              <i
                className={`fa-solid ${
                  activeSheetTab === 'bookmarked' ? 'fa-star text-amber-400' : 'fa-code text-gray-500'
                } text-2xl`}
              ></i>
            }
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {paginatedProblems.map((problem) => {
              const isBookmarked = problem.isBookmarked || bookmarks.some((b) => b.itemId === problem.id);
              const companyList = problem.companies || [];

              return (
                <div
                  key={problem.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#202225] hover:bg-[#2f3136] border border-white/10 hover:border-white/30 rounded-lg transition-all gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Tick / Untick Button */}
                    <button
                      onClick={(e) => handleSolveToggle(problem.id, e)}
                      aria-label={(solvedByProblemId[problem.id] ?? problem.isSolved) ? 'Mark as Not Answered' : 'Mark as Answered'}
                      className={`text-lg transition-colors shrink-0 cursor-pointer ${
                        (solvedByProblemId[problem.id] ?? problem.isSolved) ? 'text-[#A3E635]' : 'text-gray-600 hover:text-gray-400'
                      }`}
                      title={(solvedByProblemId[problem.id] ?? problem.isSolved) ? 'Mark as Not Answered' : 'Mark as Answered'}
                    >
                      <i className={`fa-solid ${(solvedByProblemId[problem.id] ?? problem.isSolved) ? 'fa-circle-check' : 'fa-circle'}`}></i>
                    </button>

                    {/* Bookmark Star Button */}
                    <button
                      onClick={(e) => handleBookmarkToggle(problem, e)}
                      aria-label={isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
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

                      {/* Level and Tagged Companies Displayed Side-by-Side */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {/* Difficulty Level Tag */}
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            problem.difficulty?.toLowerCase().includes('easy') || problem.difficulty?.toLowerCase().includes('basic')
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : problem.difficulty?.toLowerCase().includes('hard')
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {problem.difficulty || '—'}
                        </span>

                        {/* Category / Topic Tag */}
                        {problem.topic && (
                          <span className="text-[10px] font-sans font-medium text-gray-400 bg-[#121113] px-2 py-0.5 rounded-md border border-white/5">
                            {problem.topic}
                          </span>
                        )}

                        {/* Companies Displayed Beside Level */}
                        {companyList && companyList.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {companyList.map((comp: string, idx: number) => (
                              <span
                                key={`${comp}-${idx}`}
                                className="text-[10px] font-sans font-medium text-gray-300 bg-[#121113] px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1 shadow-xs"
                              >
                                <i className="fa-solid fa-building text-[9px] text-[#A3E635]"></i>
                                <span>{comp}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Solve Problem Button + External Platform Links (GFG/LeetCode/HackerRank commented out) */}
                  <div className="shrink-0 flex items-center gap-2">
                    {/* External Platform Quick Links (GeeksforGeeks, LeetCode, HackerRank) - Temporarily Commented Out
                    {problem.gfgUrl && (
                      <a
                        href={problem.gfgUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on GeeksforGeeks"
                        className="w-8 h-8 rounded-lg bg-[#121113] hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-emerald-400 flex items-center justify-center transition-all hover:scale-105"
                      >
                        <GfgLogoIcon className="w-4 h-4" />
                      </a>
                    )}
                    {problem.leetCodeUrl && (
                      <a
                        href={problem.leetCodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on LeetCode"
                        className="w-8 h-8 rounded-lg bg-[#121113] hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-amber-400 flex items-center justify-center transition-all hover:scale-105"
                      >
                        <LeetCodeLogoIcon className="w-4 h-4" />
                      </a>
                    )}
                    {problem.hackerRankUrl && (
                      <a
                        href={problem.hackerRankUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on HackerRank"
                        className="w-8 h-8 rounded-lg bg-[#121113] hover:bg-teal-500/20 border border-white/10 hover:border-teal-500/40 text-teal-400 flex items-center justify-center transition-all hover:scale-105"
                      >
                        <HackerRankLogoIcon className="w-4 h-4" />
                      </a>
                    )}
                    */}

                    {/* Solve Problem Action Button */}
                    <Link
                      to={`/problems/${problem.slug}`}
                      className="px-4 py-2 text-xs font-semibold bg-[#A3E635] hover:bg-[#84CC16] text-black font-extrabold rounded-lg transition-all border border-[#A3E635]/50 flex items-center justify-center gap-1.5 font-sans shadow-md hover:scale-[1.02]"
                    >
                      <span>Solve Problem</span>
                      <i className="fa-solid fa-arrow-right text-[10px]"></i>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={tabTotalPages}
            totalElements={tabTotalElements}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default PracticePage;
