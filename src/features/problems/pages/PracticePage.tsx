import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchProblems, toggleSolveProblem, resetFilters } from '../redux/problemSlice';
import { toggleBookmarkItem, fetchBookmarks } from '../../bookmarks/redux/bookmarkSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { Pagination } from '../../../shared/components/ui/Pagination';
import type { ReferenceItem } from '../../../core/types/domain';
import { fetchReferenceGroup } from '../../references/redux/referenceSlice';
import { fetchCompanies } from '../../companies/redux/companySlice';
// import { GfgLogoIcon, LeetCodeLogoIcon, HackerRankLogoIcon } from '../../../shared/components/ui/PlatformIcons';
import { useGoogleOAuthHandler } from '../../auth/hooks/useGoogleOAuthHandler';
import { toast } from 'react-hot-toast';

const DEFAULT_TOPICS: ReferenceItem[] = [
  { id: 9, refGroupCode: 'TOPIC', refCode: 'ARRAY', refName: 'Arrays', isActive: true },
  { id: 10, refGroupCode: 'TOPIC', refCode: 'STRING', refName: 'Strings', isActive: true },
  { id: 11, refGroupCode: 'TOPIC', refCode: 'LINKEDLIST', refName: 'Linked List', isActive: true },
  { id: 12, refGroupCode: 'TOPIC', refCode: 'STACK', refName: 'Stack', isActive: true },
  { id: 13, refGroupCode: 'TOPIC', refCode: 'QUEUE', refName: 'Queue', isActive: true },
  { id: 14, refGroupCode: 'TOPIC', refCode: 'TREE', refName: 'Tree', isActive: true },
  { id: 15, refGroupCode: 'TOPIC', refCode: 'GRAPH', refName: 'Graph', isActive: true },
  { id: 16, refGroupCode: 'TOPIC', refCode: 'DYNAMICPROGRAMMING', refName: 'Dynamic Programming', isActive: true },
  { id: 17, refGroupCode: 'TOPIC', refCode: 'HASHING', refName: 'Hashing', isActive: true },
  { id: 18, refGroupCode: 'TOPIC', refCode: 'SORTING', refName: 'Sorting', isActive: true },
  { id: 19, refGroupCode: 'TOPIC', refCode: 'SEARCHING', refName: 'Searching', isActive: true },
];

const DEFAULT_COMPANIES = [
  { id: 1, name: 'TCS' },
  { id: 2, name: 'Infosys' },
  { id: 3, name: 'Wipro' },
  { id: 4, name: 'Accenture' },
  { id: 5, name: 'Cognizant' },
  { id: 6, name: 'Capgemini' },
  { id: 7, name: 'Tech Mahindra' },
  { id: 8, name: 'HCLTech' },
  { id: 9, name: 'IBM' },
  { id: 10, name: 'Microsoft' },
  { id: 11, name: 'Amazon' },
  { id: 12, name: 'Google' },
  { id: 13, name: 'Meta' },
  { id: 14, name: 'Oracle' },
  { id: 15, name: 'Deloitte' },
  { id: 16, name: 'EY' },
  { id: 17, name: 'KPMG' },
  { id: 18, name: 'PwC' },
  { id: 19, name: 'Zoho' },
  { id: 20, name: 'Freshworks' },
  { id: 21, name: 'ServiceNow' },
  { id: 22, name: 'Salesforce' },
  { id: 23, name: 'Adobe' },
];

export const PracticePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { problems, loading, pagination } = useAppSelector((state) => state.problems);
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const referenceGroups = useAppSelector((state) => state.references.groups);
  const serverCompanies = useAppSelector((state) => state.companies.companies);

  // Intercept Google OAuth callback if backend redirected to /practice?refreshToken=...
  useGoogleOAuthHandler();

  const [activeSheetTab, setActiveSheetTab] = useState<'all' | 'answered' | 'bookmarked'>('all');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Reference/company server state is owned by Redux. Static values remain only as
  // temporary UI fallbacks until Phase 6 removes the legacy fallback datasets.
  const difficulties: ReferenceItem[] =
    referenceGroups.DIFF && referenceGroups.DIFF.length > 0
      ? referenceGroups.DIFF
      : [
          { id: 1, refGroupCode: 'DIFF', refCode: 'DIFF_BASIC', refName: 'Basic', isActive: true },
          { id: 2, refGroupCode: 'DIFF', refCode: 'DIFF_EASY', refName: 'Easy', isActive: true },
          { id: 3, refGroupCode: 'DIFF', refCode: 'DIFF_MED', refName: 'Medium', isActive: true },
          { id: 4, refGroupCode: 'DIFF', refCode: 'DIFF_HARD', refName: 'Hard', isActive: true },
        ];
  const topics: ReferenceItem[] =
    referenceGroups.TOPIC && referenceGroups.TOPIC.length > 0 ? referenceGroups.TOPIC : DEFAULT_TOPICS;
  const companies = serverCompanies.length > 0 ? serverCompanies : DEFAULT_COMPANIES;

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load filter catalog data through Redux instead of calling services from the page.
  useEffect(() => {
    dispatch(fetchReferenceGroup('DIFF'));
    dispatch(fetchReferenceGroup('TOPIC'));
    dispatch(fetchCompanies());
  }, [dispatch]);

  // Fetch the current page/filter combination once. Redux deduplicates repeated keys and\n  // the thunk can be aborted when this page leaves the screen or its filters change.\n  useEffect(() => {\n    const topicId = selectedTopic && !isNaN(Number(selectedTopic)) ? Number(selectedTopic) : undefined;\n    const difficultyId = selectedDifficulty && !isNaN(Number(selectedDifficulty)) ? Number(selectedDifficulty) : undefined;\n    const companyId = selectedCompany && !isNaN(Number(selectedCompany)) ? Number(selectedCompany) : undefined;\n\n    const request = dispatch(\n      fetchProblems({\n        search: debouncedSearch.trim() || undefined,\n        searchText: debouncedSearch.trim() || undefined,\n        topic: topicId ? [topicId] : undefined,\n        difficulty: difficultyId ? [difficultyId] : undefined,\n        level: difficultyId ? [difficultyId] : undefined,\n        company: companyId ? [companyId] : undefined,\n        companies: companyId ? [companyId] : undefined,\n        page: currentPage,\n        limit: pageSize,\n      })\n    );\n\n    return () => {\n      request.abort();\n    };\n  }, [dispatch, debouncedSearch, selectedTopic, selectedDifficulty, selectedCompany, currentPage]);\n\n  useEffect(() => {\n    if (isAuthenticated) {\n      dispatch(fetchBookmarks());\n    }\n  }, [dispatch, isAuthenticated]);\n
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchInput);
    setCurrentPage(1);
  };

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTopic(e.target.value);
    setCurrentPage(1);
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCompany(e.target.value);
    setCurrentPage(1);
  };

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDifficulty(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 300, behavior: 'smooth' });
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

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedTopic('');
    setSelectedDifficulty('');
    setSelectedCompany('');
    setActiveSheetTab('all');
    setCurrentPage(1);
    dispatch(resetFilters());
  };

  // Client-side Tab Filtering for Answered / Bookmarked
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
              Bookmarked ★
            </button>
          </div>

          {/* Quick Stats Progress */}
          <div className="flex items-center gap-4 text-xs font-sans">
            <div className="flex items-center gap-2 bg-[#202225] px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-gray-400">Solved:</span>
              <span className="font-bold text-[#A3E635]">
                {solvedCount} / {problems.length}
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
              onChange={(e) => setSearchInput(e.target.value)}
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
            title="No practice problems found"
            description="No problem matches your search criteria or filter options."
            actionText="Reset All Filters"
            onAction={handleResetFilters}
            icon={<i className="fa-solid fa-code text-2xl text-gray-500"></i>}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {displayedProblems.map((problem) => {
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
                          {problem.difficulty || 'Medium'}
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
            totalPages={
              activeSheetTab === 'all'
                ? pagination.totalPages || Math.ceil((pagination.total || 0) / pageSize) || 1
                : Math.ceil((displayedProblems.length || 0) / pageSize) || 1
            }
            totalElements={activeSheetTab === 'all' ? pagination.total : displayedProblems.length}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default PracticePage;
