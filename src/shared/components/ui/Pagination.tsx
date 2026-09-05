import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalElements?: number;
  pageSize?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalElements,
  pageSize,
  className = '',
}) => {
  // If totalElements is 0 and totalPages is 0/1, show empty status
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, currentPage || 1), safeTotalPages);

  // Compute page numbers with smart ellipsis
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    let start = Math.max(2, safeCurrentPage - 1);
    let end = Math.min(safeTotalPages - 1, safeCurrentPage + 1);

    if (safeCurrentPage <= 3) {
      start = 2;
      end = 4;
    } else if (safeCurrentPage >= safeTotalPages - 2) {
      start = safeTotalPages - 3;
      end = safeTotalPages - 1;
    }

    if (start > 2) {
      pages.push('ellipsis');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < safeTotalPages - 1) {
      pages.push('ellipsis');
    }

    pages.push(safeTotalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Compute item range
  const startItem = totalElements !== undefined && pageSize
    ? totalElements === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
    : null;
  const endItem = totalElements !== undefined && pageSize
    ? Math.min(safeCurrentPage * pageSize, totalElements)
    : null;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#111827]/90 backdrop-blur-md border border-white/10 rounded-xl text-xs text-gray-400 font-sans shadow-md ${className}`}
    >
      {/* Item Counts and Page Info */}
      <div className="flex items-center gap-2">
        {totalElements !== undefined && startItem !== null && endItem !== null ? (
          <span>
            Showing <strong className="text-white">{startItem}</strong> to{' '}
            <strong className="text-white">{endItem}</strong> of{' '}
            <strong className="text-white">{totalElements}</strong> items
          </span>
        ) : (
          <span>
            Page <strong className="text-white">{safeCurrentPage}</strong> of{' '}
            <strong className="text-white">{safeTotalPages}</strong>
          </span>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          aria-label="First page"
          title="First Page"
          className="p-1.5 rounded-lg border border-white/10 bg-[#090A0C]/80 hover:bg-white/10 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage === 1}
          aria-label="Previous page"
          title="Previous Page"
          className="p-1.5 px-2.5 rounded-lg border border-white/10 bg-[#090A0C]/80 hover:bg-white/10 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer font-medium"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-gray-500 font-bold select-none">
                  •••
                </span>
              );
            }
            const isActive = p === safeCurrentPage;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-8 h-8 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'bg-[#A3E635] text-black shadow-md shadow-[#A3E635]/20 font-extrabold'
                    : 'border border-white/10 bg-[#090A0C]/80 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage >= safeTotalPages}
          aria-label="Next page"
          title="Next Page"
          className="p-1.5 px-2.5 rounded-lg border border-white/10 bg-[#090A0C]/80 hover:bg-white/10 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer font-medium"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(safeTotalPages)}
          disabled={safeCurrentPage >= safeTotalPages}
          aria-label="Last page"
          title="Last Page"
          className="p-1.5 rounded-lg border border-white/10 bg-[#090A0C]/80 hover:bg-white/10 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

