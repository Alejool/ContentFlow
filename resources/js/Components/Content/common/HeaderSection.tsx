import { Filter, Plus, RotateCcw } from "lucide-react";
import Button from "@/Components/common/Modern/Button";

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
    <div className="p-6 border-b border-gray-100 dark:border-neutral-700/50">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            {mode === "campaigns"
              ? t("campaigns.title") || "Campaign Groups"
              : t("publications.title") || "Your Publications"}
          </h2>
          <p
            className="text-sm mt-1 text-gray-500 dark:text-gray-400"
          >
            {mode === "campaigns"
              ? t("campaigns.subtitle") || "Campaign Groups"
              : t("publications.subtitle") || "Your Publications"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "primary" : "ghost"}
            buttonStyle={showFilters ? "solid" : "ghost"}
            size="md"
            className={`p-2 rounded-lg transition-colors ${showFilters
                ? "bg-primary-500 text-white"
                : "hover:bg-gray-100 dark:hover:bg-neutral-700"
              }`}
            title={
              mode === "campaigns"
                ? t("campaigns.filters.title") || "Campaign Filters"
                : t("publications.filters.title") || "Publication Filters"
            }
            icon={Filter}
          >
            
          </Button>
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="ghost"
              buttonStyle="ghost"
              size="md"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
              title={t("common.refresh") || "Refresh"}
              icon={RotateCcw}
            >
              
            </Button>
          )}
          <Button
            onClick={onAdd}
            variant="primary"
            buttonStyle="gradient"
            size="md"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
            icon={Plus}
            iconPosition="left"
          >
            {mode === "campaigns"
              ? t("campaigns.button.add") || "Save Campaign"
              : t("publications.button.add") || "Save Publication"}
          </Button>
        </div>
      </div>
    </div>
  );
}
