import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchProblems } from '../redux/problemSlice';
import { toggleSolvedProblem } from '../../progress/redux/progressSlice';
import { toggleBookmarkItem, fetchBookmarks } from '../../bookmarks/redux/bookmarkSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { toast } from 'react-hot-toast';

export const ProblemList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { problems, loading, error, pagination } = useAppSelector((state) => state.problems);
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const solvedByProblemId = useAppSelector((state) => state.progress.solvedByProblemId);

  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = searchParams.get('page');
  const parsedPage = Number(rawPage || '1');
  const currentPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const pageSize = 50;

  // Sanitize invalid page query parameters (F-031)
  useEffect(() => {
    if (rawPage !== null && (!Number.isInteger(parsedPage) || parsedPage < 1)) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', '1');
        return next;
      }, { replace: true });
    }
  }, [rawPage, parsedPage, setSearchParams]);

  // Normalize out-of-bounds page query parameters when total pages decrease (F-031)
  useEffect(() => {
    if (!loading && pagination.totalPages > 0 && currentPage > pagination.totalPages) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(pagination.totalPages));
        return next;
      }, { replace: true });
    }
  }, [loading, pagination.totalPages, currentPage, setSearchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      if (rawPage && rawPage !== '1') {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('page', '1');
          return next;
        }, { replace: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, rawPage, setSearchParams]);

  useEffect(() => {
    const request = dispatch(
      fetchProblems({
        search: debouncedSearch || undefined,
        searchText: debouncedSearch || undefined,
        page: currentPage,
        limit: pageSize,
      })
    );

    return () => request.abort();
  }, [dispatch, debouncedSearch, currentPage]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchBookmarks());
    }
  }, [dispatch, isAuthenticated]);

  const groupedProblems = useMemo(() => {
    const groups = new Map<string, typeof problems>();
    problems.forEach((problem) => {
      const topic = problem.topic || problem.category || '—';
      const existing = groups.get(topic) || [];
      existing.push(problem);
      groups.set(topic, existing);
    });

    return Array.from(groups.entries()).map(([topic, items], index) => ({
      num: String(index + 1).padStart(2, '0'),
      topic,
      questions: items,
    }));
  }, [problems]);

  const handleSolveToggle = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please log in to track your solved problems');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }

    dispatch(toggleSolvedProblem({ id }));
  };

  const handleBookmarkToggle = (problem: (typeof problems)[number], e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please log in to bookmark problems');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }

    const isCurrentlyBookmarked = bookmarks.some((b) => b.itemId === problem.id);
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

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(page));
      return next;
    }, { replace: true });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <div className="w-full flex flex-col items-center pb-16 font-sans">
      <section className="relative mx-auto mt-16 max-w-7xl px-6 text-center md:px-8 flex flex-col items-center">
        <h1 className="animate-fade-in -translate-y-4 text-balance whitespace-nowrap bg-gradient-to-br from-white from-30% to-white/40 bg-clip-text py-6 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-medium leading-none tracking-tighter text-transparent font-heading">
          DSA Sheet
        </h1>
        <p className="animate-fade-in mb-6 -translate-y-4 text-lg tracking-tight text-gray-400 md:text-xl max-w-2xl">
          Practice coding problems served by the Connect 2 Code backend.
        </p>
        <div className="flex justify-center">
          <div className="shrink-0 h-0.5 rounded-lg w-60 bg-gradient-to-r from-purple-600 via-violet-500 to-pink-600" />
        </div>
      </section>

      <div className="w-full max-w-3xl px-4 mt-8">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search problems..."
          className="w-full bg-[#121316] border border-white/10 text-sm text-gray-200 placeholder-gray-500 rounded-xl px-4 py-3 outline-none focus:border-[#A3E635] transition-colors"
          aria-label="Search problems"
        />
      </div>

      {loading && problems.length === 0 ? (
        <div className="w-full max-w-5xl mt-10 px-4 space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" count={6} />
        </div>
      ) : error && problems.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Unable to load problems"
            description={error}
            actionText="Retry"
            onAction={() => dispatch(fetchProblems({ page: currentPage, limit: pageSize }))}
            icon={<i className="fa-solid fa-triangle-exclamation text-2xl text-gray-500" />}
          />
        </div>
      ) : problems.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No problems found"
            description="The backend returned no problems for this search."
            actionText="Clear Search"
            onAction={() => setSearchInput('')}
            icon={<i className="fa-solid fa-code text-2xl text-gray-500" />}
          />
        </div>
      ) : (
        <div className="w-full max-w-5xl mt-10 px-4 space-y-8">
          {groupedProblems.map((group) => (
            <section key={group.topic} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-[#A3E635] bg-[#A3E635]/10 border border-[#A3E635]/20 px-2.5 py-1 rounded-lg">
                  {group.num}
                </span>
                <h2 className="text-lg sm:text-xl font-heading font-bold text-white">
                  {group.topic}
                </h2>
              </div>

              <div className="bg-[#202225] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                {group.questions.map((problem) => {
                  const solved = solvedByProblemId[problem.id] ?? problem.isSolved;
                  const bookmarked = problem.isBookmarked || bookmarks.some((b) => b.itemId === problem.id);
                  const targetSlug = problem.slug || problem.id;

                  return (
                    <div
                      key={problem.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-white/5 last:border-b-0 hover:bg-white/[0.03]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => handleSolveToggle(problem.id, e)}
                          className={`text-xl shrink-0 ${solved ? 'text-[#A3E635]' : 'text-gray-600 hover:text-gray-400'}`}
                          title={solved ? 'Mark as unsolved' : 'Mark as solved'}
                        >
                          <i className={`fa-solid ${solved ? 'fa-circle-check' : 'fa-circle'}`} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleBookmarkToggle(problem, e)}
                          className={`p-2 rounded-lg border text-xs shrink-0 ${bookmarked ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-[#121113] border-white/10 text-gray-500 hover:text-amber-400'}`}
                          title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
                        >
                          <i className={`fa-${bookmarked ? 'solid' : 'regular'} fa-star`} />
                        </button>

                        <div className="min-w-0">
                          <Link
                            to={`/problems/${targetSlug}`}
                            className="text-sm sm:text-base font-semibold text-white hover:text-[#A3E635] truncate block"
                          >
                            {problem.title}
                          </Link>
                          <div className="text-[11px] text-gray-500 mt-1 font-mono">
                            {problem.slug ? problem.slug : (problem.topic || problem.category || '')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full border text-gray-300 border-white/10">
                          {problem.difficulty || '—'}
                        </span>
                        <Link
                          to={`/problems/${targetSlug}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#A3E635] hover:bg-[#84CC16] text-xs font-bold text-black"
                        >
                          Solve
                          <i className="fa-solid fa-chevron-right text-[10px]" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ProblemList;
