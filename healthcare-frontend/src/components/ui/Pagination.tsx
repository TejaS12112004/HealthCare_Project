import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;         // 0-indexed or 1-indexed — tell via `oneBased`
  totalPages: number;
  onPageChange: (page: number) => void;
  oneBased?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  oneBased = false,
  className,
}) => {
  const page = oneBased ? currentPage : currentPage + 1; // internal: 1-indexed for display
  const total = totalPages;

  if (total <= 1) return null;

  /* Generate page numbers with ellipsis */
  const getPages = (): (number | '…')[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '…', total];
    if (page >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '…', page - 1, page, page + 1, '…', total];
  };

  const pages = getPages();
  const isFirst = page === 1;
  const isLast = page === total;

  const toExternal = (p: number) => oneBased ? p : p - 1;

  return (
    <div className={cn('flex items-center justify-between gap-4 py-4 px-6 border-t border-ink/5', className)}>
      {/* Left: count info */}
      <p className="text-xs font-medium text-ink/50 font-body">
        Page <span className="font-bold text-ink">{page}</span> of{' '}
        <span className="font-bold text-ink">{total}</span>
      </p>

      {/* Center: page buttons */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          type="button"
          disabled={isFirst}
          onClick={() => !isFirst && onPageChange(toExternal(page - 1))}
          className={cn(
            'h-8 w-8 rounded-lg flex items-center justify-center text-sm transition-colors',
            isFirst
              ? 'text-ink/20 cursor-not-allowed'
              : 'text-ink/60 hover:bg-bg hover:text-ink border border-transparent hover:border-ink/10'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="h-8 w-8 flex items-center justify-center text-xs text-ink/30 font-medium">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(toExternal(p as number))}
              className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all',
                p === page
                  ? 'bg-accent text-white shadow-sm font-bold'
                  : 'text-ink/60 hover:bg-bg hover:text-ink border border-transparent hover:border-ink/10'
              )}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          type="button"
          disabled={isLast}
          onClick={() => !isLast && onPageChange(toExternal(page + 1))}
          className={cn(
            'h-8 w-8 rounded-lg flex items-center justify-center text-sm transition-colors',
            isLast
              ? 'text-ink/20 cursor-not-allowed'
              : 'text-ink/60 hover:bg-bg hover:text-ink border border-transparent hover:border-ink/10'
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
