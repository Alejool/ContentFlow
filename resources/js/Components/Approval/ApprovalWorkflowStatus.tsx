import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ApprovalWorkflow {
  id: number;
  name: string;
  is_enabled: boolean;
  is_multi_level: boolean;
  current_level: number;
  max_level: number;
  levels: Array<{
    id: number;
    level_number: number;
    level_name: string;
    role: {
      id: number;
      name: string;
      slug: string;
    } | null;
  }>;
  status_info: {
    current_status: string;
    can_submit_for_approval: boolean;
    is_pending_review: boolean;
    is_approved: boolean;
    is_rejected: boolean;
    next_action: string;
  };
}

interface ApprovalLog {
  id: number;
  action_type: "submitted" | "approved" | "rejected";
  approval_level: number | null;
  comment?: string;
  requester?: {
    id: number;
    name: string;
    photo_url?: string;
  };
  reviewer?: {
    id: number;
    name: string;
    photo_url?: string;
  };
  requested_at?: string;
  reviewed_at?: string;
  created_at: string;
}

interface ApprovalWorkflowStatusProps {
  workflow: ApprovalWorkflow;
  approvalLogs?: ApprovalLog[];
  className?: string;
}

export default function ApprovalWorkflowStatus({
  workflow,
  approvalLogs = [],
  className = "",
}: ApprovalWorkflowStatusProps) {
  const { t } = useTranslation();

  if (!workflow || !workflow.is_enabled) {
    return null;
  }

  const { status_info, levels, current_level, max_level } = workflow;

  // Encontrar el último rechazo
  const lastRejection = approvalLogs
    .filter((log) => log.action_type === "rejected")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  // Obtener el nivel actual
  const currentLevelInfo = levels.find((l) => l.level_number === current_level);
  const nextLevelInfo = levels.find((l) => l.level_number === current_level + 1);

  const getStatusIcon = () => {
    if (status_info.is_rejected) return XCircle;
    if (status_info.is_approved) return CheckCircle;
    if (status_info.is_pending_review) return Clock;
    return AlertCircle;
  };

  const getStatusColor = () => {
    if (status_info.is_rejected) return "text-red-600 dark:text-red-400";
    if (status_info.is_approved) return "text-green-600 dark:text-green-400";
    if (status_info.is_pending_review) return "text-yellow-600 dark:text-yellow-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getStatusBgColor = () => {
    if (status_info.is_rejected) return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    if (status_info.is_approved) return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    if (status_info.is_pending_review) return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    return "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800";
  };

  const getStatusText = () => {
    if (status_info.is_rejected) return t("approval.status.rejected");
    if (status_info.is_approved) return t("approval.status.approved");
    if (status_info.is_pending_review) return t("approval.status.pending_review");
    if (status_info.can_submit_for_approval) return t("approval.status.ready_to_submit");
    return t("approval.status.draft");
  };

  const getNextActionText = () => {
    const { next_action } = status_info;

    if (next_action === "submit_for_approval") {
      return t("approval.next_action.submit_for_approval");
    }

    if (next_action.startsWith("awaiting_level_")) {
      const levelMatch = next_action.match(/awaiting_level_(\d+)_approval/);
      if (levelMatch) {
        const levelNum = parseInt(levelMatch[1]);
        const level = levels.find((l) => l.level_number === levelNum);
        return t("approval.next_action.awaiting_level_approval", {
          level: level?.level_name || `Nivel ${levelNum}`,
          role: level?.role?.name || t("common.unknown"),
        });
      }
    }

    if (next_action === "awaiting_final_approval") {
      const finalLevel = levels[levels.length - 1];
      return t("approval.next_action.awaiting_final_approval", {
        role: finalLevel?.role?.name || t("common.unknown"),
      });
    }

    if (next_action === "ready_to_publish") {
      return t("approval.next_action.ready_to_publish");
    }

    return "";
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Estado Actual */}
      <div className={`border rounded-xl p-4 ${getStatusBgColor()}`}>
        <div className="flex items-start gap-3">
          <StatusIcon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${getStatusColor()}`} />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              {getStatusText()}
            </h4>
            {getNextActionText() && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {getNextActionText()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mensaje de Rechazo */}
      {status_info.is_rejected && lastRejection && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                {t("approval.rejected_by", { name: lastRejection.reviewer?.name || t("common.unknown") })}
              </h5>
              {lastRejection.comment && (
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <span className="font-medium">{t("approval.reason")}:</span> {lastRejection.comment}
                  </p>
                </div>
              )}
              {lastRejection.approval_level && (
                <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                  {t("approval.rejected_at_level", { level: lastRejection.approval_level })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Flujo de Aprobación */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4">
        <h5 className="font-semibold text-gray-900 dark:text-white mb-4">
          {t("approval.workflow_progress")}
        </h5>

        {/* Barra de Progreso */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>{t("approval.progress")}</span>
            <span>
              {current_level} / {max_level}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(current_level / max_level) * 100}%` }}
            />
          </div>
        </div>

        {/* Niveles del Flujo */}
        <div className="space-y-3">
          {levels.map((level, index) => {
            // Buscar el log de aprobación para este nivel
            const stepLog = approvalLogs.find(log => log.approval_level === level.level_number);
            
            // Un nivel está completado si tiene un log con reviewer (fue revisado)
            const isCompleted = stepLog?.reviewer !== null && stepLog?.reviewer !== undefined;
            
            // Un nivel es el actual si coincide con current_level y está en pending_review y NO está completado
            const isCurrent = level.level_number === current_level && status_info.is_pending_review && !isCompleted;
            
            // Un nivel está pendiente si es mayor al actual y no está completado
            const isPending = level.level_number > current_level && !isCompleted;
            
            // Verificar si fue rechazado en este nivel
            const wasRejectedHere = lastRejection?.approval_level === level.level_number;

            return (
              <div key={level.id} className="relative">
                {/* Línea conectora */}
                {index < levels.length - 1 && (
                  <div
                    className={`absolute left-5 top-10 bottom-0 w-0.5 ${
                      isCompleted
                        ? "bg-green-500"
                        : wasRejectedHere
                          ? "bg-red-500"
                          : "bg-gray-200 dark:bg-neutral-700"
                    }`}
                  />
                )}

                <div className="flex items-start gap-3">
                  {/* Icono del Nivel */}
                  <div
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isCurrent
                          ? "bg-primary-500 text-white animate-pulse"
                          : wasRejectedHere
                            ? "bg-red-500 text-white"
                            : "bg-gray-200 dark:bg-neutral-700 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : wasRejectedHere ? (
                      <XCircle className="w-5 h-5" />
                    ) : isCurrent ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      level.level_number
                    )}
                  </div>

                  {/* Información del Nivel */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h6 className="font-semibold text-gray-900 dark:text-white">
                        {level.level_name}
                      </h6>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-medium rounded-full">
                          {t("approval.in_progress")}
                        </span>
                      )}
                      {wasRejectedHere && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">
                          {t("approval.rejected_here")}
                        </span>
                      )}
                    </div>
                    {level.role && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("approval.approver_role")}: {level.role.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Información Adicional */}
      {status_info.is_approved && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle className="w-5 h-5" />
            <p className="text-sm font-medium">
              {t("approval.approved_ready_to_publish")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
