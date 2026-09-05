import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { motion } from 'framer-motion';

export interface ProblemCardProps {
  problem: {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
    topic: string;
    acceptanceRate?: string;
    isSolved?: boolean;
    isBookmarked?: boolean;
    companies?: string[];
  };
  onToggleSolve?: (id: string) => void;
  onToggleBookmark?: (id: string) => void;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({
  problem,
  onToggleSolve,
  onToggleBookmark,
}) => {
  const getDifficultyVariant = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy':
        return 'easy';
      case 'medium':
        return 'medium';
      case 'hard':
        return 'hard';
      default:
        return 'neutral';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -1 }}
      className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-[#202225] hover:bg-[#2f3136] border border-white/10 hover:border-white/20 rounded-xl transition-all duration-150 gap-3"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <button
          onClick={() => onToggleSolve && onToggleSolve(problem.id)}
          className="text-gray-600 hover:text-[#A3E635] transition-colors shrink-0 focus:outline-none text-base"
          title={problem.isSolved ? 'Mark as unsolved' : 'Mark as solved'}
        >
          {problem.isSolved ? (
            <i className="fa-solid fa-circle-check text-[#A3E635]"></i>
          ) : (
            <i className="fa-regular fa-circle text-gray-500 hover:text-gray-300"></i>
          )}
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <Link
              to={`/problems/${problem.slug}`}
              className="text-sm font-semibold text-gray-200 hover:text-[#A3E635] transition-colors truncate"
            >
              {problem.title}
            </Link>
            <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[11px] font-mono text-gray-400">{problem.topic}</span>
            {problem.acceptanceRate && (
              <>
                <span className="text-gray-700">•</span>
                <span className="text-[11px] text-gray-500 font-mono">Acc: {problem.acceptanceRate}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
        {/* Solution & Video Quick Actions */}
        <Link
          to={`/problems/${problem.slug}`}
          className="p-1.5 text-red-400 hover:text-red-300 transition-colors text-sm"
          title="Video Explanation"
        >
          <i className="fa-solid fa-circle-play"></i>
        </Link>

        {problem.companies && problem.companies.length > 0 && (
          <div className="hidden md:flex items-center gap-1">
            {problem.companies.slice(0, 2).map((comp) => (
              <span
                key={comp}
                className="text-[10px] font-mono bg-[#121113] text-gray-400 border border-white/10 px-2 py-0.5 rounded"
              >
                {comp}
              </span>
            ))}
          </div>
        )}

        <Badge variant={getDifficultyVariant(problem.difficulty)}>
          {problem.difficulty}
        </Badge>

        <button
          onClick={() => onToggleBookmark && onToggleBookmark(problem.id)}
          className={`p-1.5 rounded-lg border transition-colors ${
            problem.isBookmarked
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'border-white/10 text-gray-500 hover:text-gray-300 hover:bg-[#121113]'
          }`}
          title="Save to bookmarks"
        >
          <i className={`fa-${problem.isBookmarked ? 'solid' : 'regular'} fa-star text-sm ${problem.isBookmarked ? 'text-amber-400' : ''}`}></i>
        </button>
      </div>
    </motion.div>
  );
};
