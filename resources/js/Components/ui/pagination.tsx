import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/common/utils';

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  prevLabel?: string;
  nextLabel?: string;
}

const Pagination = ({
  page,
  totalPages,
  onPageChange,
  prevLabel = 'Previous page',
  nextLabel = 'Next page',
  className,
  ...props
}: PaginationProps) => (
  <nav
    aria-label="pagination"
    className={cn('flex items-center justify-center gap-2', className)}
    {...props}
  >
    <button
      type="button"
      aria-label={prevLabel}
      disabled={page <= 1}
      onClick={() => onPageChange(page - 1)}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 text-neutral-600 transition-colors hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
    </button>
    <span className="min-w-20 text-center text-sm text-neutral-600 dark:text-neutral-300">
      {page} / {Math.max(totalPages, 1)}
    </span>
    <button
      type="button"
      aria-label={nextLabel}
      disabled={page >= totalPages}
      onClick={() => onPageChange(page + 1)}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 text-neutral-600 transition-colors hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      <ChevronRight className="h-4 w-4" aria-hidden="true" />
    </button>
  </nav>
);

export { Pagination };
