import { ApprovalRequest } from "@/types/ApprovalTypes";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ApprovalWorkflowStatusProps {
  approvalRequest: ApprovalRequest | null | undefined;
  className?: string;
}

export default function ApprovalWorkflowStatus({
  approvalRequest,
  className = "",
}: ApprovalWorkflowStatusProps) {
  const { t } = useTranslation();

  if (!approvalRequest) return null;

  const {
    status,
    currentStep,
    workflow,
    logs = [],
    rejection_reason,
  } = approvalRequest;
  const levels = workflow?.levels ?? [];

  // Último rechazo
  const lastRejection = [...logs]
    .filter((l) => l.action === "rejected")
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];

  const isRejected = status === "rejected";
  const isApproved = status === "approved";
  const isPending = status === "pending";

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      label: t("approvals.status.pending") || "En revisión",
    },
    approved: {
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      label: t("approvals.status.approved") || "Aprobado",
    },
    rejected: {
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      label: t("approvals.status.rejected") || "Rechazado",
    },
    cancelled: {
      icon: AlertCircle,
      color: "text-gray-600 dark:text-gray-400",
      bg: "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800",
      label: t("approvals.status.cancelled") || "Cancelado",
    },
  };

  const cfg =
    statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;
  const StatusIcon = cfg.icon;

  // Progreso
  const completedLevels = logs.filter((l) => l.action === "approved").length;
  const totalLevels = levels.length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Estado actual */}
      <div className={`border rounded-xl p-4 ${cfg.bg}`}>
        <div className="flex items-start gap-3">
          <StatusIcon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${cfg.color}`} />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              {cfg.label}
            </h4>
            {isPending && currentStep && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t("approvals.awaitingLevel") || "Esperando aprobación en"}:{" "}
                <span className="font-medium">{currentStep.level_name}</span>
                {currentStep.role && ` (${currentStep.role.name})`}
              </p>
            )}
            {isApproved && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t("approvals.approvedReadyToPublish") ||
                  "Aprobado. Listo para publicar."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Detalle del rechazo */}
      {isRejected && (lastRejection || rejection_reason) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {lastRejection?.user && (
                <h5 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                  {t("approvals.rejectedBy") || "Rechazado por"}:{" "}
                  {lastRejection.user.name}
                </h5>
              )}
              {lastRejection?.level_number && (
                <p className="text-xs text-red-700 dark:text-red-300 mb-2">
                  {t("approvals.rejectedAtLevel") || "En nivel"}{" "}
                  {lastRejection.level_number}
                </p>
              )}
              {(lastRejection?.comment || rejection_reason) && (
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <span className="font-medium">
                      {t("approvals.reason") || "Razón"}:
                    </span>{" "}
                    {lastRejection?.comment || rejection_reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progreso del flujo */}
      {levels.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4">
          <h5 className="font-semibold text-gray-900 dark:text-white mb-4">
            {t("approvals.workflowProgress") || "Progreso del flujo"}
          </h5>

          {/* Barra */}
          {totalLevels > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1.5">
                <span>{t("approvals.progress") || "Progreso"}</span>
                <span>
                  {completedLevels} / {totalLevels}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${totalLevels > 0 ? (completedLevels / totalLevels) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Niveles */}
          <div className="space-y-3">
            {levels.map((level, index) => {
              const approvedLog = logs.find(
                (l) =>
                  l.action === "approved" &&
                  l.level_number === level.level_number,
              );
              const rejectedLog = logs.find(
                (l) =>
                  l.action === "rejected" &&
                  l.level_number === level.level_number,
              );
              const isCurrent =
                isPending && currentStep?.level_number === level.level_number;
              const isDone = !!approvedLog;
              const isRejectedHere = !!rejectedLog;

              return (
                <div key={level.id} className="relative">
                  {index < levels.length - 1 && (
                    <div
                      className={`absolute left-5 top-10 bottom-0 w-0.5 ${
                        isDone
                          ? "bg-green-500"
                          : isRejectedHere
                            ? "bg-red-500"
                            : "bg-gray-200 dark:bg-neutral-700"
                      }`}
                    />
                  )}
                  <div className="flex items-start gap-3">
                    <div
                      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm ${
                        isDone
                          ? "bg-green-500 text-white"
                          : isRejectedHere
                            ? "bg-red-500 text-white"
                            : isCurrent
                              ? "bg-primary-500 text-white animate-pulse"
                              : "bg-gray-200 dark:bg-neutral-700 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : isRejectedHere ? (
                        <XCircle className="w-5 h-5" />
                      ) : isCurrent ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        level.level_number
                      )}
                    </div>

                    <div className="flex-1 pt-1 pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {level.level_name}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-medium rounded-full">
                            {t("approvals.inProgress") || "En revisión"}
                          </span>
                        )}
                        {isRejectedHere && (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">
                            {t("approvals.rejectedHere") || "Rechazado aquí"}
                          </span>
                        )}
                      </div>
                      {level.role && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {t("approvals.approverRole") || "Rol"}:{" "}
                          {level.role.name}
                        </p>
                      )}
                      {/* Quién aprobó/rechazó */}
                      {(approvedLog || rejectedLog) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {(approvedLog || rejectedLog)!.user?.name} ·{" "}
                          {new Date(
                            (approvedLog || rejectedLog)!.created_at,
                          ).toLocaleString()}
                          {(approvedLog || rejectedLog)!.comment && (
                            <span className="italic ml-1">
                              "{(approvedLog || rejectedLog)!.comment}"
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
