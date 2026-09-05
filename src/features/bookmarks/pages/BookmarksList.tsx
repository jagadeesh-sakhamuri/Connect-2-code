import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchBookmarks, toggleBookmarkItem } from '../redux/bookmarkSlice';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { Badge } from '../../../shared/components/ui/Badge';
import { toast } from 'react-hot-toast';

export const BookmarksList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const [filterType, setFilterType] = useState<'ALL' | 'PROBLEM' | 'APTITUDE' | 'COMPANY'>('ALL');

  useEffect(() => {
    dispatch(fetchBookmarks());
  }, [dispatch]);

  const handleRemove = (itemId: string) => {
    dispatch(toggleBookmarkItem({ itemId }));
    toast.success('Bookmark removed');
  };

  const filteredBookmarks = bookmarks.filter((bm) => {
    if (filterType === 'ALL') return true;
    return bm.type === filterType;
  });

  const getTargetUrl = (bm: any) => {
    if (bm.type === 'PROBLEM') return `/problems/${bm.itemId}`;
    if (bm.type === 'APTITUDE') return `/aptitude`;
    if (bm.type === 'COMPANY') return `/companies/${bm.itemId}`;
    return '/practice';
  };

  return (
    <div className="w-full flex flex-col items-center pb-16 font-sans">
      {/* BeyondBasics Hero Header - Exactly Matching Companies Page */}
      <section className="relative mx-auto mt-16 max-w-7xl px-6 text-center md:px-8 flex flex-col items-center">
        <h1 className="animate-fade-in -translate-y-4 text-balance whitespace-nowrap bg-gradient-to-br from-white from-30% to-white/40 bg-clip-text py-6 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-none tracking-tighter text-transparent opacity-100 font-heading">
          Saved Bookmarks
        </h1>
        <p className="animate-fade-in mb-6 -translate-y-4 text-balance text-lg tracking-tight text-gray-400 opacity-100 md:text-xl font-sans">
          Quick access to your saved DSA problems, aptitude questions, and company guides
        </p>
        <div className="flex justify-center mb-6">
          <div className="shrink-0 bg-white/10 h-0.5 rounded-lg w-60 bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC]"></div>
        </div>

        {/* Filter Type Tabs */}
        <div className="flex items-center justify-center gap-2 bg-[#202225] p-1.5 rounded-xl border border-white/10 shadow-md mt-2">
          {(['ALL', 'PROBLEM', 'APTITUDE', 'COMPANY'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === t
                  ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t === 'ALL' ? 'All Saved' : t === 'PROBLEM' ? 'DSA Problems' : t === 'APTITUDE' ? 'Aptitude' : 'Companies'}
            </button>
          ))}
        </div>
      </section>

      {/* Bookmarks List Container - Matching Companies Page Card Hover Design */}
      <div className="w-full max-w-4xl px-4 mt-8">
        {filteredBookmarks.length === 0 ? (
          <EmptyState
            title="No bookmarks saved"
            description="Click the star bookmark icon on any problem, aptitude, or company page to save it for quick revision."
            icon={<i className="fa-solid fa-star text-2xl text-amber-400"></i>}
          />
        ) : (
          <div className="flex flex-col gap-3.5">
            {filteredBookmarks.map((bm) => (
              <div
                key={bm.id}
                className="p-4 border border-white/10 hover:border-white/30 bg-[#202225] hover:bg-[#2f3136] rounded-lg flex items-center justify-between gap-4 transition-all shadow-md group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg shrink-0">
                    <i className="fa-solid fa-star text-sm"></i>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={getTargetUrl(bm)}
                        className="text-base font-semibold text-white group-hover:text-white transition-colors truncate font-sans tracking-tight"
                      >
                        {bm.title}
                      </Link>
                      <Badge variant="primary">{bm.type}</Badge>
                    </div>
                    {bm.difficulty && (
                      <span className="text-xs font-mono text-gray-400 mt-0.5 block truncate">
                        Category: {bm.category || 'General'} • Level: {bm.difficulty}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={getTargetUrl(bm)}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors text-sm"
                    title="Open"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  </Link>
                  <button
                    onClick={() => handleRemove(bm.itemId)}
                    className="p-2 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-white/10 transition-colors text-sm cursor-pointer"
                    title="Remove bookmark"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
