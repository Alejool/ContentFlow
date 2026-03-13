import Button from "@/Components/common/Modern/Button";
import { Publication } from "@/types/Publication";
import { getDateFnsLocale } from "@/Utils/dateLocales";
import { format } from "date-fns";
import {
    Check,
    CheckCircle,
    Clock,
    Info,
    User,
    X,
    XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import RejectionReasonModal from "./modals/RejectionReasonModal";

interface ApprovalLevelCardProps {
  level: {
    level_number: number;
    level_name: string;
    role: {
      id: number;
      name: string;
      display_name: string;
      slug: string;
    };
    is_current_level: boolean;
    is_past_level: boolean;
    is_future_level: boolean;
    approved_action?: {
      id: number;
      user: {
        id: number;
        name: string;
        email: string;
        photo_url?: string;
      };
      comment?: string;
      created_at: string;
    };
    rejected_action?: {
      id: number;
      user: {
        id: number;
        name: string;
        email: string;
        photo_url?: string;
      };
      comment?: string;
      created_at: string;
    };
    can_user_approve: boolean;
    status: "approved" | "rejected" | "in_review" | "pending" | "skipped";
  };
  publication: Publication;
  onApprove: (comment?: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

export default function ApprovalLevelCard({
  level,
  publication,
  onApprove,
  onReject,
}: ApprovalLevelCardProps) {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Determine visual status
  let statusColor = "gray";
  let statusIcon = Clock;
  let statusText = t("approvals.status.pending") || "Pendiente";
  let borderColor = "border-gray-300 dark:border-gray-700";
  let bgColor = "bg-gray-50 dark:bg-gray-800/50";

  if (level.status === "approved") {
    statusColor = "green";
    statusIcon = CheckCircle;
    statusText = t("approvals.status.approved") || "Aprobado";
    borderColor = "border-green-500 dark:border-green-600";
    bgColor = "bg-green-50 dark:bg-green-900/20";
  } else if (level.status === "rejected") {
    statusColor = "red";
    statusIcon = XCircle;
    statusText = t("approvals.status.rejected") || "Rechazado";
    borderColor = "border-red-500 dark:border-red-600";
    bgColor = "bg-red-50 dark:bg-red-900/20";
  } else if (level.is_current_level) {
    statusColor = "yellow";
    statusIcon = Clock;
    statusText = t("approvals.status.inReview") || "En Revisión";
    borderColor = "border-yellow-500 dark:border-yellow-600";
    bgColor = "bg-yellow-50 dark:bg-yellow-900/20";
  }

  const StatusIcon = statusIcon;

  const handleApproveClick = async () => {
    setIsApproving(true);
    try {
      await onApprove();
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectSubmit = async (reason: string) => {
    await onReject(reason);
    setShowRejectModal(false);
  };

  return (
    <>
      <div
        className={`border-2 rounded-lg p-5 transition-all duration-200 ${borderColor} ${bgColor}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center bg-${statusColor}-100 dark:bg-${statusColor}-900/30`}
            >
              <StatusIcon
                className={`w-6 h-6 text-${statusColor}-600 dark:text-${statusColor}-400`}
              />
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {t("approvals.level.title", {
                  number: level.level_number,
                  name: level.level_name,
                })}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {level.role.display_name}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold bg-${statusColor}-100 text-${statusColor}-700 dark:bg-${statusColor}-900/30 dark:text-${statusColor}-400 border border-${statusColor}-200 dark:border-${statusColor}-800`}
          >
            {statusText}
          </span>
        </div>

        {/* Approved Action Info */}
        {level.approved_action && (
          <div className="mt-3 p-4 bg-white dark:bg-neutral-800 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {t("approvals.level.approvedBy") || "Aprobado por"}:
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {level.approved_action.user.name}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {format(
                    new Date(level.approved_action.created_at),
                    "PPp",
                    { locale }
                  )}
                </p>
                {level.approved_action.comment && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 italic">
                    "{level.approved_action.comment}"
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rejected Action Info */}
        {level.rejected_action && (
          <div className="mt-3 p-4 bg-white dark:bg-neutral-800 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {t("approvals.level.rejectedBy") || "Rechazado por"}:
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {level.rejected_action.user.name}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {format(
                    new Date(level.rejected_action.created_at),
                    "PPp",
                    { locale }
                  )}
                </p>
                {level.rejected_action.comment && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
                      Motivo:
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {level.rejected_action.comment}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Only for current level if user can approve */}
        {level.can_user_approve && (
          <div className="mt-4 flex gap-3">
            <Button
              variant="success"
              buttonStyle="gradient"
              onClick={handleApproveClick}
              icon={Check}
              className="flex-1"
              disabled={isApproving}
            >
              {isApproving
                ? t("common.processing") || "Procesando..."
                : t("approvals.approve") || "Aprobar"}
            </Button>
            <Button
              variant="danger"
              buttonStyle="gradient"
              onClick={() => setShowRejectModal(true)}
              icon={X}
              className="flex-1"
              disabled={isApproving}
            >
              {t("approvals.reject") || "Rechazar"}
            </Button>
          </div>
        )}

        {/* Info Message - For current level when user cannot approve */}
        {level.is_current_level && !level.can_user_approve && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t("approvals.level.requiresRole") ||
                  "Este nivel requiere aprobación del rol"}
                : <strong>{level.role.display_name}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Waiting Message - For future levels */}
        {level.is_future_level && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("approvals.level.waitingFor") || "Esperando aprobación de"}:{" "}
                <strong>{level.role.display_name}</strong>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <RejectionReasonModal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          onSubmit={handleRejectSubmit}
          publicationTitle={publication.title}
        />
      )}
    </>
  );
}
