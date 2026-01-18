import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ApprovalLogItem {
  id: number;
  publication: {
    id: number;
    title: string;
    status: string;
  };
  requester: {
    id: number;
    name: string;
    photo_url?: string;
  };
  requested_at: string;
  reviewer?: {
    id: number;
    name: string;
    photo_url?: string;
  };
  reviewed_at?: string;
  action?: "approved" | "rejected";
  rejection_reason?: string;
}

interface ApprovalHistoryProps {
  onRefresh?: () => void;
}

export default function ApprovalHistory({ onRefresh }: ApprovalHistoryProps) {
  const { t, i18n } = useTranslation();
  const [logs, setLogs] = useState<ApprovalLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: "all",
    search: "",
  });

  useEffect(() => {
    fetchHistory();
  }, [currentPage, filters]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: currentPage };

      if (filters.action !== "all") {
        params.action = filters.action;
      }

      if (filters.search) {
        params.search = filters.search;
      }

      const response = await axios.get(route("approvals.history"), { params });

      const json = response.data;
      if (json.success) {
        // Defensive: Check both merged and nested structures
        const dataContainer = json.logs ? json : json.data || {};
        const logs = dataContainer.logs;

        if (logs) {
          setLogs(logs.data || []);
          setTotalPages(logs.last_page || 1);
        }
      }
    } catch (error) {
      console.error("Error fetching approval history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const getActionBadge = (action?: string) => {
    if (!action) return null;

    const styles =
      action === "approved"
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles}`}>
        {t(`approvals.filters.${action}`)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={
                t("approvals.searchPlaceholder") ||
                "Search by publication title..."
              }
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">{t("approvals.filters.all")}</option>
              <option value="approved">
                {t("approvals.filters.approved")}
              </option>
              <option value="rejected">
                {t("approvals.filters.rejected")}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t("approvals.historyTable.publication")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t("approvals.historyTable.requestedBy")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t("approvals.historyTable.requestedAt")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t("approvals.historyTable.reviewedBy")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t("approvals.historyTable.action")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    {t("approvals.noHistory") || "No approval history found"}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {log.publication.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {log.requester.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(log.requested_at), "PPp", {
                          locale: i18n.language === "es" ? es : undefined,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {log.reviewer?.name || "-"}
                      </div>
                      {log.reviewed_at && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(log.reviewed_at), "PPp", {
                            locale: i18n.language === "es" ? es : undefined,
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getActionBadge(log.action)}
                      {log.action === "rejected" && log.rejection_reason && (
                        <div
                          className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs truncate"
                          title={log.rejection_reason}
                        >
                          {log.rejection_reason}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-neutral-700 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {t("common.previous") || "Previous"}
            </button>

            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t("common.pageOf", {
                current: currentPage,
                total: totalPages,
              }) || `Page ${currentPage} of ${totalPages}`}
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("common.next") || "Next"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
