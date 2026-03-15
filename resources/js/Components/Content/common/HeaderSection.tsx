import { Filter, Plus, RotateCcw } from "lucide-react";

interface HeaderSectionProps {
  mode: "campaigns" | "publications";
  t: (key: string) => string;
  onAdd: () => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  onRefresh?: () => void;
}

export default function HeaderSection({
  mode,
  t,
  onAdd,
  showFilters,
  setShowFilters,
  onRefresh,
}: HeaderSectionProps) {
  return (
    <div className="border-b border-gray-100 p-6 dark:border-neutral-700/50">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === "campaigns"
              ? t("campaigns.title") || "Campaign Groups"
              : t("publications.title") || "Your Publications"}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {mode === "campaigns"
              ? t("campaigns.subtitle") || "Campaign Groups"
              : t("publications.subtitle") || "Your Publications"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-lg p-2 transition-colors ${
              showFilters
                ? "bg-primary-500 text-white"
                : "hover:bg-gray-100 dark:hover:bg-neutral-700"
            }`}
            title={
              mode === "campaigns"
                ? t("campaigns.filters.title") || "Campaign Filters"
                : t("publications.filters.title") || "Publication Filters"
            }
          >
            <Filter className="h-4 w-4" />
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700"
              title={t("common.refresh") || "Refresh"}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onAdd}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2 font-medium text-white shadow-md transition-all hover:from-primary-700 hover:to-primary-600 hover:shadow-lg active:scale-95"
          >
            <Plus className="h-4 w-4" />
            {mode === "campaigns"
              ? t("campaigns.button.add") || "Save Campaign"
              : t("publications.button.add") || "Save Publication"}
          </button>
        </div>
      </div>
    </div>
  );
}
