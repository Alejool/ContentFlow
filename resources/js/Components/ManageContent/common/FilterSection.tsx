import ModernDatePicker from "@/Components/common/ui/ModernDatePicker";
import { format } from "date-fns";
import { Filter } from "lucide-react";

interface FilterSectionProps {
  mode: "campaigns" | "publications";
  theme: string;
  t: (key: string) => string;
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  platformFilter: string;
  dateStart: string;
  dateEnd: string;
  handleFilterChange: (key: string, value: string) => void;
}

export default function FilterSection({
  mode,
  theme,
  t,
  search,
  setSearch,
  statusFilter,
  platformFilter,
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
  ];

  const platformOptions = [
    { value: "all", label: t("publications.filters.all") },
    { value: "facebook", label: "Facebook" },
    { value: "twitter", label: "Twitter" },
    { value: "tiktok", label: "TikTok" },
    { value: "youtube", label: "Youtube" },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50 dark:bg-neutral-900/30 p-4 rounded-lg mt-4">
      <div className="flex items-center gap-2 w-full md:w-auto relative">
        {/* <Search
          className={`absolute left-3 w-4 h-4 ${
            theme === "dark" ? "text-gray-500" : "text-gray-400"
          }`}
        /> */}
        {/* <input
          type="text"
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`pl-9 pr-4 py-2 rounded-lg w-full md:w-64 text-sm border focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
            theme === "dark"
              ? "bg-neutral-800 border-neutral-700 text-white placeholder-gray-500"
              : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
          }`}
        /> */}
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <Filter
            className={`w-4 h-4 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          />

          {mode === "campaigns" && (
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className={`py-2 pl-3 pr-8 rounded-lg text-sm border focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer ${
                theme === "dark"
                  ? "bg-neutral-800/70 border-neutral-700/70 text-white"
                  : "bg-white/70 border-gray-200/70 text-gray-700"
              }`}
            >
              {statusCampaignsOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {mode === "publications" && (
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className={`py-2 pl-3 pr-8 rounded-lg text-sm border focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer ${
                theme === "dark"
                  ? "bg-neutral-800/70 border-neutral-700/70 text-white"
                  : "bg-white/70 border-gray-200/70 text-gray-700"
              }`}
            >
              {statusPublicationsOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {/* <div className="flex items-center gap-2">
            <select
              value={platformFilter}
              onChange={(e) => handleFilterChange("platform", e.target.value)}
              className={`py-2 pl-3 pr-8 rounded-lg text-sm border focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer ${
                theme === "dark"
                  ? "bg-neutral-800/70 border-neutral-700/70 text-white"
                  : "bg-white/70 border-gray-200/70 text-gray-700"
              }`}
            >
              {platformOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div> */}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-32">
            <ModernDatePicker
              selected={dateStart ? new Date(dateStart) : null}
              onChange={(d) =>
                handleFilterChange(
                  "date_start",
                  d ? format(d, "yyyy-MM-dd") : ""
                )
              }
              placeholder="Start"
              withPortal
            />
          </div>
          <span className="text-gray-400">-</span>
          <div className="w-32">
            <ModernDatePicker
              selected={dateEnd ? new Date(dateEnd) : null}
              onChange={(d) =>
                handleFilterChange("date_end", d ? format(d, "yyyy-MM-dd") : "")
              }
              placeholder="End"
              withPortal
            />
          </div>
        </div>
      </div>
    </div>
  );
}
