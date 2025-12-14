import { Filter, Plus, RotateCcw } from "lucide-react";

interface HeaderSectionProps {
  mode: "campaigns" | "publications";
  theme: string;
  t: (key: string) => string;
  onAdd: () => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  onRefresh?: () => void;
}

export default function HeaderSection({
  mode,
  theme,
  t,
  onAdd,
  showFilters,
  setShowFilters,
  onRefresh,
}: HeaderSectionProps) {
  return (
    <div className="p-6 border-b border-gray-100 dark:border-neutral-700/50">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {mode === "campaigns"
              ? t("campaigns.title") || "Campaign Groups"
              : t("publications.title") || "Your Publications"}
          </h2>
          <p
            className={`text-sm mt-1 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {mode === "campaigns"
              ? t("campaigns.subtitle") || "Campaign Groups"
              : t("publications.subtitle") || "Your Publications"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters
                ? "bg-primary-500 text-white"
                : "hover:bg-gray-100 dark:hover:bg-neutral-700"
            }`}
            title={
              mode === "campaigns"
                ? t("campaigns.filters.title")
                : t("publications.filters.title")
            }
          >
            <Filter className="w-4 h-4" />
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
              title={t("common.refresh") || "Refresh"}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {mode === "campaigns"
              ? t("campaigns.button.add") || "New Campaign"
              : t("publications.button.add") || "New Publication"}
          </button>
        </div>
      </div>
    </div>
  );
}
