import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export interface CompanyCardProps {
  company: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    industry: string;
    problemCount: number;
    difficultyBreakdown?: {
      easy: number;
      medium: number;
      hard: number;
    };
  };
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="group flex flex-col justify-between p-5 bg-[#202225] border border-white/10 hover:border-[#A3E635]/40 rounded-xl transition-all duration-200"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#121113] border border-white/10 p-2 flex items-center justify-center shrink-0">
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="w-full h-full object-contain filter invert opacity-90" />
              ) : (
                <i className="fa-solid fa-building text-[#A3E635]"></i>
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-100 group-hover:text-[#A3E635] transition-colors">
                {company.name}
              </h3>
              <p className="text-xs text-gray-400">{company.industry}</p>
            </div>
          </div>
          <span className="text-xs font-mono font-medium text-[#A3E635] bg-[#A3E635]/10 px-2.5 py-1 rounded-full border border-[#A3E635]/20">
            {company.problemCount} Problems
          </span>
        </div>

        {company.difficultyBreakdown && (
          <div className="w-full my-3">
            <div className="flex justify-between text-[11px] text-gray-400 mb-1 font-mono">
              <span className="text-[#A3E635]">Easy: {company.difficultyBreakdown.easy}</span>
              <span className="text-[#f5a623]">Med: {company.difficultyBreakdown.medium}</span>
              <span className="text-[#f87171]">Hard: {company.difficultyBreakdown.hard}</span>
            </div>
            <div className="w-full h-1.5 bg-[#121113] rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${(company.difficultyBreakdown.easy / (company.problemCount || 1)) * 100}%`,
                }}
                className="bg-[#A3E635]"
              />
              <div
                style={{
                  width: `${(company.difficultyBreakdown.medium / (company.problemCount || 1)) * 100}%`,
                }}
                className="bg-[#f5a623]"
              />
              <div
                style={{
                  width: `${(company.difficultyBreakdown.hard / (company.problemCount || 1)) * 100}%`,
                }}
                className="bg-[#f87171]"
              />
            </div>
          </div>
        )}
      </div>

      <Link
        to={`/companies/${company.slug}`}
        className="mt-4 inline-flex items-center justify-between text-xs font-semibold text-gray-300 group-hover:text-[#A3E635] pt-3 border-t border-white/10 transition-colors"
      >
        <span>Explore Hiring Guide & Questions</span>
        <i className="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
      </Link>
    </motion.div>
  );
};
