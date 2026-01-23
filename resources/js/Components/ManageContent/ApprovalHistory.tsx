import AdvancedPagination from "@/Components/common/ui/AdvancedPagination";
import TableContainer from "@/Components/common/ui/TableContainer";
import axios from "axios";
import { format } from "date-fns";
import { getDateFnsLocale } from "@/Utils/dateLocales";
import { Search } from "lucide-react";
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
  const locale = getDateFnsLocale(i18n.language);
  const [logs, setLogs] = useState<ApprovalLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    action: "all",
    search: "",
  });

  useEffect(() => {
    fetchHistory();
  }, [currentPage, perPage, filters]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page: currentPage,
        per_page: perPage,
        ...filters,
      };

      const response = await axios.get(route("approvals.history"), { params });

      const json = response.data;
      if (json.success) {
        const dataContainer = json.logs ? json : json.data || {};
        const logs = dataContainer.logs;

        if (logs) {
          setLogs(logs.data || []);
          setTotalPages(logs.last_page || 1);
          setTotalItems(logs.total || 0);
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

  const headerActions = (
    <div className="flex items-center gap-4">
      {/* Action Filter */}
      <select
        value={filters.action}
        onChange={(e) => handleFilterChange("action", e.target.value)}
        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm focus:ring-2 focus:ring-primary-500 transition-colors"
      >
        <option value="all">{t("approvals.filters.all")}</option>
        <option value="approved">{t("approvals.filters.approved")}</option>
        <option value="rejected">{t("approvals.filters.rejected")}</option>
      </select>

      {/* Search */}
      <div className="relative min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder={t("approvals.searchPlaceholder") || "Search..."}
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm focus:ring-2 focus:ring-primary-500 transition-colors"
        />
      </div>
    </div>
  );

  return (
    <TableContainer
      title={t("approvals.historyTitle") || "Historial de Aprobaciones"}
      subtitle={
        t("approvals.historySubtitle") || "Registros de estados y revisiones"
      }
      actions={headerActions}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/50 dark:bg-neutral-900/50 border-b border-gray-100 dark:border-neutral-700">
            <tr className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <th className="px-6 py-4 text-left font-bold">
                {t("approvals.historyTable.publication")}
              </th>
              <th className="px-6 py-4 text-left font-bold">
                {t("approvals.historyTable.requestedBy")}
              </th>
              <th className="px-6 py-4 text-left font-bold">
                {t("approvals.historyTable.requestedAt")}
              </th>
              <th className="px-6 py-4 text-left font-bold">
                {t("approvals.historyTable.reviewedBy")}
              </th>
              <th className="px-6 py-4 text-left font-bold">
                {t("approvals.historyTable.action")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-neutral-700/50">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12">
                  <div className="flex justify-center flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <span className="text-sm text-gray-500">
                      {t("common.loading")}
                    </span>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <img
                      src="/assets/empty-state.svg"
                      alt="No History"
                      className="w-40 h-auto object-contain mb-4 opacity-80"
                    />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      {t("approvals.noHistory")}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-neutral-700/30 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {log.publication.title}
                  </td>
                  <td className="px-6 py-4">{log.requester.name}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {format(new Date(log.requested_at), "PPp", { locale })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 dark:text-white">
                      {log.reviewer?.name || "-"}
                    </div>
                    {log.reviewed_at && (
                      <div className="text-xs text-gray-500">
                        {format(new Date(log.reviewed_at), "PPp", { locale })}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {getActionBadge(log.action)}
                      {log.action === "rejected" && log.rejection_reason && (
                        <div
                          className="text-xs text-gray-500 max-w-[200px] truncate"
                          title={log.rejection_reason}
                        >
                          {log.rejection_reason}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdvancedPagination
        currentPage={currentPage}
        lastPage={totalPages}
        total={totalItems}
        perPage={perPage}
        onPageChange={setCurrentPage}
        onPerPageChange={(val) => {
          setPerPage(val);
          setCurrentPage(1);
        }}
        t={t}
        isLoading={isLoading}
      />
    </TableContainer>
  );
}
