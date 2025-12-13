import ExpandableText from "@/Components/ManageContent/common/ExpandableText";
import Pagination from "@/Components/ManageContent/common/Pagination";
import { useTheme } from "@/Hooks/useTheme";
import { SocialPostLog } from "@/types/Publication";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Filter,
  MessageCircle,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface LogsListProps {
  logs: SocialPostLog[];
  isLoading: boolean;
  pagination?: any;
  onPageChange?: (page: number) => void;
  onRefresh?: () => void;
}

export default function LogsList({
  logs = [],
  isLoading,
  pagination,
  onPageChange,
  onRefresh,
}: LogsListProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredLogs = logs.filter((log) => {
    if (selectedStatus !== "all" && log.status !== selectedStatus) return false;
    return true;
  });

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
            title={t("logs.filters.title")}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
            title={t("logs.refresh")}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

     

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
                {t("logs.table.content")}
              </th>
              <th className="px-6 py-4 font-semibold">
                {t("logs.table.error")}
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
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  {t("logs.loading")}
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  {t("logs.empty")}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
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
                        {log.social_account?.platform || log.platform}
                      </span>
                      <span className="text-xs text-gray-400">
                        {log.account_name || log.social_account?.account_name}
                      </span>
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
                  <td className="px-6 py-4">
                    <div className="group relative">
                      <ExpandableText
                        text={log.content || "-"}
                        maxLength={50}
                        className="text-[11px]"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {log.error_message ? (
                      <div className="leading-tight">
                        <ExpandableText
                          text={log.error_message}
                          maxLength={60}
                          className="text-[11px] text-red-500"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {((log.post_url && log.post_url !== "") ||
                      (log.video_url && log.video_url !== "")) &&
                      (log.status === "published" ||
                        log.status === "orphaned") && (
                        <a
                          href={log.post_url || log.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 transition-all shadow-md hover:shadow-lg"
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

      {pagination && pagination.last_page > 1 && (
        <Pagination
          pagination={pagination}
          onPageChange={onPageChange || (() => {})}
        />
      )}
    </div>
  );
}
