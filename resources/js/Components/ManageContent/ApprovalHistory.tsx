import ApprovalHistorySkeleton from "@/Components/ManageContent/ApprovalHistorySkeleton";
import FilterSection from "@/Components/Content/common/FilterSection";
import AdvancedPagination from "@/Components/common/ui/AdvancedPagination";
import TableContainer from "@/Components/common/ui/TableContainer";
import { getDateFnsLocale } from "@/Utils/dateLocales";
import axios from "axios";
import { format } from "date-fns";
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
  publicationId?: number;
  logs?: ApprovalLogItem[]; // Optional: pass logs directly to avoid fetch
}

export default function ApprovalHistory({
  onRefresh,
  publicationId,
  logs: initialLogs,
}: ApprovalHistoryProps) {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);
  const [logs, setLogs] = useState<ApprovalLogItem[]>(initialLogs || []);
  const [isLoading, setIsLoading] = useState(!initialLogs);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    action: "all",
    search: "",
  });

  useEffect(() => {
    if (initialLogs && publicationId) {
      // Client-side filtering
      let filtered = [...initialLogs];

      if (filters.action !== "all") {
        filtered = filtered.filter((log) => log.action === filters.action);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(
          (log) =>
            log.requester.name.toLowerCase().includes(searchLower) ||
            (log.rejection_reason &&
              log.rejection_reason.toLowerCase().includes(searchLower)),
        );
      }

      setLogs(filtered);
      setIsLoading(false);
      setTotalItems(filtered.length);
      setTotalPages(1);
      return;
    }
    fetchHistory();
  }, [currentPage, perPage, filters, publicationId, initialLogs]);

  const fetchHistory = async () => {
    // Skip fetch if we are in client-side mode (initialLogs provided)
    if (initialLogs && publicationId) return;

    try {
      setIsLoading(true);
      const params: any = {
        page: currentPage,
        per_page: perPage,
        ...filters,
        ...(publicationId ? { publication_id: publicationId } : {}),
      };

      const response = await axios.get("/api/v1/approvals/history", { params });

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

  return (
    <TableContainer
      title={t("approvals.historyTitle") || "Historial de Aprobaciones"}
      subtitle={
        t("approvals.historySubtitle") || "Registros de estados y revisiones"
      }
    >
      <FilterSection
        mode="approvals"
        t={t}
        search={filters.search}
        setSearch={(value) => handleFilterChange("search", value)}
        statusFilter={filters.action}
        handleFilterChange={handleFilterChange}
      />
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/50 dark:bg-neutral-900/50 border-b border-gray-100 dark:border-neutral-700">
            <tr className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {!publicationId && (
                <th className="px-6 py-4 text-left font-bold w-[30%]">
                  {t("approvals.historyTable.publication")}
                </th>
              )}
              <th className="px-6 py-4 text-left font-bold w-[20%]">
                {t("approvals.historyTable.requestedBy")}
              </th>
              <th className="px-6 py-4 text-left font-bold w-[20%]">
                {t("approvals.historyTable.requestedAt")}
              </th>
              <th className="px-6 py-4 text-left font-bold w-[20%]">
                {t("approvals.historyTable.reviewedBy")}
              </th>
              <th className="px-6 py-4 text-left font-bold w-[10%]">
                {t("approvals.historyTable.action")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-neutral-700/50">
            {isLoading ? (
              <>
                {[...Array(perPage)].map((_, i) => (
                  <ApprovalHistorySkeleton key={i} />
                ))}
              </>
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan={publicationId ? 4 : 5}
                  className="px-6 py-16 text-center"
                >
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
                  {!publicationId && (
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {log.publication?.title || t("common.unknown", "Unknown")}
                    </td>
                  )}
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
