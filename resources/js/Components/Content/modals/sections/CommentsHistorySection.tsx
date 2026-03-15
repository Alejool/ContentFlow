import { CommentsSection } from "@/Components/Content/Publication/comments/CommentsSection";
import ApprovalHistoryCompacto from "@/Components/Content/Publication/common/ApprovalHistoryCompacto";
import TimelineCompacto from "@/Components/Content/Publication/common/TimelineCompacto";
import { TFunction } from "i18next";
import { SectionHeader } from "../common/SectionHeader";

interface CommentsHistorySectionProps {
  t: TFunction;
  publicationId?: number;
  currentUser: any;
  approvalLogs?: any[];
  activities?: any[];
  isApprovalHistoryExpanded: boolean;
  isTimelineExpanded: boolean;
  onApprovalHistoryToggle: () => void;
  onTimelineToggle: () => void;
  workflow?: any;
  currentStepNumber?: number;
  approvalStatus?: "pending" | "approved" | "rejected" | "cancelled";
}

export const CommentsHistorySection = ({
  t,
  publicationId,
  currentUser,
  approvalLogs,
  activities,
  isApprovalHistoryExpanded,
  isTimelineExpanded,
  onApprovalHistoryToggle,
  onTimelineToggle,
  workflow,
  currentStepNumber,
  approvalStatus,
}: CommentsHistorySectionProps) => {
  return (
    <>
      {/* Comentarios Internos */}
      {publicationId && (
        <div className="space-y-4">
          <SectionHeader
            title={t("publications.modal.edit.commentsSection") || "Comentarios Internos"}
            className="pt-6"
          />
          <CommentsSection publicationId={publicationId} currentUser={currentUser} />
        </div>
      )}

      {/* Historial y Actividad */}
      <div className="space-y-4">
        <SectionHeader
          title={t("publications.modal.edit.historySection") || "Historial"}
          className="pt-6"
        />

        <div className="space-y-4">
          {approvalLogs && approvalLogs.length > 0 && (
            <ApprovalHistoryCompacto
              logs={approvalLogs}
              isExpanded={isApprovalHistoryExpanded}
              onToggle={onApprovalHistoryToggle}
              workflow={workflow}
              currentStepNumber={currentStepNumber}
              approvalStatus={approvalStatus}
            />
          )}

          {activities && activities.length > 0 && (
            <TimelineCompacto
              activities={activities}
              isExpanded={isTimelineExpanded}
              onToggle={onTimelineToggle}
            />
          )}
        </div>
      </div>
    </>
  );
};
