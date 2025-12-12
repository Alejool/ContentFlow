import ExpandableText from "@/Components/ManageContent/common/ExpandableText";
import { useTheme } from "@/Hooks/useTheme";
import axios from "axios";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Filter,
  MessageCircle,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface Log {
  id: number;
  created_at: string;
  platform: string;
  status: "success" | "failed" | "pending" | "published" | "deleted";
  message?: string;
  error_message?: string;
  campaign?: { id: number; name: string };
  publication?: { title: string };
  social_account?: {
    name: string;
    username: string;
    platform: string;
    account_metadata: { email: string };
  };
  post_url?: string;
  video_url?: string;
  engagement_data?: { post_url?: string };
}

interface Campaign {
  id: number;
  name: string;
  title?: string;
}

export default function LogsList() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [logs, setLogs] = useState<Log[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, selectedCampaign, dateFrom, dateTo]);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get("/campaigns");
      if (response.data.campaigns) {
        setCampaigns(response.data.campaigns.data || response.data.campaigns);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns", error);
    }
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let url = `/social-logs?page=${page}`;
      if (selectedCampaign) url += `&campaign_id=${selectedCampaign}`;
      if (dateFrom) url += `&date_from=${dateFrom}`;
      if (dateTo) url += `&date_to=${dateTo}`;

      const response = await axios.get(url);
      if (response.data.success) {
        setLogs(response.data.logs.data);
        setLastPage(response.data.logs.last_page);
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedCampaign("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const navigateToCampaign = (campaignId: number) => {
    const campaignTab = document.querySelector('[data-tab="campaigns"]');
    if (campaignTab) {
      (campaignTab as HTMLElement).click();
      setTimeout(() => {
        const campaignRow = document.querySelector(
          `[data-campaign-id="${campaignId}"]`
        );
        if (campaignRow) {
          campaignRow.scrollIntoView({ behavior: "smooth", block: "center" });
          const expandButton = campaignRow.querySelector("button[data-expand]");
          if (expandButton && !expandButton.getAttribute("data-expanded")) {
            (expandButton as HTMLElement).click();
          }
        }
      }, 100);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const borderColor =
    theme === "dark" ? "border-neutral-700" : "border-gray-200";
  const inputBg = theme === "dark" ? "bg-neutral-700" : "bg-white";

  return (
    <div
      className={`rounded-lg overflow-hidden shadow-lg border transition-all duration-300 backdrop-blur-lg ${
        theme === "dark"
          ? "bg-neutral-800/70 border-neutral-700/70 text-white"
          : "bg-white/70 border-gray-100/70 text-gray-900"
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-neutral-700/50 flex justify-between items-center">
        <h2 className="text-xl font-bold">{t("logs.title")}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters
                ? "bg-primary-500 text-white"
                : "hover:bg-gray-100 dark:hover:bg-neutral-700"
            }`}
            title={t("logs.filters.campaign")}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={fetchLogs}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
            title={t("logs.refresh")}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div
          className={`p-4 border-b ${borderColor} ${
            theme === "dark" ? "bg-neutral-900/30" : "bg-gray-50/50"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Campaign Filter */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("logs.filters.campaign")}
              </label>
              <select
                value={selectedCampaign}
                onChange={(e) => {
                  setSelectedCampaign(e.target.value);
                  setPage(1);
                }}
                className={`w-full px-3 py-2 rounded-lg border ${borderColor} ${inputBg} focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`}
              >
                <option value="">{t("logs.filters.allCampaigns")}</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name || campaign.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("logs.filters.from")}
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className={`w-full px-3 py-2 rounded-lg border ${borderColor} ${inputBg} focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`}
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("logs.filters.to")}
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className={`w-full px-3 py-2 rounded-lg border ${borderColor} ${inputBg} focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all`}
              />
            </div>

            {/* Clear Button */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                {t("logs.filters.clear")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead
            className={`${
              theme === "dark"
                ? "bg-neutral-800/90 border-neutral-700"
                : "bg-gray-50/90 border-gray-100"
            } border-b`}
          >
            <tr>
              <th className="px-6 py-4 font-semibold">
                {t("logs.table.date")}
              </th>
              <th className="px-6 py-4 font-semibold">
                {t("logs.table.platform")}
              </th>
              <th className="px-6 py-4 font-semibold">
                {t("logs.table.source")}
              </th>
              <th className="px-6 py-4 font-semibold">
                {t("logs.table.status")}
              </th>
              <th className="px-6 py-4 font-semibold">
                {t("logs.table.message")}
              </th>
              <th className="px-6 py-4 font-semibold text-center">
                {t("logs.table.link")}
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${
              theme === "dark" ? "divide-neutral-700/50" : "divide-gray-100"
            }`}
          >
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  {t("logs.loading")}
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  {t("logs.empty")}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className={`group transition-colors ${
                    theme === "dark"
                      ? "hover:bg-neutral-700/30"
                      : "hover:bg-gray-50/50"
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="capitalize font-medium">
                        {log.social_account?.platform}
                      </span>
                      {log.social_account && (
                        <span className="text-xs text-gray-400">
                          {log.social_account?.account_metadata.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {log.campaign && (
                        <button
                          onClick={() => navigateToCampaign(log.campaign!.id)}
                          className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded w-fit hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          {t("logs.table.campaign")}: {log.campaign.name}
                        </button>
                      )}
                      {log.publication && (
                        <span className="text-xs text-purple-500 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded w-fit">
                          {log.publication.title}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs">
                      {getStatusIcon(log.status)}
                      <span className="capitalize">
                        {t(`logs.status.${log.status}`) || log.status}
                      </span>
                    </div>
                  </td>
                  <td>
                    {log.error_message ? (
                      <div className="leading-tight">
                        <div className="flex items-center ">
                          <span className="text-red-500 text-[10px] font-medium">
                            {t("logs.table.error")}:
                          </span>
                        </div>
                        <ExpandableText
                          text={log.error_message}
                          maxLength={60}
                          className="text-[11px]"
                        />
                      </div>
                    ) : (
                      <div className="group relative">
                        <ExpandableText
                          text={log.message || "-"}
                          maxLength={80}
                          className="text-[11px]"
                        />
                        {(log.message?.length ?? 0) > 30 && (
                          <div className="invisible group-hover:visible absolute left-0 top-full mt-1 z-10 w-64">
                            <div className="px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                              {log.message}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {(log.post_url ||
                      log.engagement_data?.post_url ||
                      log.video_url) &&
                      log.status !== "deleted" && (
                        <a
                          href={
                            log.post_url ||
                            log.engagement_data?.post_url ||
                            log.video_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 transition-all shadow-md hover:shadow-lg"
                          title={t("logs.table.link")}
                        >
                          <ExternalLink className="w-4 h-4 text-white" />
                        </a>
                      )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="p-4 flex justify-between items-center text-sm border-t border-gray-100 dark:border-neutral-700">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 rounded border disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
          >
            {t("logs.pagination.previous")}
          </button>
          <span>
            {t("logs.pagination.page")} {page} {t("logs.pagination.of")}{" "}
            {lastPage}
          </span>
          <button
            disabled={page === lastPage}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            className="px-3 py-1 rounded border disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
          >
            {t("logs.pagination.next")}
          </button>
        </div>
      )}
    </div>
  );
}
