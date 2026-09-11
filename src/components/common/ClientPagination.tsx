// src/components/common/ClientPagination.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ClientPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const ClientPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: ClientPaginationProps) => {
  if (totalPages <= 1) return null;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-mono font-medium border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-zinc-700 dark:text-gray-300 hover:bg-zinc-50 dark:hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        <ChevronLeft size={14} />
        <span className="hidden sm:inline">Prev</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) =>
          typeof page === "number" ? (
            <button
              key={index}
              onClick={() => onPageChange(page)}
              className={`w-9 h-9 rounded-xl text-xs font-mono font-medium transition-all shadow-sm border ${
                currentPage === page
                  ? "bg-blue-600 dark:bg-emerald-600 text-white border-transparent shadow-md shadow-blue-600/20 dark:shadow-emerald-600/20"
                  : "bg-white dark:bg-white/[0.03] border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-gray-300 hover:bg-zinc-50 dark:hover:bg-white/[0.08]"
              }`}
            >
              {page}
            </button>
          ) : (
            <span
              key={index}
              className="px-2 text-zinc-400 dark:text-gray-600 font-mono text-xs select-none"
            >
              {page}
            </span>
          )
        )}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-mono font-medium border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-zinc-700 dark:text-gray-300 hover:bg-zinc-50 dark:hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={14} />
      </button>
    </div>
  );
};

export default ClientPagination;