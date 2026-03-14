import ApprovalSuccessModal from "@/Components/Content/modals/ApprovalSuccessModal";
import RejectionReasonModal from "@/Components/Content/modals/RejectionReasonModal";
import AlertCard from "@/Components/common/Modern/AlertCard";
import Button from "@/Components/common/Modern/Button";
import AdvancedPagination from "@/Components/common/ui/AdvancedPagination";
import EmptyState from "@/Components/common/ui/EmptyState";
import { VirtualList } from "@/Components/common/ui/VirtualList";
import { formatDateTimeString, formatTimeString } from "@/Utils/dateHelpers";
import { getDateFnsLocale } from "@/Utils/dateLocales";
import { useManageContentUIStore } from "@/stores/manageContentUIStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { ApprovalRequest } from "@/types/ApprovalTypes";
import { Publication } from "@/types/Publication";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { Locale, formatDistanceToNow } from "date-fns";
import { Check, Clock, Eye, Layers, User, X } from "lucide-react";
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

  return (
    <div
      key={request.id}
      className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow mb-4"
    >
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(request.status)}`}
            >
              {t(`approvals.status.${request.status}`) || request.status}
            </span>
            {request.currentStep && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border border-primary-200 dark:border-primary-800 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {request.currentStep.level_name}
                {request.workflow?.levels &&
                  ` (${request.currentStep.level_number}/${request.workflow.levels.length})`}
              </span>
            )}
            <span
              className="text-xs text-gray-500 flex items-center gap-1.5"
              title={formatDateTimeString(request.submitted_at, {
                dateStyle: "long",
                timeStyle: "short",
              })}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {formatTimeString(request.submitted_at)} (
                {formatDistanceToNow(new Date(request.submitted_at), {
                  addSuffix: true,
                  locale,
                })}
                )
              </span>
            </span>
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white truncate">
            {publication.title}
          </h4>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <User className="w-4 h-4" />
            <span>{request.submitter?.name || "User"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:self-center">
          <Button
            variant="ghost"
            buttonStyle="ghost"
            onClick={() => onViewDetail(publication)}
            className="p-2 min-w-0"
            icon={Eye}
            title={t("common.view")}
            rounded="lg"
            shadow="none"
          >
            {""}
          </Button>

          <Button
            variant="success"
            buttonStyle="gradient"
            onClick={() => onApprove(request)}
            className="px-6 text-white"
            icon={Check}
            rounded="lg"
          >
            {t("approvals.approve")}
          </Button>
          <Button
            variant="danger"
            buttonStyle="gradient"
            onClick={() => onReject(request)}
            className="px-6 text-white"
            icon={X}
            rounded="lg"
          >
            {t("approvals.reject") || "Reject"}
          </Button>
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
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [approvalData, setApprovalData] = useState<{
    approverName: string;
    approvedAt: string;
  } | null>(null);

  // Get store methods
  const updatePublication = usePublicationStore((s) => s.updatePublication);
  const updateSelectedItem = useManageContentUIStore((s) => s.updateSelectedItem);
  const selectedItem = useManageContentUIStore((s) => s.selectedItem);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  // Check if user has admin permission
  const { auth } = usePage<any>().props;
  const hasAdminPermission = auth.current_workspace?.permissions?.includes("approve") || false;

  const handleApprove = async (request: ApprovalRequest) => {
    try {
      const response = await axios.post(
        route("api.v1.approvals.approve", request.id),
        {
          comment: null, // Opcional: agregar modal para comentario
        }
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
              level: updatedRequest.currentStep?.level_name || "Siguiente nivel",
            })
          );

          // Actualizar publicación en el store
          if (updatedRequest.publication) {
            updatePublication(updatedRequest.publication_id, updatedRequest.publication);
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
      toast.error(error.response?.data?.message || t("approvals.errors.approveFailed"));
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
        }
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
            className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-gray-200 dark:border-neutral-700 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-24 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
                </div>
                <div className="h-6 w-3/4 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-neutral-700 rounded-full animate-pulse" />
                  <div className="h-4 w-20 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-3 sm:self-center">
                <div className="h-10 w-10 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
                <div className="h-10 w-24 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
                <div className="h-10 w-24 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
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
  const displayedRequests = safeRequests.slice(startIndex, startIndex + perPage);

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
          title={t("approvals.workflowAssignment.title") || "Aprobaciones asignadas"}
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
