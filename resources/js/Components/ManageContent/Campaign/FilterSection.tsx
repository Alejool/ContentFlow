import DatePickerModern from "@/Components/common/Modern/DatePicker";
import { format } from "date-fns";
import { Filter, Search } from "lucide-react";

interface FilterSectionProps {
  mode: "campaigns" | "publications";
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
  t,
  search,
  setSearch,
  statusFilter,
  platformFilter,
  dateStart,
  dateEnd,
  handleFilterChange,
}: FilterSectionProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50 dark:bg-neutral-900/30 p-4 rounded-lg mt-4">
      <div className="flex items-center gap-2 w-full md:w-auto relative">
        <Search
          className="absolute left-3 w-4 h-4 text-gray-400 dark:text-gray-500"
        />
        <input
          type="text"
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-4 py-2 rounded-lg w-full md:w-64 text-sm border focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white border-gray-200 text-gray-900 placeholder-gray-400 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder-gray-500"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <Filter
            className="w-4 h-4 text-gray-500 dark:text-gray-400"
          />
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="py-2 pl-3 pr-8 rounded-lg text-sm border focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer bg-white/70 border-gray-200/70 text-gray-700 dark:bg-neutral-800/70 dark:border-neutral-700/70 dark:text-white"
          >
            <option value="all">{t("campaigns.filters.all")}</option>
            <option value="active">{t("campaigns.filters.active")}</option>
            <option value="draft">{t("campaigns.filters.draft")}</option>
            {mode === "campaigns" && (
              <option value="completed">
                {t("campaigns.filters.completed")}
              </option>
            )}
          </select>
        </div>

        {mode === "publications" && (
          <div className="flex items-center gap-2">
            <select
              value={platformFilter}
              onChange={(e) => handleFilterChange("platform", e.target.value)}
              className="py-2 pl-3 pr-8 rounded-lg text-sm border focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer bg-white/70 border-gray-200/70 text-gray-700 dark:bg-neutral-800/70 dark:border-neutral-700/70 dark:text-white"
            >
              <option value="all">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="w-32">
            <DatePickerModern
              isClearable={true}
              selected={dateStart ? new Date(dateStart) : null}
              dateFormat="dd/MM/yyyy HH:mm"
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
            <DatePickerModern
              isClearable={true}
              dateFormat="dd/MM/yyyy HH:mm"
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
