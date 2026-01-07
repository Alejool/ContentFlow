import React, { memo, useState } from "react";
import ExpandableText from "@/Components/ManageContent/common/ExpandableText";
import Pagination from "@/Components/ManageContent/common/Pagination";
import Loader from "@/Components/common/Loader";
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
import { useTranslation } from "react-i18next";

interface LogsListProps {
  logs: SocialPostLog[];
  isLoading: boolean;
  pagination?: any;
  onPageChange?: (page: number) => void;
  onRefresh?: () => void;
  onFilterChange?: (filters: any) => void;
}

const LogsList = memo(({
  logs = [],
  isLoading,
  pagination,
  onPageChange,
  onRefresh,
  onFilterChange,
}: LogsListProps) => {
  const { t } = useTranslation();

  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    if (onFilterChange) {
      onFilterChange({ status });
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
      case "publishing":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "deleted":
      case "removed_on_platform":
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "pending":
      case "publishing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "deleted":
      case "removed_on_platform":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "youtube":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "facebook":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "instagram":
        return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300";
      case "twitter":
        return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300";
      case "tiktok":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };



  const statusOptions = [
    "all",
    "published",
    "success",
    "failed",
    "pending",
    "publishing",
    "orphaned",
    "deleted",
    "removed_on_platform",
  ];

  const getStatusButtonColor = (status: string) => {
    if (selectedStatus !== status) {
      return "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700";
    }

    switch (status) {
      case "all":
        return "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300";
      case "published":
      case "success":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "pending":
      case "publishing":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      default:
        return "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <div
      className="rounded-lg shadow-lg border transition-all duration-300 backdrop-blur-lg bg-white/70 border-gray-100/70 text-gray-900 dark:bg-neutral-800/70 dark:border-neutral-700/70 dark:text-white"
    >
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-neutral-700/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold">{t("logs.title")}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("logs.subtitle") ||
              "Registros de publicaciones en redes sociales"}
          </p>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
            title={t("logs.filter")}
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

      {/* Filters - Mobile collapsed, desktop always visible */}
      <div
        className={`p-4 border-b border-gray-200 dark:border-neutral-700 ${showFilters ? "block" : "hidden sm:block"
          }`}
      >
        <div className="flex flex-wrap gap-2 overflow-x-auto scrollbar-subtle pb-2">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${getStatusButtonColor(
                status
              )}`}
            >
              {t(`logs.status.${status}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto scrollbar-subtle">
        <table className="w-full text-left text-sm">
          <thead
            className="bg-gray-50/90 border-gray-100 dark:bg-neutral-800/90 dark:border-neutral-700 border-b"
          >
            <tr>
              <th className="px-4 py-3 font-semibold text-xs sm:text-sm">
                {t("logs.table.date")}
              </th>
              <th className="px-4 py-3 font-semibold text-xs sm:text-sm">
                {t("logs.table.platform")}
              </th>
              <th className="px-4 py-3 font-semibold text-xs sm:text-sm">
                {t("logs.table.source")}
              </th>
              <th className="px-4 py-3 font-semibold text-xs sm:text-sm">
                {t("logs.table.status")}
              </th>
              <th className="px-4 py-3 font-semibold text-xs sm:text-sm">
                {t("logs.table.description")}
              </th>
              <th className="px-4 py-3 font-semibold text-xs sm:text-sm text-center">
                {t("logs.table.link")}
              </th>
            </tr>
          </thead>
          <tbody
            className="divide-y divide-gray-100 dark:divide-neutral-700/50"
          >
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center space-y-4 text-gray-500"
                >
                  <div className="flex justify-center">
                    <Loader />
                  </div>
                  <span className="text-sm">{t("logs.loading")}</span>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  {t("logs.empty")}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-700/30"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400 text-xs">
                    {format(new Date(log.updated_at), "MMM d, HH:mm")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getPlatformColor(
                            log.platform
                          )}`}
                        >
                          {log.social_account?.platform || log.platform}
                        </span>
                      </div>
                      {log.account_name && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                          {log.account_name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {(log.campaign || log.publication?.campaigns?.[0]) && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {log.campaign?.name || log.publication?.campaigns?.[0]?.name}
                        </span>
                      )}
                      {log.publication && (
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                          {log.publication.title}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        log.status
                      )}`}
                    >
                      {getStatusIcon(log.status)}
                      <span>
                        {t(`logs.status.${log.status}`) || log.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <ExpandableText
                      text={log.content || "-"}
                      maxLength={80}
                      className="text-xs"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {((log.post_url && log.post_url !== "") ||
                      (log.video_url && log.video_url !== "")) &&
                      (log.status === "published" ||
                        log.status === "orphaned") && (
                        <a
                          href={log.post_url || log.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 transition-all shadow-md hover:shadow-lg"
                          title={t("logs.viewPost")}
                        >
                          <ExternalLink className="w-3 h-3 text-white" />
                        </a>
                      )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {isLoading ? (
          <div className="p-8 text-center space-y-4 text-gray-500">
            <div className="flex justify-center">
              <Loader />
            </div>
            <span className="text-sm">{t("logs.loading")}</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t("logs.empty")}</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-neutral-700/50">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-gray-50/50 dark:hover:bg-neutral-700/30 transition-colors"
              >
                {/* Header with Date and Status */}
                <div className="flex justify-between items-start mb-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(log.updated_at), "MMM d, HH:mm")}
                  </div>
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                      log.status
                    )}`}
                  >
                    {getStatusIcon(log.status)}
                    <span>{t(`logs.status.${log.status}`) || log.status}</span>
                  </div>
                </div>

                {/* Platform and Account */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getPlatformColor(
                      log.platform
                    )}`}
                  >
                    {log.social_account?.platform || log.platform}
                  </span>
                  {log.account_name && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      • {log.account_name}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="mb-3">
                  <ExpandableText
                    text={log.content || "-"}
                    maxLength={100}
                    className="text-sm"
                  />
                </div>

                {/* Source */}
                <div className="mb-3">
                  {(log.campaign || log.publication?.campaigns?.[0]) && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {t("logs.table.campaign")}: {log.campaign?.name || log.publication?.campaigns?.[0]?.name}
                    </div>
                  )}
                  {log.publication && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {log.publication.title}
                    </div>
                  )}
                </div>

                {/* Error Message (if any) */}
                {log.error_message && (
                  <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                      {t("logs.table.error")}:
                    </div>
                    <div className="text-xs text-red-500 dark:text-red-300 mt-1">
                      {log.error_message}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 dark:border-neutral-700/50">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ID: {log.id}
                  </div>
                  {((log.post_url && log.post_url !== "") ||
                    (log.video_url && log.video_url !== "")) &&
                    (log.status === "published" ||
                      log.status === "orphaned") && (
                      <a
                        href={log.post_url || log.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 transition-all shadow-md hover:shadow-lg text-white text-xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {t("logs.viewPost")}
                      </a>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="p-4 border-t border-gray-100 dark:border-neutral-700/50">
          <Pagination
            pagination={pagination}
            onPageChange={onPageChange || (() => { })}
            t={t}
          />
        </div>
      )}
    </div>
  );
});

export default LogsList;
