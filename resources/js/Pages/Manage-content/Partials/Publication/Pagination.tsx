interface PaginationProps {
  pagination: {
    current_page: number;
    last_page: number;
  };
  theme: string;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  pagination,
  theme,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="p-4 flex justify-between items-center text-sm border-t border-gray-100 dark:border-neutral-700">
      <button
        disabled={pagination.current_page === 1}
        onClick={() => onPageChange(Math.max(1, pagination.current_page - 1))}
        className={`px-3 py-1 rounded border disabled:opacity-50 transition-colors ${
          theme === "dark"
            ? "border-neutral-700 hover:bg-neutral-700 text-gray-300"
            : "border-gray-200 hover:bg-gray-50 text-gray-700"
        }`}
      >
        Previous
      </button>
      <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
        Page {pagination.current_page} of {pagination.last_page}
      </span>
      <button
        disabled={pagination.current_page === pagination.last_page}
        onClick={() =>
          onPageChange(
            Math.min(pagination.last_page, pagination.current_page + 1)
          )
        }
        className={`px-3 py-1 rounded border disabled:opacity-50 transition-colors ${
          theme === "dark"
            ? "border-neutral-700 hover:bg-neutral-700 text-gray-300"
            : "border-gray-200 hover:bg-gray-50 text-gray-700"
        }`}
      >
        Next
      </button>
    </div>
  );
}
