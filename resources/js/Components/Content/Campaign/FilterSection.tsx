import DatePickerModern from "@/Components/common/Modern/DatePicker";
import Input from "@/Components/common/Modern/Input";
import Select from "@/Components/common/Modern/Select";
import { format, parseISO } from "date-fns";
import { Search } from "lucide-react";

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
  const activeColor = "gray-400";

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50 dark:bg-neutral-900/30 p-4 rounded-lg mt-4">
      <div className="flex items-center gap-2 w-full md:w-64 relative">
        <Input
          id="campaign-search"
          type="text"
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={Search}
          sizeType="md"
          containerClassName="w-full"
          className="cursor-pointer"
          activeColor={activeColor}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="w-40">
          <Select
            id="status-filter"
            value={statusFilter}
            onChange={(val) => handleFilterChange("status", val.toString())}
            options={[
              { value: "all", label: t("campaigns.filters.all") },
              { value: "active", label: t("campaigns.filters.active") },
              { value: "draft", label: t("campaigns.filters.draft") },
              ...(mode === "campaigns"
                ? [
                    {
                      value: "completed",
                      label: t("campaigns.filters.completed"),
                    },
                  ]
                : []),
            ]}
            size="md"
            activeColor={activeColor}
          />
        </div>

        {mode === "publications" && (
          <div className="w-40">
            <Select
              id="platform-filter"
              value={platformFilter}
              onChange={(val) => handleFilterChange("platform", val.toString())}
              options={[
                { value: "all", label: "All Platforms" },
                { value: "instagram", label: "Instagram" },
                { value: "facebook", label: "Facebook" },
                { value: "twitter", label: "Twitter" },
                { value: "linkedin", label: "LinkedIn" },
                { value: "tiktok", label: "TikTok" },
              ]}
              size="md"
              activeColor={activeColor}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="w-32">
            <DatePickerModern
              isClearable={true}
              allowPastDates={true}
              selected={dateStart ? parseISO(dateStart) : null}
              dateFormat="dd/MM/yyyy HH:mm"
              onChange={(d) =>
                handleFilterChange(
                  "date_start",
                  d ? format(d, "yyyy-MM-dd") : "",
                )
              }
              placeholder="Start"
              withPortal
              activeColor={activeColor}
            />
          </div>
          <span className="text-gray-400">-</span>
          <div className="w-32">
            <DatePickerModern
              isClearable={true}
              allowPastDates={true}
              dateFormat="dd/MM/yyyy HH:mm"
              selected={dateEnd ? parseISO(dateEnd) : null}
              onChange={(d) =>
                handleFilterChange("date_end", d ? format(d, "yyyy-MM-dd") : "")
              }
              placeholder="End"
              withPortal
              activeColor={activeColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
