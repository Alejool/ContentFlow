import { DatePicker as DatePickerModern } from "@/Components/common/Modern/DatePicker";
import Input from "@/Components/common/Modern/Input";
import Select from "@/Components/common/Modern/Select";
import { format, parseISO } from "date-fns";
import { Filter, Search } from "lucide-react";

interface FilterSectionProps {
  mode: "campaigns" | "publications" | "logs" | "approvals" | "integrations";
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
    { value: "scheduled", label: t("publications.filters.scheduled") },
    { value: "pending_review", label: t("publications.filters.pending_review") },
    { value: "failed", label: t("publications.filters.failed") },
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

  const statusApprovalsOptions = [
    { value: "all", label: t("approvals.filters.all") },
    { value: "approved", label: t("approvals.filters.approved") },
    { value: "rejected", label: t("approvals.filters.rejected") },
  ];

  const statusIntegrationsOptions = [
    { value: "", label: t("workspace.activity.all_statuses") },
    { value: "success", label: t("common.success") },
    { value: "failed", label: t("common.failed") },
  ];

  const channelIntegrationsOptions = [
    { value: "", label: t("workspace.activity.all_channels") },
    { value: "slack", label: "Slack" },
    { value: "discord", label: "Discord" },
  ];

  const platformOptions = [
    { value: "facebook", label: "Facebook" },
    { value: "instagram", label: "Instagram" },
    { value: "twitter", label: "Twitter" },
    { value: "youtube", label: "YouTube" },
    { value: "tiktok", label: "TikTok" },
  ];

  const sortOptions = [
    { value: "newest", label: t("common.sort.newest") || "Más recientes" },
    { value: "oldest", label: t("common.sort.oldest") || "Más antiguos" },
    { value: "title_asc", label: t("common.sort.title_asc") || "Título (A-Z)" },
    {
      value: "title_desc",
      label: t("common.sort.title_desc") || "Título (Z-A)",
    },
  ];

  const activeColor = "primary-500";
  const showPlatformFilter = mode === "publications" || mode === "logs";

  return (
    <div className="bg-white dark:bg-neutral-800/50 p-4 rounded-lg border border-gray-100 dark:border-neutral-700 shadow-sm mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <div className="md:col-span-2 lg:col-span-3 xl:col-span-2">
          <Input
            id="search"
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
            sizeType="md"
            className="w-full"
            activeColor={activeColor}
          />
        </div>

        {mode !== "integrations" && (
          <div>
            <Select<any>
              id="status-filter"
              options={
                mode === "campaigns"
                  ? statusCampaignsOptions
                  : mode === "logs"
                    ? statusLogsOptions
                    : mode === "approvals"
                      ? statusApprovalsOptions
                      : statusPublicationsOptions
              }
              value={statusFilter}
              variant="outlined"
              onChange={(val) => {
                handleFilterChange(
                  mode === "approvals" ? "action" : "status",
                  String(val),
                );
              }}
              size="md"
              icon={Filter}
              placeholder={t("common.status.title") || "Estado"}
              activeColor={activeColor}
            />
          </div>
        )}

        {mode === "integrations" && (
          <>
            <div>
              <Select<any>
                id="channel-filter"
                options={channelIntegrationsOptions}
                value={platformFilter || ""}
                variant="outlined"
                onChange={(val) => {
                  handleFilterChange("channel", String(val));
                }}
                size="md"
                icon={Filter}
                placeholder={t("workspace.activity.all_channels")}
                activeColor={activeColor}
              />
            </div>
            <div>
              <Select<any>
                id="status-filter"
                options={statusIntegrationsOptions}
                value={statusFilter}
                variant="outlined"
                onChange={(val) => {
                  handleFilterChange("status", String(val));
                }}
                size="md"
                icon={Filter}
                placeholder={t("workspace.activity.all_statuses")}
                activeColor={activeColor}
              />
            </div>
          </>
        )}

        {showPlatformFilter && (
          <div>
            <Select<any>
              id="platform-filter"
              options={platformOptions}
              value={platformFilter || ""}
              variant="outlined"
              onChange={(val) => {
                handleFilterChange("platform", String(val));
              }}
              size="md"
              placeholder={t("common.platform.title") || "Plataforma"}
              activeColor={activeColor}
            />
          </div>
        )}

        {mode !== "approvals" && mode !== "integrations" && (
          <div>
            <Select<any>
              id="sort-filter"
              options={sortOptions}
              value={sortFilter}
              variant="outlined"
              onChange={(val) => {
                handleFilterChange("sort", String(val));
              }}
              size="md"
              placeholder={t("common.sort.title") || "Ordenar"}
              activeColor={activeColor}
            />
          </div>
        )}

        {mode !== "approvals" && mode !== "integrations" && (
          <>
            <div>
              <DatePickerModern
                isClearable
                allowPastDates={true}
                selected={dateStart ? parseISO(dateStart) : null}
                dateFormat="dd/MM/yyyy HH:mm"
                onChange={(d) =>
                  handleFilterChange(
                    "date_start",
                    d ? format(d, "yyyy-MM-dd") : "",
                  )
                }
                placeholder="Inicio"
                withPortal
                variant="outlined"
                size="md"
                activeColor={activeColor}
              />
            </div>
            <div>
              <DatePickerModern
                selected={dateEnd ? parseISO(dateEnd) : null}
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
                activeColor={activeColor}
                size="md"
                isClearable
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
