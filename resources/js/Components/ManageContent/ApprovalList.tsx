import Button from "@/Components/common/Modern/Button";
import EmptyState from "@/Components/common/ui/EmptyState";
import ApprovalSuccessModal from "@/Components/ManageContent/modals/ApprovalSuccessModal";
import RejectionReasonModal from "@/Components/ManageContent/modals/RejectionReasonModal";
import { Publication } from "@/types/Publication";
import axios from "axios";
import { format, formatDistanceToNow } from "date-fns";
import { getDateFnsLocale } from "@/Utils/dateLocales";
import { Check, Clock, Eye, User, X } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface ApprovalListProps {
  publications: Publication[];
  isLoading: boolean;
  onRefresh: () => void;
  onViewDetail: (publication: Publication) => void;
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

  const handleApprove = async (publication: Publication) => {
    try {
      const response = await axios.post(
        route("publications.approve", publication.id),
      );
      if (response.data.success) {
        toast.success(t("approvals.approvedSuccess"));

        const pub = response.data.publication;
        // Show success modal with approver info
        setSelectedPublication(pub);
        setApprovalData({
          approverName: pub.approved_by?.name || "Admin",
          approvedAt: pub.approved_at,
        });
        setApprovalModalOpen(true);

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
        route("publications.reject", selectedPublication.id),
        {
          rejection_reason: reason,
        },
      );

      if (response.data.success) {
        toast.success(t("approvals.rejectedSuccess") || "Publication rejected");
        setRejectionModalOpen(false);
        setSelectedPublication(null);
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
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
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

  return (
    <>
      <div className="space-y-4">
        {publications.map((pub) => (
          <div
            key={pub.id}
            className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(pub.status)}`}
                  >
                    {t(`manageContent.status.${pub.status}`) || pub.status}
                  </span>
                  <span
                    className="text-xs text-gray-500 flex items-center gap-1.5"
                    title={format(new Date(pub.updated_at), "PPP HH:mm", {
                      locale,
                    })}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {format(new Date(pub.updated_at), "HH:mm")} (
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
                  onClick={() => handleApprove(pub)}
                  className="px-6"
                  icon={Check}
                  rounded="lg"
                >
                  {t("approvals.approve")}
                </Button>
                <Button
                  variant="danger"
                  buttonStyle="gradient"
                  onClick={() => handleRejectClick(pub)}
                  className="px-6"
                  icon={X}
                  rounded="lg"
                >
                  {t("approvals.reject") || "Reject"}
                </Button>
              </div>
            </div>
          </div>
        ))}
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
