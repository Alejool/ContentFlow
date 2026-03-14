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
import { Publication } from "@/types/Publication";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { Locale, formatDistanceToNow } from "date-fns";
import { Check, Clock, Eye, Layers, User, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface ApprovalListProps {
  publications: Publication[];
  isLoading: boolean;
  onRefresh: () => void;
  onViewDetail: (publication: Publication) => void;
}

// Componente extraído fuera para evitar recreación en cada render
interface ApprovalPublicationItemProps {
  pub: Publication;
  onViewDetail: (publication: Publication) => void;
  onApprove: (publication: Publication) => void;
  onReject: (publication: Publication) => void;
  getStatusColor: (status?: string) => string;
  t: any;
  locale: Locale;
}

function ApprovalPublicationItem({
  pub,
  onViewDetail,
  onApprove,
  onReject,
  getStatusColor,
  t,
  locale,
}: ApprovalPublicationItemProps) {
  return (
    <div
      key={pub.id}
      className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow mb-4"
    >
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(pub.status)}`}
            >
              {t(`manageContent.status.${pub.status}`) || pub.status}
            </span>
            {pub.current_approval_step && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border border-primary-200 dark:border-primary-800 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {pub.current_approval_step.name}
                {pub.current_approval_step.workflow?.steps &&
                  ` (${pub.current_approval_step.level_number}/${pub.current_approval_step.workflow.steps.length})`}
              </span>
            )}
            <span
              className="text-xs text-gray-500 flex items-center gap-1.5"
              title={formatDateTimeString(pub.updated_at, {
                dateStyle: "long",
                timeStyle: "short",
              })}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {formatTimeString(pub.updated_at)} (
                {formatDistanceToNow(new Date(pub.updated_at), {
                  addSuffix: true,
                  locale,
                })}
                )
              </span>
            </span>
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white truncate">
            {pub.title}
          </h4>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <User className="w-4 h-4" />
            <span>{pub.user?.name || "User"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:self-center">
          <Button
            variant="ghost"
            buttonStyle="ghost"
            onClick={() => onViewDetail(pub)}
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
            onClick={() => onApprove(pub)}
            className="px-6 text-white"
            icon={Check}
            rounded="lg"
          >
            {t("approvals.approve")}
          </Button>
          <Button
            variant="danger"
            buttonStyle="gradient"
            onClick={() => onReject(pub)}
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
  publications,
  isLoading,
  onRefresh,
  onViewDetail,
}: ApprovalListProps) {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedPublication, setSelectedPublication] =
    useState<Publication | null>(null);
  const [approvalData, setApprovalData] = useState<{
    approverName: string;
    approvedAt: string;
  } | null>(null);

  // Get store methods
  const removePublication = usePublicationStore((s) => s.removePublication);
  const updatePublication = usePublicationStore((s) => s.updatePublication);
  const updateSelectedItem = useManageContentUIStore((s) => s.updateSelectedItem);
  const selectedItem = useManageContentUIStore((s) => s.selectedItem);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  // Check if user has admin permission or is assigned via workflow
  const { auth } = usePage<any>().props;
  const hasAdminPermission = auth.current_workspace?.permissions?.includes("approve") || false;

  const handleApprove = async (publication: Publication) => {
    try {
      const response = await axios.post(
        route("api.v1.publications.approve", publication.id),
      );
      if (response.data.success) {
        const pub = response.data.publication;

        if (pub.status === "approved") {
          toast.success(t("approvals.approvedSuccess"));
          // Show success modal with approver info
          setSelectedPublication(pub);
          setApprovalData({
            approverName: pub.approved_by?.name || "Admin",
            approvedAt: pub.approved_at,
          });
          setApprovalModalOpen(true);
          
          // DON'T remove manually - let onRefresh handle it
          // removePublication(publication.id);
        } else {
          // Partial approval (next step) - update the publication in store
          toast.success(
            `Aprobación del nivel registrada. Ahora en: ${pub.current_approval_step?.name || "Siguiente paso"}`,
          );
          
          // Update publication in store with new data including approval logs
          updatePublication(publication.id, pub);
          
          // If this publication is currently being viewed in a modal, update it
          if (selectedItem?.id === publication.id) {
            updateSelectedItem(pub);
          }
        }

        // CRITICAL: Refresh to get updated list from server
        // This will show publications for the next level if applicable
        onRefresh();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error approving");
    }
  };

  const handleRejectClick = (publication: Publication) => {
    setSelectedPublication(publication);
    setRejectionModalOpen(true);
  };

  const handleRejectSubmit = async (reason: string) => {
    if (!selectedPublication) return;

    try {
      const response = await axios.post(
        route("api.v1.publications.reject", selectedPublication.id),
        {
          rejection_reason: reason,
        },
      );

      if (response.data.success) {
        toast.success(t("approvals.rejectedSuccess") || "Publication rejected");
        setRejectionModalOpen(false);
        setSelectedPublication(null);
        
        // DON'T remove manually - let onRefresh handle it
        // removePublication(selectedPublication.id);
        
        // CRITICAL: Refresh to get updated list from server
        onRefresh();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.rejection_reason?.[0] ||
        "Error rejecting";
      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "pending_review":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700";
      case "approved":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700";
      case "rejected":
        return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-700";
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

  if (publications.length === 0) {
    return (
      <EmptyState
        title={t("approvals.noPending")}
        description={t("approvals.noPendingDesc")}
      />
    );
  }

  // Calculate pagination
  const totalItems = publications.length;
  const totalPages = Math.ceil(totalItems / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const displayedPublications = publications.slice(
    startIndex,
    startIndex + perPage,
  );

  // Wrapper para renderItem que pasa las props necesarias
  const renderItem = (pub: Publication) => (
    <ApprovalPublicationItem
      pub={pub}
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
            "Estás viendo solo el contenido que requiere tu aprobación según tu rol o asignación en el flujo de trabajo. Los administradores pueden ver todo el contenido pendiente."
          }
          className="mb-4"
        />
      )}
      
      <div className="flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <VirtualList
            items={displayedPublications}
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

        <div className="mt-4 pt-4  dark:border-neutral-700 bg-white dark:bg-neutral-900">
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
      {selectedPublication && (
        <RejectionReasonModal
          isOpen={rejectionModalOpen}
          onClose={() => {
            setRejectionModalOpen(false);
            setSelectedPublication(null);
          }}
          onSubmit={handleRejectSubmit}
          publicationTitle={selectedPublication.title}
        />
      )}

      {/* Approval Success Modal */}
      {selectedPublication && approvalData && (
        <ApprovalSuccessModal
          isOpen={approvalModalOpen}
          onClose={() => {
            setApprovalModalOpen(false);
            setSelectedPublication(null);
            setApprovalData(null);
          }}
          publicationTitle={selectedPublication.title}
          approverName={approvalData.approverName}
          approvedAt={approvalData.approvedAt}
        />
      )}
    </>
  );
}
