import Select from "@/Components/common/Modern/Select";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface AdvancedPaginationProps {
  currentPage: number;
  lastPage: number;
  total?: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  t: (key: string, options?: any) => string;
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

  const perPageOptions = [8, 12, 16, 24, 28];
  const selectOptions = perPageOptions.map((opt) => ({
    value: opt,
    label: opt.toString(),
  }));

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 px-6 py-4 dark:border-neutral-700/50 lg:flex-row">
      <div className="flex flex-col items-center gap-4 text-sm text-gray-500 dark:text-gray-400 sm:flex-row">
        <div className="flex items-center gap-2">
          <span>{t("common.pagination.show", { defaultValue: "Mostrar" })}</span>
          <div className="w-20">
            <Select
              id="per-page"
              value={perPage}
              onChange={(val) => onPerPageChange(Number(val))}
              options={selectOptions}
              disabled={isLoading}
              size="sm"
            />
          </div>
          <span>{t("common.pagination.entries", { defaultValue: "entradas" })}</span>
        </div>
        {total !== undefined && (
          <span className="hidden sm:inline">
            {t("common.pagination.info", {
              defaultValue: "Mostrando {{from}} a {{to}} de {{total}} resultados",
              from: (currentPage - 1) * perPage + 1,
              to: Math.min(currentPage * perPage, total),
              total,
            } as any)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="rounded-lg border border-gray-200 p-2 text-gray-800 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700"
          title={t("common.previous")}
          aria-label={t("common.previous", { defaultValue: "Previous page" })}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="mx-2 flex items-center gap-1">
          {getPageNumbers().map((page, idx) => {
            if (typeof page === "string") {
              return (
                <div key={`ellipsis-${idx}`} className="p-2">
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
              );
            }
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                disabled={isLoading}
                className={`h-10 min-w-[40px] rounded-lg px-3 text-sm font-medium transition-all ${
                  currentPage === page
                    ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-700"
                }`}
                aria-label={`${t("common.page", { defaultValue: "Page" })} ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage || isLoading}
          className="rounded-lg border border-gray-200 p-2 text-gray-800 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700"
          title={t("common.next")}
          aria-label={t("common.next", { defaultValue: "Next page" })}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
