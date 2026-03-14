import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import axios from "axios";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface ApprovalStatus {
  status: string;
  current_level: number | null;
  next_approver_role: string | null;
  last_action: string | null;
  last_action_at: string | null;
  last_action_by: string | null;
}

interface ContentApprovalStatusProps {
  content: any;
  approvalStatus: ApprovalStatus;
  canApprove: boolean;
  canReject: boolean;
  canSubmit: boolean;
  isMultiLevel: boolean;
  totalLevels?: number;
  onStatusChange?: () => void;
}

export default function ContentApprovalStatus({
  content,
  approvalStatus,
  canApprove,
  canReject,
  canSubmit,
  isMultiLevel,
  totalLevels = 1,
  onStatusChange,
}: ContentApprovalStatusProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [comment, setComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const getStatusBadge = () => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      draft: {
        color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
        icon: AlertCircle,
        label: t("approval.status.draft"),
      },
      pending_review: {
        color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: Clock,
        label: t("approval.status.pending_review"),
      },
      approved: {
        color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        icon: CheckCircle,
        label: t("approval.status.approved"),
      },
      rejected: {
        color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        icon: XCircle,
        label: t("approval.status.rejected"),
      },
      published: {
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        icon: CheckCircle,
        label: t("approval.status.published"),
      },
    };

    const config = statusConfig[approvalStatus.status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </div>
    );
  };

  const getProgressIndicator = () => {
    if (!isMultiLevel || approvalStatus.status !== "pending_review") {
      return null;
    }

    const currentLevel = approvalStatus.current_level || 0;
    const levels = Array.from({ length: totalLevels }, (_, i) => i + 1);

    return (
      <div className="flex items-center gap-2">
        {levels.map((level, index) => (
          <div key={level} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                level < currentLevel
                  ? "bg-green-500 text-white"
                  : level === currentLevel
                    ? "bg-primary-500 text-white animate-pulse"
                    : "bg-gray-200 dark:bg-neutral-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              {level < currentLevel ? <CheckCircle className="w-4 h-4" /> : level}
            </div>
            {index < levels.length - 1 && (
              <div
                className={`w-12 h-1 ${
                  level < currentLevel
                    ? "bg-green-500"
                    : "bg-gray-200 dark:bg-neutral-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const handleSubmitForApproval = async () => {
    try {
      setIsSubmitting(true);
      const response = await axios.post(route("api.content.submit-for-approval", content.id));
      
      // Update stores with fresh data
      const publication = response.data?.data?.content || response.data?.data?.publication;
      if (publication) {
        const publicationStoreModule = await import("@/stores/publicationStore");
        const manageContentUIStoreModule = await import("@/stores/manageContentUIStore");
        
        // CRITICAL: Update immediately with new status
        publicationStoreModule.usePublicationStore.getState().updatePublication(content.id, {
          status: publication.status,
          current_approval_step_id: publication.current_approval_step_id,
          currentApprovalStep: publication.currentApprovalStep,
          approval_logs: publication.approval_logs,
          approvalLogs: publication.approval_logs,
          submitted_for_approval_at: publication.submitted_for_approval_at,
          ...publication
        });
        
        // Also update selectedItem if this publication is currently open in a modal
        const selectedItem = manageContentUIStoreModule.useManageContentUIStore.getState().selectedItem;
        if (selectedItem?.id === content.id) {
          manageContentUIStoreModule.useManageContentUIStore.getState().updateSelectedItem({
            status: publication.status,
            current_approval_step_id: publication.current_approval_step_id,
            currentApprovalStep: publication.currentApprovalStep,
            approval_logs: publication.approval_logs,
            approvalLogs: publication.approval_logs,
            submitted_for_approval_at: publication.submitted_for_approval_at,
            ...publication
          });
        }
      }
      
      toast.success(t("approval.success.submitted"));
      onStatusChange?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("approval.errors.submit_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      await axios.post(route("api.content.approve", content.id), {
        comment: comment || undefined,
      });
      toast.success(t("approval.success.approved"));
      setShowApproveModal(false);
      setComment("");
      onStatusChange?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("approval.errors.approve_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error(t("approval.errors.rejection_reason_required"));
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(route("api.content.reject", content.id), {
        reason: rejectionReason,
      });
      toast.success(t("approval.success.rejected"));
      setShowRejectModal(false);
      setRejectionReason("");
      onStatusChange?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("approval.errors.reject_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Badge and Info */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">
              {t("approval.current_status")}
            </h4>
            {getStatusBadge()}
          </div>
        </div>

        {/* Next Approver Info */}
        {approvalStatus.status === "pending_review" && approvalStatus.next_approver_role && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
              {isMultiLevel
                ? t("approval.pending_review_by_role", { role: approvalStatus.next_approver_role })
                : t("approval.pending_review_by_any_admin")}
            </p>
          </div>
        )}

        {/* Progress Indicator for Multi-Level */}
        {isMultiLevel && approvalStatus.status === "pending_review" && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t("approval.progress")}
            </p>
            {getProgressIndicator()}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6">
        <div className="flex flex-wrap gap-3">
          {/* Submit for Approval */}
          {canSubmit && approvalStatus.status === "draft" && (
            <Button
              variant="primary"
              buttonStyle="solid"
              onClick={handleSubmitForApproval}
              disabled={isSubmitting}
              icon={Send}
            >
              {t("approval.submit_for_approval")}
            </Button>
          )}

          {/* Approve Button */}
          {canApprove && approvalStatus.status === "pending_review" && (
            <Button
              variant="primary"
              buttonStyle="solid"
              onClick={() => setShowApproveModal(true)}
              disabled={isSubmitting}
              icon={ThumbsUp}
            >
              {t("approval.approve")}
            </Button>
          )}

          {/* Reject Button */}
          {canReject && approvalStatus.status === "pending_review" && (
            <Button
              variant="danger"
              buttonStyle="outline"
              onClick={() => setShowRejectModal(true)}
              disabled={isSubmitting}
              icon={ThumbsDown}
            >
              {t("approval.reject")}
            </Button>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t("approval.approve_content")}
            </h3>
            
            <Input
              id="approve-comment"
              label={t("approval.comment_optional")}
              value={comment}
              onChange={(e: any) => setComment(e.target.value)}
              placeholder={t("approval.add_comment")}
              multiline
              rows={3}
            />

            <div className="flex gap-3 mt-6">
              <Button
                variant="ghost"
                buttonStyle="outline"
                onClick={() => {
                  setShowApproveModal(false);
                  setComment("");
                }}
                className="flex-1"
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                buttonStyle="solid"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex-1"
                icon={ThumbsUp}
              >
                {t("approval.approve")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t("approval.reject_content")}
            </h3>
            
            <Input
              id="reject-reason"
              label={t("approval.rejection_reason")}
              value={rejectionReason}
              onChange={(e: any) => setRejectionReason(e.target.value)}
              placeholder={t("approval.explain_rejection")}
              required
            />

            <div className="flex gap-3 mt-6">
              <Button
                variant="ghost"
                buttonStyle="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                className="flex-1"
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="danger"
                buttonStyle="solid"
                onClick={handleReject}
                disabled={isSubmitting || !rejectionReason.trim()}
                className="flex-1"
                icon={ThumbsDown}
              >
                {t("approval.reject")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
