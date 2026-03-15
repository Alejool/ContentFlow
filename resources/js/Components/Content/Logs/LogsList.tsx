import ExpandableText from "@/Components/Content/common/ExpandableText";
import FilterSection from "@/Components/Content/common/FilterSection";
import AdvancedPagination from "@/Components/common/ui/AdvancedPagination";
import EmptyState from "@/Components/common/ui/EmptyState";
import TableContainer from "@/Components/common/ui/TableContainer";
import { formatDate } from "@/Utils/i18nHelpers";
import { SocialPostLog } from "@/types/Publication";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Filter,
  MessageCircle,
  RotateCcw,
} from "lucide-react";
import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface LogsListProps {
  logs: SocialPostLog[];
  isLoading: boolean;
  pagination?: any;
  onPageChange?: (page: number) => void;
  onRefresh?: () => void;
  onFilterChange?: (key: string, val: any) => void;
  onPerPageChange?: (perPage: number) => void;
  filters?: any;
  search?: string;
  onSearchChange?: (val: string) => void;
  showFilters?: boolean;
  onToggleFilters?: (show: boolean) => void;
}

import LogCardSkeleton from "@/Components/Content/Logs/LogCardSkeleton";
import LogRowSkeleton from "@/Components/Content/Logs/LogRowSkeleton";
import Button from "@/Components/common/Modern/Button";

const LogsList = memo(
  ({
    logs = [],
    isLoading,
    pagination,
    onPageChange,
    onRefresh,
    onFilterChange,
    onPerPageChange,
    filters = {},
    search = "",
    onSearchChange,
    showFilters: showFiltersProp,
    onToggleFilters,
  }: LogsListProps) => {
    const { t, i18n } = useTranslation();
    const localeLang = i18n.language || undefined;
    const [smoothLoading, setSmoothLoading] = useState(isLoading);
    const [showFilters, setShowFilters] = useState(showFiltersProp ?? false);

    // Sync with prop if provided
    useEffect(() => {
      if (showFiltersProp !== undefined) {
        setShowFilters(showFiltersProp);
      }
    }, [showFiltersProp]);

    const handleToggleFilters = (show: boolean) => {
      setShowFilters(show);
      if (onToggleFilters) {
        onToggleFilters(show);
      }
    };

    const handleResetFilters = () => {
      if (onSearchChange) {
        onSearchChange("");
      }
      if (onFilterChange) {
        onFilterChange("status", "all");
        onFilterChange("platform", []);
        onFilterChange("date_start", "");
        onFilterChange("date_end", "");
      }
    };

    useEffect(() => {
      if (isLoading) {
        setSmoothLoading(true);
      } else {
        const timer = setTimeout(() => {
          setSmoothLoading(false);
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [isLoading]);

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "published":
        case "success":
          return <CheckCircle className="h-4 w-4 text-green-500" />;
        case "failed":
          return <AlertCircle className="h-4 w-4 text-red-500" />;
        case "pending":
        case "publishing":
          return <Clock className="h-4 w-4 text-yellow-500" />;
        case "deleted":
        case "removed_on_platform":
          return <AlertCircle className="h-4 w-4 text-gray-500" />;
        default:
          return <MessageCircle className="h-4 w-4 text-gray-500" />;
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

    const headerActions = (
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          buttonStyle="outline"
          size="sm"
          onClick={() => handleToggleFilters(!showFilters)}
          icon={Filter}
          className={
            showFilters
              ? "border-primary-200 bg-primary-50 text-primary-600 ring-1 ring-primary-500/20"
              : ""
          }
        >
          {t("common.filters.title") || "Filtros"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          loading={isLoading}
          icon={RotateCcw}
          className="text-gray-500 hover:text-primary-600"
          title={t("logs.refresh")}
        >
          {""}
        </Button>
      </div>
    );

    return (
      <TableContainer
        title={t("logs.title")}
        subtitle={t("logs.subtitle") || "Registros de publicaciones en redes sociales"}
        actions={headerActions}
      >
        {showFilters && (
          <div className="mb-4">
            <FilterSection
              mode="logs"
              t={t}
              search={search}
              setSearch={onSearchChange || (() => {})}
              statusFilter={filters.status || "all"}
              platformFilter={filters.platform || []}
              sortFilter={filters.sort || "newest"}
              dateStart={filters.date_start || ""}
              dateEnd={filters.date_end || ""}
              handleFilterChange={onFilterChange || (() => {})}
              onResetFilters={handleResetFilters}
              filters={filters}
            />
          </div>
        )}

        <div className="scrollbar-subtle hidden overflow-x-auto md:block">
          <div className="grid grid-cols-1 grid-rows-1">
            <div
              className={`col-start-1 row-start-1 transition-all duration-500 ${smoothLoading ? "invisible opacity-0" : "visible opacity-100"}`}
            >
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/50 dark:border-neutral-700 dark:bg-neutral-900/50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold sm:text-sm">
                      {t("logs.table.date")}
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold sm:text-sm">
                      {t("logs.table.platform")}
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold sm:text-sm">
                      {t("logs.table.source")}
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold sm:text-sm">
                      {t("logs.table.status")}
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold sm:text-sm">
                      {t("logs.table.description")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold sm:text-sm">
                      {t("logs.table.link")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-neutral-700/50">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <EmptyState
                          title={t("logs.empty")}
                          description={t("logs.noLogsDesc") || "No se encontraron registros."}
                          className="border-none bg-transparent shadow-none"
                        />
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        className="group transition-colors hover:bg-gray-50/30 dark:hover:bg-neutral-700/30"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(new Date(log.updated_at), "datetime", localeLang)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${getPlatformColor(
                                  log.platform,
                                )}`}
                              >
                                {log.social_account?.platform || log.platform}
                              </span>
                            </div>
                            {log.account_name && (
                              <span className="max-w-[120px] truncate text-xs text-gray-500 dark:text-gray-400">
                                {log.account_name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {(log.campaign || log.publication?.campaigns?.[0]) && (
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                {log.campaign?.name || log.publication?.campaigns?.[0]?.name}
                              </span>
                            )}
                            {log.publication && (
                              <span className="max-w-[150px] truncate text-xs text-gray-600 dark:text-gray-400">
                                {log.publication.title}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className={`inline-flex items-center gap-2 rounded px-2 py-1 text-xs font-medium ${getStatusColor(
                              log.status,
                            )}`}
                          >
                            {getStatusIcon(log.status)}
                            <span>{t(`logs.status.${log.status}`) || log.status}</span>
                          </div>
                        </td>
                        <td className="max-w-[200px] px-4 py-3">
                          <ExpandableText
                            text={log.content || "-"}
                            maxLength={80}
                            className="text-xs"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {((log.post_url && log.post_url !== "") ||
                            (log.video_url && log.video_url !== "")) &&
                            (log.status === "published" || log.status === "orphaned") && (
                              <a
                                href={log.post_url || log.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 shadow-md transition-all hover:from-primary-600 hover:to-primary-800 hover:shadow-lg"
                                title={t("logs.viewPost")}
                              >
                                <ExternalLink className="h-3 w-3 text-white" />
                              </a>
                            )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {smoothLoading && (
              <div className="animate-out fade-out fill-mode-forwards z-20 col-start-1 row-start-1 bg-white/50 duration-500 dark:bg-neutral-800/50">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50/90 dark:border-neutral-700 dark:bg-neutral-800/90">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold sm:text-sm">
                        {t("logs.table.date")}
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold sm:text-sm">
                        {t("logs.table.platform")}
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold sm:text-sm">
                        {t("logs.table.source")}
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold sm:text-sm">
                        {t("logs.table.status")}
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold sm:text-sm">
                        {t("logs.table.description")}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold sm:text-sm">
                        {t("logs.table.link")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(10)].map((_, i) => (
                      <LogRowSkeleton key={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="px-2 md:hidden">
          <div className="grid grid-cols-1 grid-rows-1">
            <div
              className={`col-start-1 row-start-1 transition-all duration-500 ${smoothLoading ? "invisible opacity-0" : "visible opacity-100"}`}
            >
              {logs.length === 0 ? (
                <EmptyState
                  title={t("logs.empty")}
                  description={t("logs.noLogsDesc") || "No se encontraron registros."}
                  imageSize="sm"
                />
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-neutral-700/50">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-700/30"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(new Date(log.updated_at), "datetime", localeLang)}
                        </div>
                        <div
                          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${getStatusColor(
                            log.status,
                          )}`}
                        >
                          {getStatusIcon(log.status)}
                          <span>{t(`logs.status.${log.status}`) || log.status}</span>
                        </div>
                      </div>

                      <div className="mb-3 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${getPlatformColor(
                            log.platform,
                          )}`}
                        >
                          {log.social_account?.platform || log.platform}
                        </span>
                        {log.account_name && (
                          <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                            • {log.account_name}
                          </span>
                        )}
                      </div>

                      <div className="mb-3">
                        <ExpandableText
                          text={log.content || "-"}
                          maxLength={100}
                          className="text-sm"
                        />
                      </div>

                      <div className="mb-3">
                        {(log.campaign || log.publication?.campaigns?.[0]) && (
                          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            {t("logs.table.campaign")}:{" "}
                            {log.campaign?.name || log.publication?.campaigns?.[0]?.name}
                          </div>
                        )}
                        {log.publication && (
                          <div className="truncate text-xs text-gray-600 dark:text-gray-400">
                            {log.publication.title}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-neutral-700/50">
                        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {log.id}</div>
                        {((log.post_url && log.post_url !== "") ||
                          (log.video_url && log.video_url !== "")) &&
                          (log.status === "published" || log.status === "orphaned") && (
                            <a
                              href={log.post_url || log.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 px-3 py-1.5 text-xs text-white shadow-md transition-all hover:from-primary-600 hover:to-primary-800 hover:shadow-lg"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {t("logs.viewPost")}
                            </a>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {smoothLoading && (
              <div className="animate-out fade-out fill-mode-forwards z-20 col-start-1 row-start-1 space-y-3 bg-white duration-500 dark:bg-neutral-800">
                {[...Array(5)].map((_, i) => (
                  <LogCardSkeleton key={i} />
                ))}
              </div>
            )}
          </div>
        </div>

        {pagination && (
          <AdvancedPagination
            currentPage={pagination.current_page}
            lastPage={pagination.last_page}
            total={pagination.total}
            perPage={pagination.per_page || 12}
            onPageChange={onPageChange || (() => {})}
            onPerPageChange={onPerPageChange || (() => {})}
            t={t}
            isLoading={isLoading}
          />
        )}
      </TableContainer>
    );
  },
);

export default LogsList;
