import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

interface PaginationButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  active?: boolean;
  ariaLabel?: string;
}

const PaginationButton = ({
  onClick,
  disabled,
  children,
  active = false,
  ariaLabel,
}: PaginationButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    aria-current={active ? "page" : undefined}
    className={`
      flex items-center justify-center min-w-11 h-11 rounded-xl font-mono text-[11px] font-black tracking-widest transition-all border cursor-pointer
      ${
        active
          ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/20"
          : "bg-[#0a0a0a] border-white/5 text-gray-500 hover:border-white/20 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
      }
    `}
  >
    {children}
  </button>
);

const getPageItems = (
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage]);
  if (currentPage > 1) pages.add(currentPage - 1);
  if (currentPage < totalPages) pages.add(currentPage + 1);

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];

  for (let i = 0; i < sorted.length; i++) {
    const page = sorted[i];
    const prev = sorted[i - 1];
    if (prev !== undefined && page - prev > 1) {
      result.push("ellipsis");
    }
    result.push(page);
  }

  return result;
};

const Pagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  isLoading = false,
}: PaginationProps) => {
  const safePageSize = Math.max(1, itemsPerPage);
  const totalPages = Math.ceil(totalItems / safePageSize);

  if (totalPages <= 1) return null;

  const activePage = Math.min(Math.max(1, currentPage), totalPages);
  const canGoBack = activePage > 1 && !isLoading;
  const canGoForward = activePage < totalPages && !isLoading;

  const startEntry = (activePage - 1) * safePageSize + 1;
  const endEntry = Math.min(activePage * safePageSize, totalItems);
  const pageItems = getPageItems(activePage, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-8 px-6 border-t border-white/5">
      {/* Telemetry Info */}
      <div className="flex flex-col items-center sm:items-start gap-1">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
          Data Stream Range
        </p>
        <p className="text-xs font-mono text-gray-400">
          Showing <span className="text-white">{startEntry}</span> to{" "}
          <span className="text-white">{endEntry}</span> of{" "}
          <span className="text-blue-500">{totalItems}</span> entries
        </p>
      </div>

      {/* Control Cluster */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 mr-2">
          <PaginationButton
            onClick={() => onPageChange(1)}
            disabled={!canGoBack}
            ariaLabel="First page"
          >
            <ChevronsLeft size={16} />
          </PaginationButton>
          <PaginationButton
            onClick={() => onPageChange(activePage - 1)}
            disabled={!canGoBack}
            ariaLabel="Previous page"
          >
            <ChevronLeft size={16} />
          </PaginationButton>
        </div>

        {/* Page Numbers */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
          {pageItems.map((item, idx) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-2.5 text-xs font-mono text-gray-600 select-none"
              >
                …
              </span>
            ) : (
              <PaginationButton
                key={item}
                active={activePage === item}
                disabled={isLoading}
                onClick={() => onPageChange(item)}
                ariaLabel={`Page ${item}`}
              >
                {item.toString().padStart(2, "0")}
              </PaginationButton>
            ),
          )}
        </div>

        <div className="flex items-center gap-1 ml-2">
          <PaginationButton
            onClick={() => onPageChange(activePage + 1)}
            disabled={!canGoForward}
            ariaLabel="Next page"
          >
            <ChevronRight size={16} />
          </PaginationButton>
          <PaginationButton
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoForward}
            ariaLabel="Last page"
          >
            <ChevronsRight size={16} />
          </PaginationButton>
        </div>
      </div>
    </div>
  );
};

export default Pagination;