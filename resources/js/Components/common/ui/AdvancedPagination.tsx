import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface AdvancedPaginationProps {
  currentPage: number;
  lastPage: number;
  total?: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  t: (key: string) => string;
  isLoading?: boolean;
}

export default function AdvancedPagination({
  currentPage,
  lastPage,
  total,
  perPage,
  onPageChange,
  onPerPageChange,
  t,
  isLoading = false,
}: AdvancedPaginationProps) {
  const getPageNumbers = () => {
    const pages = [];
    const showMax = 5;

    if (lastPage <= showMax) {
      for (let i = 1; i <= lastPage; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis-1");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(lastPage - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < lastPage - 2) pages.push("ellipsis-2");
      if (!pages.includes(lastPage)) pages.push(lastPage);
    }
    return pages;
  };

  const perPageOptions = [10, 25, 50, 100];

  return (
    <div className="px-6 py-4 border-t border-gray-100 dark:border-neutral-700/50 flex flex-col lg:flex-row items-center justify-between gap-4">
      {/* Per Page Selector & Info */}
      <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span>{t("common.pagination.show") || "Mostrar"}</span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg px-2 py-1 text-sm focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            {perPageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span>{t("common.pagination.entries") || "entradas"}</span>
        </div>
        {total !== undefined && (
          <span className="hidden sm:inline">
            {t("common.pagination.info")
              ? t("common.pagination.info", {
                  from: (currentPage - 1) * perPage + 1,
                  to: Math.min(currentPage * perPage, total),
                  total,
                } as any)
              : `Mostrando ${(currentPage - 1) * perPage + 1} a ${Math.min(currentPage * perPage, total)} de ${total}`}
          </span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="p-2 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors"
          title={t("common.previous")}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((page, idx) => {
            if (typeof page === "string") {
              return (
                <div key={`ellipsis-${idx}`} className="p-2">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </div>
              );
            }
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                disabled={isLoading}
                className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-all ${
                  currentPage === page
                    ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                    : "hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage || isLoading}
          className="p-2 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors"
          title={t("common.next")}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
