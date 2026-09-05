import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchCompanies } from '../redux/companySlice';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { EmptyState } from '../../../shared/components/ui/EmptyState';

const fallbackLogos: Record<string, string> = {
  accenture: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg',
  infosys: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg',
  'tcs-nqt': 'https://cdn.worldvectorlogo.com/logos/tata-consultancy-services.svg',
  tcs: 'https://cdn.worldvectorlogo.com/logos/tata-consultancy-services.svg',
  adobe: 'https://gurucodes-data.pages.dev/img/companies/adobe.png',
};

export const CompanyList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { companies, loading } = useAppSelector((state) => state.companies);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col items-center pb-20 font-sans">
      
      {/* Hero Section */}
      <section id="companiesshero" className="relative mx-auto mt-16 max-w-7xl px-6 text-center md:px-8">
        <h1 className="animate-fade-in -translate-y-4 text-balance whitespace-nowrap bg-gradient-to-br from-white from-30% to-white/40 bg-clip-text py-6 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-none tracking-tighter text-transparent opacity-100 font-heading">
          Company Wise Questions
        </h1>
        <p className="animate-fade-in mb-6 -translate-y-4 text-balance text-lg tracking-tight text-gray-400 opacity-100 md:text-xl font-sans">
          Get the previous year questions of all the companies
        </p>
        <div className="flex justify-center">
          <div data-orientation="horizontal" role="none" className="shrink-0 h-0.5 rounded-lg w-60 bg-gradient-to-r from-purple-600 via-violet-500 to-pink-600 bg-no-repeat"></div>
        </div>
      </section>

      {/* CLEAN RECTANGULAR CONTAINER BOX (MINIMAL CONTENT) */}
      <div className="w-full max-w-2xl px-4 mt-8">
        <div className="bg-[#121316] border border-white/10 hover:border-[#A3E635]/40 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-transparent border border-white/10 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-list-check text-base text-[#A3E635]"></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Company Exam Patterns
              </h3>
              <p className="text-xs text-gray-400 font-sans">
                Explore recruitment exam patterns &amp; syllabus
              </p>
            </div>
          </div>

          <Link
            to="/company-patterns"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A3E635] hover:bg-[#84CC16] text-xs font-bold text-black transition-all font-sans shrink-0"
          >
            <span>Explore</span>
            <i className="fa-solid fa-chevron-right text-[10px]"></i>
          </Link>
        </div>
      </div>

      {/* Search Input Filter */}
      <div className="w-full max-w-xs sm:max-w-md mt-6 px-4">
        <div className="relative w-full">
          <i className="fa-solid fa-magnifying-glass text-xs absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"></i>
          <input
            type="text"
            placeholder="Search companies by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#121316] border border-white/10 text-xs text-gray-200 placeholder-gray-500 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-[#A3E635] transition-colors"
          />
        </div>
      </div>

      {/* Companies Grid - Exactly 3 per Row on Medium screens, max-w-2xl */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 m-2 max-w-2xl mt-10 w-full px-4">
          <Skeleton className="h-44 w-full rounded-lg" count={6} />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No companies found"
            description="No company matches your current search term."
            actionText="Clear Search"
            onAction={() => setSearchTerm('')}
            icon={<i className="fa-solid fa-building text-2xl text-gray-500"></i>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 m-2 max-w-2xl mt-10 w-full px-4">
          {filteredCompanies.map((company) => {
            const companySlug = company.slug || (company.id ? String(company.id) : company.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
            const logoUrl = company.logo || (company as any).logoUrl || fallbackLogos[companySlug] || fallbackLogos[company.name?.toLowerCase()] || `https://gurucodes-data.pages.dev/img/companies/${companySlug}.png`;

            return (
              <Link
                key={company.id || company.name}
                to={`/companies/${companySlug}`}
                className="h-full p-2 border border-white/10 hover:border-white/30 rounded-lg bg-[#121316] hover:bg-[#1a1c22] transition-all group shadow-md"
              >
                <div className="flex h-full flex-col w-full items-center truncate">
                  <img
                    className="rounded-lg object-contain h-32 p-6 bg-white aspect-square w-full shadow-sm"
                    width="200"
                    height="200"
                    alt={company.name}
                    src={logoUrl}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (fallbackLogos[company.slug] && target.src !== fallbackLogos[company.slug]) {
                        target.src = fallbackLogos[company.slug];
                      } else {
                        target.src = `https://logo.clearbit.com/${company.slug.replace('-nqt', '')}.com`;
                      }
                    }}
                  />
                  <div className="text-wrap w-full text-center mb-3 mt-3">
                    <p className="text-lg font-semibold text-white font-sans tracking-tight">
                      {company.name}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
};
