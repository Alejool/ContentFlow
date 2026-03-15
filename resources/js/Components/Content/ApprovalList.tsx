import ApprovalSuccessModal from "@/Components/Content/modals/ApprovalSuccessModal";
import RejectionReasonModal from "@/Components/Content/modals/RejectionReasonModal";
import AlertCard from "@/Components/common/Modern/AlertCard";
import Button from "@/Components/common/Modern/Button";
import AdvancedPagination from "@/Components/common/ui/AdvancedPagination";
import EmptyState from "@/Components/common/ui/EmptyState";
import { VirtualList } from "@/Components/common/ui/VirtualList";
import { formatDateTimeString } from "@/Utils/dateHelpers";
import { getDateFnsLocale } from "@/Utils/dateLocales";
import { useManageContentUIStore } from "@/stores/manageContentUIStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { ApprovalRequest } from "@/types/ApprovalTypes";
import { Publication } from "@/types/Publication";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { Locale, formatDistanceToNow } from "date-fns";
import { Check, Clock, Eye, FileText, Layers, User, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface ApprovalListProps {
  requests: ApprovalRequest[] | undefined;
  isLoading: boolean;
  onRefresh: () => void;
  onViewDetail: (publication: Publication) => void;
}

interface ApprovalRequestItemProps {
  request: ApprovalRequest;
  onViewDetail: (publication: Publication) => void;
  onApprove: (request: ApprovalRequest) => void;
  onReject: (request: ApprovalRequest) => void;
  getStatusColor: (status?: string) => string;
  t: any;
  locale: Locale;
}

function ApprovalRequestItem({
  request,
  onViewDetail,
  onApprove,
  onReject,
  getStatusColor,
  t,
  locale,
}: ApprovalRequestItemProps) {
  const publication = request.publication;
  if (!publication) return null;

  // Get media preview
  const firstMedia = publication.media_files?.[0];
  const mediaPreview =
    firstMedia?.thumbnail?.file_path || firstMedia?.file_path;

  return (
    <div className="group bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:border-primary-400 dark:hover:border-primary-600">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-800 px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${getStatusColor(request.status)}`}
          >
            {t(`approvals.status.${request.status}`) || request.status}
          </span>
          {request.currentStep && (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 border border-primary-300 dark:border-primary-700 flex items-center gap-1.5 shadow-sm">
              <Layers className="w-3.5 h-3.5" />
              {request.currentStep.level_name}
              {request.workflow?.levels &&
                ` (${request.currentStep.level_number}/${request.workflow.levels.length})`}
            </span>
          )}
          <span
            className="ml-auto text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-900 rounded-full border border-gray-200 dark:border-neutral-700"
            title={formatDateTimeString(request.submitted_at, {
              dateStyle: "long",
              timeStyle: "short",
            })}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="font-medium">
              {formatDistanceToNow(new Date(request.submitted_at), {
                addSuffix: true,
                locale,
              })}
            </span>
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Media Preview */}
          {mediaPreview && (
            <div className="flex-shrink-0">
              <div className="relative w-full lg:w-40 h-40 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-900 dark:to-neutral-800 shadow-md group-hover:shadow-lg transition-shadow">
                <img
                  src={mediaPreview}
                  alt={publication.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          )}

          {/* Content Details */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Title */}
            <div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {publication.title}
              </h3>
              {publication.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {publication.description}
                </p>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Submitter */}
              <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-neutral-900/50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {t("approvals.historyTable.submittedBy")}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {request.submitter?.name || "User"}
                  </p>
                </div>
              </div>

              {/* Content Type */}
              {publication.content_type && (
                <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-neutral-900/50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {t("common.type") || "Tipo"}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                      {publication.content_type}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Workflow Progress */}
            {request.workflow?.levels && request.currentStep && (
              <div className="pt-3 border-t border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t("approvals.progress") || "Progreso de Aprobación"}
                  </span>
                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                    {request.currentStep.level_number} /{" "}
                    {request.workflow.levels.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(request.currentStep.level_number / request.workflow.levels.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="bg-gray-50 dark:bg-neutral-900/50 px-6 py-4 border-t border-gray-200 dark:border-neutral-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="ghost"
            buttonStyle="outline"
            onClick={() => onViewDetail(publication)}
            className="flex-1 sm:flex-none border-gray-300 dark:border-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-800"
            icon={Eye}
            rounded="lg"
          >
            {t("common.viewDetails") || "Ver Detalles"}
          </Button>

          <div className="flex-1 flex gap-3">
            <Button
              variant="success"
              buttonStyle="gradient"
              onClick={() => onApprove(request)}
              className="flex-1 text-white shadow-md hover:shadow-lg"
              icon={Check}
              rounded="lg"
            >
              {t("approvals.approve") || "Aprobar"}
            </Button>

            <Button
              variant="danger"
              buttonStyle="gradient"
              onClick={() => onReject(request)}
              className="flex-1 text-white shadow-md hover:shadow-lg"
              icon={X}
              rounded="lg"
            >
              {t("approvals.reject") || "Rechazar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApprovalList({
  requests,
  isLoading,
  onRefresh,
  onViewDetail,
}: ApprovalListProps) {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<ApprovalRequest | null>(null);
  const [approvalData, setApprovalData] = useState<{
    approverName: string;
    approvedAt: string;
  } | null>(null);

  // Get store methods
  const updatePublication = usePublicationStore((s) => s.updatePublication);
  const updateSelectedItem = useManageContentUIStore(
    (s) => s.updateSelectedItem,
  );
  const selectedItem = useManageContentUIStore((s) => s.selectedItem);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  // Check if user has admin permission
  const { auth } = usePage<any>().props;
  const hasAdminPermission =
    auth.current_workspace?.permissions?.includes("approve") || false;

  const handleApprove = async (request: ApprovalRequest) => {
    try {
      const response = await axios.post(
        route("api.v1.approvals.approve", request.id),
        {
          comment: null, // Opcional: agregar modal para comentario
        },
      );

      if (response.data.success) {
        const updatedRequest = response.data.request;

        if (updatedRequest.status === "approved") {
          // Aprobación final
          toast.success(t("approvals.approvedSuccess"));
          setSelectedRequest(updatedRequest);
          setApprovalData({
            approverName: updatedRequest.completedBy?.name || auth.user.name,
            approvedAt: updatedRequest.completed_at,
          });
          setApprovalModalOpen(true);
        } else {
          // Aprobación parcial - avanzó al siguiente nivel
          toast.success(
            t("approvals.levelApproved", {
              level:
                updatedRequest.currentStep?.level_name || "Siguiente nivel",
            }),
          );

          // Actualizar publicación en el store
          if (updatedRequest.publication) {
            updatePublication(
              updatedRequest.publication_id,
              updatedRequest.publication,
            );
          }

          // Actualizar item seleccionado si está abierto
          if (selectedItem?.id === updatedRequest.publication_id) {
            updateSelectedItem(updatedRequest.publication);
          }
        }

        // Refrescar lista
        onRefresh();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("approvals.errors.approveFailed"),
      );
    }
  };

  const handleRejectClick = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setRejectionModalOpen(true);
  };

  const handleRejectSubmit = async (reason: string) => {
    if (!selectedRequest) return;

    try {
      const response = await axios.post(
        route("api.v1.approvals.reject", selectedRequest.id),
        {
          reason: reason,
        },
      );

      if (response.data.success) {
        toast.success(t("approvals.rejectedSuccess") || "Request rejected");
        setRejectionModalOpen(false);
        setSelectedRequest(null);

        // Refrescar lista
        onRefresh();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.reason?.[0] ||
        t("approvals.errors.rejectFailed");
      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700";
      case "approved":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700";
      case "rejected":
        return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-700";
      case "cancelled":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 shadow-sm overflow-hidden"
          >
            {/* Header skeleton */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-800 px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
              <div className="flex items-center gap-2">
                <div className="h-7 w-24 bg-gray-200 dark:bg-neutral-700 rounded-full animate-pulse" />
                <div className="h-7 w-32 bg-gray-200 dark:bg-neutral-700 rounded-full animate-pulse" />
                <div className="h-7 w-28 bg-gray-200 dark:bg-neutral-700 rounded-full animate-pulse ml-auto" />
              </div>
            </div>

            {/* Content skeleton */}
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Media skeleton */}
                <div className="flex-shrink-0">
                  <div className="w-full lg:w-40 h-40 bg-gray-200 dark:bg-neutral-700 rounded-xl animate-pulse" />
                </div>

                {/* Details skeleton */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <div className="h-7 w-3/4 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
                    <div className="h-4 w-full bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="h-16 bg-gray-100 dark:bg-neutral-900/50 rounded-lg animate-pulse" />
                    <div className="h-16 bg-gray-100 dark:bg-neutral-900/50 rounded-lg animate-pulse" />
                  </div>
                  <div className="pt-3 space-y-2">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
                    <div className="h-2 w-full bg-gray-200 dark:bg-neutral-700 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions skeleton */}
            <div className="bg-gray-50 dark:bg-neutral-900/50 px-6 py-4 border-t border-gray-200 dark:border-neutral-700">
              <div className="flex gap-3">
                <div className="h-10 w-32 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
                <div className="h-10 flex-1 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
                <div className="h-10 flex-1 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const safeRequests = requests ?? [];

  if (!safeRequests.length && !isLoading) {
    return (
      <EmptyState
        title={t("approvals.noPending")}
        description={t("approvals.noPendingDesc")}
      />
    );
  }

  // Calculate pagination
  const totalItems = safeRequests.length;
  const totalPages = Math.ceil(totalItems / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const displayedRequests = safeRequests.slice(
    startIndex,
    startIndex + perPage,
  );

  const renderItem = (request: ApprovalRequest) => (
    <ApprovalRequestItem
      request={request}
      onViewDetail={onViewDetail}
      onApprove={handleApprove}
      onReject={handleRejectClick}
      getStatusColor={getStatusColor}
      t={t}
      locale={locale}
    />
  );

  return (
    <>
      {!hasAdminPermission && (
        <AlertCard
          type="info"
          title={
            t("approvals.workflowAssignment.title") || "Aprobaciones asignadas"
          }
          message={
            t("approvals.workflowAssignment.description") ||
            "Estás viendo solo las solicitudes que requieren tu aprobación según tu rol o asignación en el flujo de trabajo."
          }
          className="mb-4"
        />
      )}

      <div className="flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <VirtualList
            items={displayedRequests}
            estimatedItemSize={120}
            overscan={3}
            renderItem={renderItem}
            emptyState={
              <EmptyState
                title={t("approvals.noPending")}
                description={t("approvals.noPendingDesc")}
              />
            }
          />
        </div>

        <div className="mt-4 pt-4 dark:border-neutral-700 bg-white dark:bg-neutral-900">
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
          />
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {selectedRequest && (
        <RejectionReasonModal
          isOpen={rejectionModalOpen}
          onClose={() => {
            setRejectionModalOpen(false);
            setSelectedRequest(null);
          }}
          onSubmit={handleRejectSubmit}
          publicationTitle={selectedRequest.publication?.title || ""}
        />
      )}

      {/* Approval Success Modal */}
      {selectedRequest && approvalData && (
        <ApprovalSuccessModal
          isOpen={approvalModalOpen}
          onClose={() => {
            setApprovalModalOpen(false);
            setSelectedRequest(null);
            setApprovalData(null);
          }}
          publicationTitle={selectedRequest.publication?.title || ""}
          approverName={approvalData.approverName}
          approvedAt={approvalData.approvedAt}
        />
      )}
    </>
  );
}
