import { DatePicker as DatePickerModern } from "@/Components/common/Modern/DatePicker";
import Input from "@/Components/common/Modern/Input";
import Select from "@/Components/common/Modern/Select";
import { format } from "date-fns";
import { Filter, Search } from "lucide-react";

interface FilterSectionProps {
  mode: "campaigns" | "publications" | "logs";
  t: (key: string) => string;
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  platformFilter?: string;
  sortFilter?: string;
  dateStart?: string;
  dateEnd?: string;
  handleFilterChange: (key: string, value: string) => void;
}

export default function FilterSection({
  mode,
  t,
  search,
  setSearch,
  statusFilter,
  platformFilter,
  sortFilter = "newest",
  dateStart,
  dateEnd,
  handleFilterChange,
}: FilterSectionProps) {
  const statusCampaignsOptions = [
    { value: "all", label: t("campaigns.filters.all") },
    { value: "active", label: t("campaigns.filters.active") },
    { value: "inactive", label: t("campaigns.filters.inactive") },
    { value: "completed", label: t("campaigns.filters.completed") },
    { value: "deleted", label: t("campaigns.filters.deleted") },
    { value: "paused", label: t("campaigns.filters.paused") },
  ];

  const statusPublicationsOptions = [
    { value: "all", label: t("publications.filters.all") },
    { value: "published", label: t("publications.filters.published") },
    { value: "draft", label: t("publications.filters.draft") },
    { value: "scheduled", label: t("publications.status.scheduled") },
    { value: "pending_review", label: t("publications.status.pending_review") },
    { value: "failed", label: t("publications.status.failed") },
  ];

  const statusLogsOptions = [
    "all",
    "published",
    "success",
    "failed",
    "pending",
    "publishing",
    "orphaned",
    "deleted",
    "removed_on_platform",
  ].map((status) => ({
    value: status,
    label: t(`logs.status.${status}`),
  }));

  const sortOptions = [
    { value: "newest", label: t("common.sort.newest") || "Más recientes" },
    { value: "oldest", label: t("common.sort.oldest") || "Más antiguos" },
    { value: "title_asc", label: t("common.sort.title_asc") || "Título (A-Z)" },
    {
      value: "title_desc",
      label: t("common.sort.title_desc") || "Título (Z-A)",
    },
  ];

  return (
    <div className="flex flex-col gap-4 bg-white dark:bg-neutral-800/50 p-4 rounded-lg border border-gray-100 dark:border-neutral-700 shadow-sm mt-4">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <Input
            id="search"
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
            sizeType="md"
            className="w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="min-w-[140px]">
            <Select<any>
              id="status-filter"
              options={
                mode === "campaigns"
                  ? statusCampaignsOptions
                  : mode === "logs"
                    ? statusLogsOptions
                    : statusPublicationsOptions
              }
              value={statusFilter}
              variant="outlined"
              onChange={(val) => handleFilterChange("status", String(val))}
              size="md"
              icon={Filter}
              placeholder={t("common.status.title") || "Estado"}
            />
          </div>

          {mode !== "logs" && (
            <div className="min-w-[140px]">
              <Select<any>
                id="sort-filter"
                options={sortOptions}
                value={sortFilter}
                variant="outlined"
                onChange={(val) => handleFilterChange("sort", String(val))}
                size="md"
                placeholder={t("common.sort.title") || "Ordenar"}
              />
            </div>
          )}

          {mode !== "logs" && (
            <div className="flex items-center gap-2">
              <div className="w-32">
                <DatePickerModern
                  isClearable
                  allowPastDates={true}
                  selected={dateStart ? new Date(dateStart) : null}
                  dateFormat="dd/MM/yyyy HH:mm"
                  onChange={(d) =>
                    handleFilterChange(
                      "date_start",
                      d ? format(d, "yyyy-MM-dd") : "",
                    )
                  }
                  placeholder="Inicio"
                  withPortal
                  size="md"
                />
              </div>
              <span className="text-gray-400">-</span>
              <div className="w-32">
                <DatePickerModern
                  selected={dateEnd ? new Date(dateEnd) : null}
                  allowPastDates={true}
                  dateFormat="dd/MM/yyyy HH:mm"
                  onChange={(d) =>
                    handleFilterChange(
                      "date_end",
                      d ? format(d, "yyyy-MM-dd") : "",
                    )
                  }
                  placeholder="Fin"
                  withPortal
                  size="md"
                  isClearable
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
