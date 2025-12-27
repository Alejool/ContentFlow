interface PaginationProps {
  pagination: {
    current_page: number;
    last_page: number;
  };

  onPageChange: (page: number) => void;
  t: (key: string) => string;
}

export default function Pagination({
  pagination,

  onPageChange,
  t,
}: PaginationProps) {
  return (
    <div className="p-4 flex justify-between items-center text-sm border-t border-gray-100 dark:border-neutral-700">
      <button
        disabled={pagination.current_page === 1}
        onClick={() => onPageChange(Math.max(1, pagination.current_page - 1))}
        className="px-3 py-1 rounded border disabled:opacity-50 transition-colors border-gray-200 hover:bg-gray-50 text-gray-700 dark:border-neutral-700 dark:hover:bg-neutral-700 dark:text-gray-300"
      >
        {t("pagination.previous")}
      </button>
      <span className="text-gray-600 dark:text-gray-400">
        Page {pagination.current_page} of {pagination.last_page}
      </span>
      <button
        disabled={pagination.current_page === pagination.last_page}
        onClick={() =>
          onPageChange(
            Math.min(pagination.last_page, pagination.current_page + 1)
          )
        }
        className="px-3 py-1 rounded border disabled:opacity-50 transition-colors border-gray-200 hover:bg-gray-50 text-gray-700 dark:border-neutral-700 dark:hover:bg-neutral-700 dark:text-gray-300"
      >
        {t("pagination.next")}
      </button>
    </div>
  );
}
