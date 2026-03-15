import Button from "@/Components/common/Modern/Button";
import { usePage } from "@inertiajs/react";
import { AlertCircle, CheckCircle2, Send, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ContentPublishButtonProps {
  content: any;
  onPublish?: () => void;
  isLoading?: boolean;
}

export default function ContentPublishButton({
  content,
  onPublish,
  isLoading = false,
}: ContentPublishButtonProps) {
  const { t } = useTranslation();
  const { auth } = usePage().props as any;

  // Permissions check
  const isOwner = auth.user.id === content.workspace?.created_by;
  const hasPublishPermission =
    auth.current_workspace?.permissions?.includes("publish");

  // Check if approved based on approval_request (source of truth)
  const isApproved =
    (content.status === "approved" &&
      content.approval_request?.status === "approved" &&
      content.approval_request?.completed_by) ||
    (content.status === "approved" && !content.approval_request); // No workflow, just status

  const isDraft = content;
  content.status === "rejected" || content.approval_status === "rejected";

  // Can publish if:
  // 1. Is workspace owner (bypasses everything)
  // 2. Has publish permission AND content is approved (regardless of who created it)
  const canPublish = isOwner || (hasPublishPermission && isApproved);
  const needsApproval = !isApproved && !isOwner;

  // Determine button state and message
  let buttonDisabled = !canPublish || isLoading;
  let errorMessage = "";

  if (!hasPublishPermission && !isOwner) {
    buttonDisabled = true;
    errorMessage = t("content.publish.no_permission");
  } else if (needsApproval && !isApproved) {
    buttonDisabled = true;
    errorMessage = t("content.publish.approval_required");
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={onPublish}
        disabled={buttonDisabled}
        loading={isLoading}
        variant="primary"
        icon={Send}
        className="w-full sm:w-auto"
        title={errorMessage || t("content.publish.button")}
      >
        {t("content.publish.button")}
      </Button>

      {/* Show approval required message */}
      {needsApproval && !isOwner && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{t("content.publish.approval_required_message")}</span>
        </div>
      )}

      {/* Show pending review status */}
      {isPendingReview && (
        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-200 dark:border-blue-800">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{t("content.publish.pending_review")}</span>
        </div>
      )}

      {/* Show rejected status */}
      {isRejected && (
        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-800">
          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{t("content.publish.rejected_message")}</span>
        </div>
      )}

      {/* Show approved and ready to publish */}
      {isApproved && hasPublishPermission && (
        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 p-1">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{t("content.publish.ready")}</span>
        </div>
      )}

      {/* Show owner bypass message */}
      {isOwner && !isApproved && (
        <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg border border-purple-200 dark:border-purple-800">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{t("content.publish.owner_bypass")}</span>
        </div>
      )}

      {/* Show no permission error */}
      {!hasPublishPermission && !isOwner && (
        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-800">
          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{t("content.publish.no_permission")}</span>
        </div>
      )}
    </div>
  );
}
