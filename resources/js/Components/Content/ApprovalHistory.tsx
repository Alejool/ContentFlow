import ApprovalHistorySkeleton from "@/Components/Content/ApprovalHistorySkeleton";
import FilterSection from "@/Components/Content/common/FilterSection";
import AdvancedPagination from "@/Components/common/ui/AdvancedPagination";
import TableContainer from "@/Components/common/ui/TableContainer";
import { getDateFnsLocale } from "@/Utils/dateLocales";
import { ApprovalRequest } from "@/types/ApprovalTypes";
import axios from "axios";
import { format } from "date-fns";
import { CheckCircle, Clock, Send, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ApprovalHistoryProps {
  onRefresh?: () => void;
  publicationId?: number;
  initialData?: ApprovalRequest[]; // Datos iniciales si se pasan directamente
}

export default function ApprovalHistory({
  onRefresh,
  publicationId,
  initialData,
}: ApprovalHistoryProps) {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);
  const [requests, setRequests] = useState<ApprovalRequest[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
  });

  useEffect(() => {
    if (initialData) {
      // Modo cliente: filtrar datos localmente
      let filtered = [...initialData];

      if (filters.status !== "all") {
        filtered = filtered.filter((req) => req.status === filters.status);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(
          (req) =>
            req.submitter?.name.toLowerCase().includes(searchLower) ||
            req.rejection_reason?.toLowerCase().includes(searchLower),
        );
      }

      setRequests(filtered);
      setTotalItems(filtered.length);
      setTotalPages(Math.ceil(filtered.length / perPage));
      setIsLoading(false);
      return;
    }

    fetchHistory();
  }, [currentPage, perPage, filters, publicationId, initialData]);

  const fetchHistory = async () => {
    if (initialData) return; // No hacer fetch si tenemos datos iniciales

    try {
      setIsLoading(true);
      const endpoint = publicationId
        ? route("api.v1.approvals.publication.history", publicationId)
        : route("api.v1.approvals.history");

      const response = await axios.get(endpoint, {
        params: {
          page: currentPage,
          per_page: perPage,
          status: filters.status !== "all" ? filters.status : undefined,
          search: filters.search || undefined,
        },
      });

      if (response.data.success) {
        const data = response.data.history || response.data.data || [];
        setRequests(Array.isArray(data) ? data : data.data || []);
        setTotalPages(data.last_page || 1);
        setTotalItems(data.total || (Array.isArray(data) ? data.length : 0));
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

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any; label: string }> = {
      pending: {
        color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: Clock,
        label: t("approvals.status.pending"),
      },
      approved: {
        color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        icon: CheckCircle,
        label: t("approvals.status.approved"),
      },
      rejected: {
        color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
        icon: XCircle,
        label: t("approvals.status.rejected"),
      },
      cancelled: {
        color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
        icon: XCircle,
        label: t("approvals.status.cancelled"),
      },
    };

    const { color, icon: Icon, label } = config[status] || config.pending;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${color}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
    );
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "submitted":
        return <Send className="h-4 w-4 text-blue-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Calcular paginación para datos locales
  const displayedRequests = initialData
    ? requests.slice((currentPage - 1) * perPage, currentPage * perPage)
    : requests;

  return (
    <TableContainer
      title={t("approvals.historyTitle") || "Historial de Aprobaciones"}
      subtitle={
        t("approvals.historySubtitle") || "Registros completos de solicitudes de aprobación"
      }
    >
      <FilterSection
        mode="approvals"
        t={t}
        search={filters.search}
        setSearch={(value) => handleFilterChange("search", value)}
        statusFilter={filters.status}
        handleFilterChange={handleFilterChange}
      />

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50/50 dark:border-neutral-700 dark:bg-neutral-900/50">
            <tr className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {!publicationId && (
                <th className="w-[20%] px-6 py-4 text-left font-bold">
                  {t("approvals.historyTable.publication")}
                </th>
              )}
              <th className="w-[12%] px-6 py-4 text-left font-bold">
                {t("approvals.historyTable.submittedBy")}
              </th>
              <th className="w-[12%] px-6 py-4 text-left font-bold">
                {t("approvals.historyTable.submittedAt")}
              </th>
              <th className="w-[12%] px-6 py-4 text-left font-bold">
                {t("approvals.historyTable.status")}
              </th>
              <th className="w-[15%] px-6 py-4 text-left font-bold">
                {t("approvals.historyTable.currentReviewer") || "Revisor Actual"}
              </th>
              <th className="w-[12%] px-6 py-4 text-left font-bold">
                {t("approvals.historyTable.completedBy")}
              </th>
              <th className="w-[12%] px-6 py-4 text-left font-bold">
                {t("approvals.historyTable.actions")}
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
            ) : displayedRequests.length === 0 ? (
              <tr>
                <td colSpan={publicationId ? 6 : 7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <img
                      src="/assets/empty-state.svg"
                      alt="No History"
                      className="mb-4 h-auto w-40 object-contain opacity-80"
                    />
                    <p className="font-medium text-gray-500 dark:text-gray-400">
                      {t("approvals.noHistory")}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              displayedRequests.map((request) => (
                <tr
                  key={request.id}
                  className="transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-700/30"
                >
                  {!publicationId && (
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {request.publication?.title || t("common.unknown", "Unknown")}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {request.submitter?.photo_url && (
                        <img
                          src={request.submitter.photo_url}
                          alt={request.submitter.name}
                          className="h-8 w-8 rounded-full"
                        />
                      )}
                      <span className="text-gray-900 dark:text-white">
                        {request.submitter?.name || t("common.unknown")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(request.submitted_at), "PPp", { locale })}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                  <td className="px-6 py-4">
                    {request.status === "pending" && request.currentStep ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {request.currentStep.level_name ||
                              `Nivel ${request.currentStep.level_number}`}
                          </span>
                        </div>
                        {request.currentStep.role && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {request.currentStep.role.name}
                          </span>
                        )}
                        {request.currentStep.user && (
                          <span className="text-xs text-primary-600 dark:text-primary-400">
                            {request.currentStep.user.name}
                          </span>
                        )}
                        {request.workflow?.is_multi_level && (
                          <span className="text-xs text-gray-400">
                            ({request.currentStep.level_number}/
                            {request.workflow.levels?.length || "?"})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {request.completedBy ? (
                      <div>
                        <div className="text-gray-900 dark:text-white">
                          {request.completedBy.name}
                        </div>
                        {request.completed_at && (
                          <div className="text-xs text-gray-500">
                            {format(new Date(request.completed_at), "PPp", {
                              locale,
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {request.logs && request.logs.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {request.logs.slice(0, 3).map((log) => (
                            <div
                              key={log.id}
                              title={`${log.action} - ${log.user?.name || "System"}`}
                            >
                              {getActionIcon(log.action)}
                            </div>
                          ))}
                          {request.logs.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{request.logs.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                      {request.status === "rejected" && request.rejection_reason && (
                        <div
                          className="max-w-[200px] truncate text-xs text-rose-600 dark:text-rose-400"
                          title={request.rejection_reason}
                        >
                          {request.rejection_reason}
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
        perPage={perPage || 12}
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
