import React, { useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchCompanyBySlug, fetchCompanyProblems } from '../redux/companySlice';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { toggleSolveProblem } from '../../problems/redux/problemSlice';
import { toggleBookmarkItem } from '../../bookmarks/redux/bookmarkSlice';
import { openAuthModal } from '../../auth/redux/authSlice';
import { tokenStorage } from '../../../core/security/tokenStorage';
import { toast } from 'react-hot-toast';

const fallbackLogos: Record<string, string> = {
  accenture: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg',
  infosys: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg',
  'tcs-nqt': 'https://cdn.worldvectorlogo.com/logos/tata-consultancy-services.svg',
  tcs: 'https://cdn.worldvectorlogo.com/logos/tata-consultancy-services.svg',
  adobe: 'https://gurucodes-data.pages.dev/img/companies/adobe.png',
};

export const CompanyDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const { selectedCompany: company, companyProblems, loading } = useAppSelector((state) => state.companies);
  const { bookmarks } = useAppSelector((state) => state.bookmarks);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const isUserAuth = isAuthenticated || Boolean(tokenStorage.getAccessToken() || tokenStorage.getRefreshToken());
  const location = useLocation();
  const fromPatterns = (location.state as any)?.from === 'company-patterns';

  useEffect(() => {\n    if (!slug) return;\n\n    const request = dispatch(fetchCompanyBySlug(slug));\n    return () => {\n      request.abort();\n    };\n  }, [dispatch, slug]);\n\n  const companyId = company?.id;\n  const companyName = company?.name;\n\n  useEffect(() => {\n    if (companyId === undefined && !companyName) return;\n\n    const request = dispatch(fetchCompanyProblems({ id: companyId, name: companyName }));\n    return () => {\n      request.abort();\n    };\n  }, [dispatch, companyId, companyName]);\n
  const handleSolveToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isUserAuth) {
      toast.error('Please log in to track your solved problems');
      dispatch(openAuthModal({ mode: 'login' }));
      return;
    }
    dispatch(toggleSolveProblem(id));
    toast.success('Problem solved status updated');
  };

  const handleBookmarkToggle = (q: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isUserAuth) {
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
        category: q.topic || company?.name || 'DSA',
      })
    );
    toast.success('Bookmark updated');
  };

  if (loading || !company) {
    return (
      <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full p-8 font-sans">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const companySlug =
    (company.slug && isNaN(Number(company.slug)) ? company.slug : null) ||
    company.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') ||
    (company.id ? String(company.id) : '') ||
    slug ||
    'tcs';

  const logoUrl =
    company.logo ||
    fallbackLogos[companySlug] ||
    fallbackLogos[company.name?.toLowerCase() || ''] ||
    fallbackLogos[String(company.id)] ||
    `https://gurucodes-data.pages.dev/img/companies/${companySlug}.png`;

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full font-sans text-gray-200 py-6 px-4 sm:px-6 lg:px-8">
      
      {/* 1. BACK BUTTON */}
      <div>
        <Link
          to={fromPatterns ? "/company-patterns" : "/companies"}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-300 hover:text-[#A3E635] transition-all bg-[#202225] border border-white/10 hover:border-[#A3E635]/40 px-4.5 py-2.5 rounded-xl shadow-md group"
        >
          <i className="fa-solid fa-arrow-left text-xs text-[#A3E635] group-hover:-translate-x-1 transition-transform"></i>
          <span>{fromPatterns ? "Back to Exam Patterns" : "Back to Companies"}</span>
        </Link>
      </div>

      {/* 2. HERO COMPANY HEADER CARD */}
      <div className="p-6 sm:p-8 bg-[#202225] border border-white/10 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        
        {/* Subtle Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#A3E635]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white p-3 flex items-center justify-center border border-white/20 shadow-md shrink-0 overflow-hidden">
            <img
              src={logoUrl}
              alt={company.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (fallbackLogos[companySlug] && target.src !== fallbackLogos[companySlug]) {
                  target.src = fallbackLogos[companySlug];
                } else {
                  target.src = `https://logo.clearbit.com/${companySlug.replace('-nqt', '')}.com`;
                }
              }}
            />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-heading tracking-tight break-words mb-1">
              {company.name} <span className="text-[#A3E635]">Placement Guide</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 font-sans flex flex-wrap items-center gap-2">
              <span>{company.industry || 'Information Technology'}</span>
              <span>•</span>
              <span>HQ: {company.headquarters || 'Global'}</span>
            </p>
          </div>
        </div>

        {/* Quick Action & Stat Chips */}
        <div className="flex flex-wrap items-center gap-3 relative z-10 w-full md:w-auto">
          <div className="px-4 py-2.5 bg-[#121113] border border-white/10 rounded-xl text-center font-mono flex-1 md:flex-none">
            <span className="text-[10px] text-gray-400 block uppercase">Tagged Problems</span>
            <span className="text-sm font-bold text-[#A3E635]">{company.problemCount || companyProblems.length} Questions</span>
          </div>

          <Link
            to={`/company-patterns/${companySlug}`}
            className="inline-flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl bg-[#A3E635] hover:bg-[#84CC16] text-xs font-bold text-black transition-all shadow-md font-sans shrink-0"
          >
            <i className="fa-solid fa-list-check text-black text-xs"></i>
            <span>Exam Pattern</span>
          </Link>
        </div>

      </div>

      {/* 3. INTERVIEW ROUND BREAKDOWN */}
      {company.rounds && company.rounds.length > 0 && (
        <div className="p-6 sm:p-8 bg-[#202225] border border-white/10 rounded-2xl shadow-xl flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A3E635]/10 border border-[#A3E635]/30 flex items-center justify-center text-[#A3E635]">
              <i className="fa-solid fa-layer-group text-base"></i>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-heading font-bold text-white">
                Interview Round Breakdown
              </h2>
              <p className="text-xs text-gray-400 font-sans">
                Typical selection process rounds for {company.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {company.rounds.map((round, idx) => (
              <div
                key={idx}
                className="p-5 bg-[#121113] border border-white/10 hover:border-[#A3E635]/40 rounded-xl text-xs sm:text-sm flex flex-col gap-2 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#A3E635]/15 border border-[#A3E635]/30 text-[#A3E635] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-white font-heading">
                    {round.name}
                  </span>
                </div>
                <p className="text-gray-300 leading-relaxed font-sans text-xs pt-1">
                  {round.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MOST FREQUENTLY ASKED PROBLEMS (EXACT PRACTICE SHEET LAYOUT) */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A3E635]/10 border border-[#A3E635]/30 flex items-center justify-center text-[#A3E635]">
              <i className="fa-solid fa-code text-base"></i>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-heading font-bold text-white">
                Most Frequently Asked {company.name} Problems
              </h2>
              <p className="text-xs text-gray-400 font-sans">
                Practice official previous year interview questions
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-[#A3E635] bg-[#A3E635]/10 border border-[#A3E635]/20 px-3 py-1.5 rounded-xl">
            {companyProblems.length} Questions
          </span>
        </div>

        {/* Practice Sheet Styled Problem Cards Container */}
        <div className="p-6 bg-[#202225] border border-white/10 rounded-2xl shadow-xl flex flex-col gap-3">
          {companyProblems.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <i className="fa-solid fa-folder-open text-4xl mb-3 text-gray-500"></i>
              <p className="text-sm font-medium">No problems found for this company yet.</p>
            </div>
          ) : (
            companyProblems.map((q) => {
              const isBookmarked = bookmarks.some((b) => b.itemId === q.id);
              const targetSlug = q.slug || q.id;

              return (
                <div
                  key={q.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#121113] hover:bg-[#1c1a1e] border border-white/10 hover:border-white/30 rounded-xl transition-all gap-3 shadow-md group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Tick / Untick Circle Button */}
                    <button
                      onClick={(e) => handleSolveToggle(q.id, e)}
                      className={`text-xl transition-colors shrink-0 cursor-pointer ${
                        q.isSolved ? 'text-[#A3E635]' : 'text-gray-600 hover:text-gray-400'
                      }`}
                      title={q.isSolved ? 'Mark as Not Answered' : 'Mark as Answered'}
                    >
                      <i className={`fa-solid ${q.isSolved ? 'fa-circle-check' : 'fa-circle'}`}></i>
                    </button>

                    {/* Bookmark Star Button */}
                    <button
                      onClick={(e) => handleBookmarkToggle(q, e)}
                      className={`p-2 rounded-lg border transition-all text-xs shrink-0 cursor-pointer ${
                        isBookmarked
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : 'bg-[#202225] border-white/10 text-gray-500 hover:text-amber-400 hover:border-amber-400/40'
                      }`}
                      title={isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
                    >
                      <i className={`fa-${isBookmarked ? 'solid' : 'regular'} fa-star`}></i>
                    </button>

                    {/* Title & Topic */}
                    <div className="flex flex-col min-w-0">
                      <Link
                        to={`/problems/${targetSlug}`}
                        className="text-sm sm:text-base font-semibold text-white hover:text-[#A3E635] transition-colors truncate font-sans"
                      >
                        {q.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-mono text-gray-400 bg-[#202225] px-2.5 py-0.5 rounded-md border border-white/5">
                          {q.topic || q.category || company.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    {/* Difficulty Badge */}
                    <span
                      className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                        (q.difficulty || '').toLowerCase().includes('easy') ||
                        (q.difficulty || '').toLowerCase().includes('basic')
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : (q.difficulty || '').toLowerCase().includes('medium')
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                      }`}
                    >
                      {q.difficulty || 'Easy'}
                    </span>

                    {/* Solve Problem Button */}
                    <Link
                      to={`/problems/${targetSlug}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#A3E635] hover:bg-[#84CC16] text-xs font-bold text-black transition-all shadow-sm font-sans"
                    >
                      <span>Solve Problem</span>
                      <i className="fa-solid fa-chevron-right text-[10px]"></i>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
