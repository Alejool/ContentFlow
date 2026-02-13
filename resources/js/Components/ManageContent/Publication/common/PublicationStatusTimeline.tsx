import {
  AlertCircle,
  Calendar,
  CheckCheck,
  CheckCircle,
  Circle,
  Clock,
  FileText,
  Loader2,
  Shield,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface PublicationStatusTimelineProps {
  currentStatus: string;
  scheduledAt?: string | null;
  approvedAt?: string | null;
  publishedAt?: string | null;
  rejectedAt?: string | null;
  compact?: boolean;
}

interface StatusStep {
  key: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}

const PublicationStatusTimeline = ({
  currentStatus,
  scheduledAt,
  approvedAt,
  publishedAt,
  rejectedAt,
  compact = false,
}: PublicationStatusTimelineProps) => {
  const { t } = useTranslation();

  // Define step templates
  const stepTemplates = {
    draft: {
      key: "draft",
      label: t("publications.status.draft") || "Borrador",
      icon: FileText,
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-100 dark:bg-gray-800",
      borderColor: "border-gray-300 dark:border-gray-600",
    },
    pending_review: {
      key: "pending_review",
      label: t("publications.status.pending_review") || "En Revisión",
      icon: Shield,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      borderColor: "border-yellow-300 dark:border-yellow-600",
    },
    approved: {
      key: "approved",
      label: t("publications.status.approved") || "Aprobado",
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      borderColor: "border-green-300 dark:border-green-600",
    },
    scheduled: {
      key: "scheduled",
      label: t("publications.status.scheduled") || "Programado",
      icon: Calendar,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      borderColor: "border-blue-300 dark:border-blue-600",
    },
    publishing: {
      key: "publishing",
      label: t("publications.status.publishing") || "Publicando",
      icon: Loader2,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      borderColor: "border-orange-300 dark:border-orange-600",
    },
    published: {
      key: "published",
      label: t("publications.status.published") || "Publicado",
      icon: CheckCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      borderColor: "border-emerald-300 dark:border-emerald-600",
    },
    rejected: {
      key: "rejected",
      label: t("publications.status.rejected") || "Rechazado",
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      borderColor: "border-red-300 dark:border-red-600",
    },
    failed: {
      key: "failed",
      label: t("publications.status.failed") || "Fallido",
      icon: AlertCircle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      borderColor: "border-red-300 dark:border-red-600",
    },
  };

  // Dynamically build the steps based on history and current status
  const getDynamicSteps = () => {
    const steps: (StatusStep & {
      state: "completed" | "current" | "upcoming";
    })[] = [];

    // 1. DRAFT (Always present, usually completed unless it's the current status)
    steps.push({
      ...stepTemplates.draft,
      state: currentStatus === "draft" ? "current" : "completed",
    });

    // 2. APPROVAL FLOW
    // Show Pending Review if:
    // - Status is pending_review (current)
    // - OR Status was rejected (implies review)
    // - OR We have approvedAt (implies review passed)
    // - OR Status is approved (current)
    const showPending =
      currentStatus === "pending_review" ||
      currentStatus === "rejected" ||
      currentStatus === "approved" ||
      !!approvedAt ||
      !!rejectedAt;

    if (showPending) {
      if (currentStatus === "pending_review") {
        steps.push({ ...stepTemplates.pending_review, state: "current" });
      } else {
        steps.push({ ...stepTemplates.pending_review, state: "completed" });
      }
    }

    // Show Approved if:
    // - Status is approved (current)
    // - OR We have approvedAt date
    const showApproved = currentStatus === "approved" || !!approvedAt;

    // Show Rejected if:
    // - Status is rejected
    // - OR We have rejectedAt date
    const showRejected = currentStatus === "rejected" || !!rejectedAt;

    if (showApproved) {
      steps.push({
        ...stepTemplates.approved,
        state: currentStatus === "approved" ? "current" : "completed",
      });
    } else if (showRejected) {
      steps.push({
        ...stepTemplates.rejected,
        state: "current", // Rejected is usually a terminal state
      });
      return steps; // Stop here for rejected
    }

    // 3. SCHEDULE FLOW
    // Show Scheduled if:
    // - Status is scheduled (current)
    // - OR We have scheduledAt date (and we are past scheduling)
    const showScheduled = currentStatus === "scheduled" || !!scheduledAt;

    if (showScheduled) {
      steps.push({
        ...stepTemplates.scheduled,
        state: currentStatus === "scheduled" ? "current" : "completed",
      });
    }

    // 4. PUBLISH FLOW
    if (currentStatus === "publishing") {
      steps.push({
        ...stepTemplates.publishing,
        state: "current",
      });
    } else if (currentStatus === "published") {
      steps.push({
        ...stepTemplates.published,
        state: "current",
      });
    } else if (currentStatus === "failed") {
      steps.push({
        ...stepTemplates.failed,
        state: "current",
      });
    }

    // 5. FUTURE PREDICTIONS (If status is active/early)
    if (currentStatus === "draft") {
      // Recommendation: Show next logical steps as upcoming
      // Draft -> Pending Review -> Approved
      // But we don't assume Scheduled.
      if (!steps.some((s) => s.key === "pending_review")) {
        steps.push({ ...stepTemplates.pending_review, state: "upcoming" });
      }
      if (!steps.some((s) => s.key === "approved")) {
        steps.push({ ...stepTemplates.approved, state: "upcoming" });
      }
    } else if (currentStatus === "pending_review") {
      if (!steps.some((s) => s.key === "approved")) {
        steps.push({ ...stepTemplates.approved, state: "upcoming" });
      }
    } else if (currentStatus === "approved" && !showScheduled) {
      // If approved and not scheduled, unlikely to imply scheduled.
      // Could show "Publishing" or just "Published" as upcoming?
      // Let's show Published as the goal.
      if (!steps.some((s) => s.key === "published")) {
        steps.push({ ...stepTemplates.published, state: "upcoming" });
      }
    } else if (currentStatus === "scheduled") {
      if (!steps.some((s) => s.key === "published")) {
        steps.push({ ...stepTemplates.published, state: "upcoming" });
      }
    }

    return steps;
  };

  const activeSteps = getDynamicSteps();

  if (compact) {
    // Compact horizontal timeline
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {activeSteps.map((step, index) => {
          const state = step.state;
          const Icon = step.icon;
          const isLast = index === activeSteps.length - 1;

          return (
            <div
              key={step.key}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                  state === "current"
                    ? `${step.bgColor} ${step.borderColor} ${step.color} font-semibold shadow-sm`
                    : state === "completed"
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                      : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500"
                }`}
              >
                {state === "completed" ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : state === "current" ? (
                  <Icon
                    className={`w-3.5 h-3.5 ${step.key === "publishing" ? "animate-spin" : ""}`}
                  />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
                <span className="text-xs whitespace-nowrap">{step.label}</span>
              </div>

              {!isLast && (
                <div
                  className={`h-0.5 w-4 ${
                    state === "completed"
                      ? "bg-green-300 dark:bg-green-700"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Full vertical timeline
  return (
    <div className="space-y-3">
      {activeSteps.map((step, index) => {
        const state = step.state;
        const Icon = step.icon;
        const isLast = index === activeSteps.length - 1;

        return (
          <div key={step.key} className="relative">
            <div className="flex items-start gap-3">
              {/* Icon Circle */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                  state === "current"
                    ? `${step.bgColor} ${step.borderColor} ${step.color} shadow-md`
                    : state === "completed"
                      ? "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-600 dark:text-green-400"
                      : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400"
                }`}
              >
                {state === "completed" ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon
                    className={`w-5 h-5 ${step.key === "publishing" && state === "current" ? "animate-spin" : ""}`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between">
                  <h4
                    className={`font-semibold text-sm ${
                      state === "current"
                        ? "text-gray-900 dark:text-white"
                        : state === "completed"
                          ? "text-gray-700 dark:text-gray-300"
                          : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {step.label}
                  </h4>

                  {/* Status badge */}
                  {state === "current" && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${step.bgColor} ${step.color}`}
                    >
                      {t("publications.status.current") || "Actual"}
                    </span>
                  )}
                  {state === "completed" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                      {t("publications.status.completed") || "Completado"}
                    </span>
                  )}
                </div>

                {/* Timestamp if available */}
                {state === "completed" && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {step.key === "approved" && approvedAt && (
                      <span>
                        {new Date(approvedAt).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    )}
                    {step.key === "published" && publishedAt && (
                      <span>
                        {new Date(publishedAt).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    )}
                  </p>
                )}

                {state === "current" &&
                  step.key === "scheduled" &&
                  scheduledAt && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {t("publications.scheduled_for") || "Programado para"}:{" "}
                        {new Date(scheduledAt).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </p>
                  )}
              </div>
            </div>

            {/* Connecting line */}
            {!isLast && (
              <div
                className={`absolute left-5 top-10 w-0.5 h-8 -ml-px ${
                  state === "completed"
                    ? "bg-green-300 dark:bg-green-700"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PublicationStatusTimeline;
