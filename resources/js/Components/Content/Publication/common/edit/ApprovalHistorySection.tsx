import { Avatar } from "@/Components/common/Avatar";
import { formatDateTime } from "@/Utils/formatDate";
import { CheckCircle, Clock, MessageSquare, User, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ApprovalLog {
  id: number;
  requested_by: number;
  requested_at: string;
  reviewed_by: number | null;
  reviewed_at: string | null;
  action: "approved" | "rejected" | null;
  rejection_reason: string | null;
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
  step?: {
    id: number;
    name: string;
    level_number: number;
    role?: {
      id: number;
      name: string;
    };
  };
}

interface ApprovalHistorySectionProps {
  logs: ApprovalLog[];
  workflow?: {
    id: number;
    name: string;
    steps: Array<{
      id: number;
      name: string;
      level_number: number;
      role?: {
        id: number;
        name: string;
      };
      user?: {
        id: number;
        name: string;
        photo_url?: string;
      };
    }>;
  };
  currentStepNumber?: number;
}

export default function ApprovalHistorySection({
  logs,
  workflow,
  currentStepNumber,
}: ApprovalHistorySectionProps) {
  const { t, i18n } = useTranslation();

  if (!logs || logs.length === 0) {
    return null;
  }

  const getStatusIcon = (action: string | null) => {
    switch (action) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusStyle = (action: string | null) => {
    switch (action) {
      case "approved":
        return "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20";
      case "rejected":
        return "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20";
      default:
        return "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Flow Visualization */}
      {workflow && workflow.steps && workflow.steps.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {t("approvals.workflow_flow") || "Flujo de Aprobación"}: {workflow.name}
          </h4>
          
          <div className="space-y-2">
            {workflow.steps.map((step, index) => {
              // Verificar si este nivel está completado (tiene log de aprobación)
              const stepLog = logs.find(log => log.step?.id === step.id);
              const isCompleted = stepLog?.action === 'approved';
              
              // Verificar si es el nivel actual
              const isCurrent = currentStepNumber !== undefined && step.level_number === currentStepNumber && !isCompleted;
              
              // Un nivel está en el pasado si está completado O si su número es menor al actual
              const isPast = isCompleted || (currentStepNumber !== undefined && step.level_number < currentStepNumber);
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isCurrent
                      ? 'bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-400 dark:border-blue-600 shadow-sm'
                      : isPast
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-white/50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700'
                  }`}
                >
                  {/* Step Number/Status Icon or User Avatar */}
                  {step.user ? (
                    // Mostrar avatar del usuario si está asignado
                    <div className="relative">
                      <div className={`${
                        isCurrent
                          ? 'ring-2 ring-blue-300 dark:ring-blue-700'
                          : isPast || isCompleted
                          ? 'ring-2 ring-green-300 dark:ring-green-700'
                          : ''
                      } rounded-full`}>
                        <Avatar
                          src={step.user.photo_url}
                          name={step.user.name}
                          size="md"
                          className={`border-2 ${
                            isCurrent
                              ? 'border-blue-500'
                              : isPast || isCompleted
                              ? 'border-green-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                      </div>
                      {(isPast || isCompleted) && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-800">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Mostrar número si es por rol
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      isCurrent
                        ? 'bg-blue-500 text-white ring-2 ring-blue-300 dark:ring-blue-700'
                        : isPast || isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}>
                      {isPast || isCompleted ? '✓' : step.level_number}
                    </div>
                  )}
                  
                  {/* Step Info */}
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {step.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      {step.user ? (
                        // Mostrar nombre del usuario
                        <>
                          <User className="w-3 h-3" />
                          {step.user.name}
                        </>
                      ) : (
                        // Mostrar rol
                        <>
                          <User className="w-3 h-3" />
                          {step.role?.name || t("approvals.no_role_assigned") || "Sin rol asignado"}
                        </>
                      )}
                      {stepLog?.reviewer && !step.user && (
                        <span className="text-gray-500 dark:text-gray-500">
                          • {stepLog.reviewer.name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  {isCurrent && (
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 px-2 py-1 bg-blue-200 dark:bg-blue-800 rounded-full">
                      {t("approvals.in_progress") || "En Proceso"}
                    </span>
                  )}
                  {(isPast || isCompleted) && stepLog?.action === "approved" && (
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">
                      ✓ {t("common.approved") || "Aprobado"}
                    </span>
                  )}
                  {stepLog?.action === "rejected" && (
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      ✗ {t("common.rejected") || "Rechazado"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Approval History */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary-500" />
          {t("approvals.historyTitle") || "Historial de Aprobación"}
        </h3>

        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`p-4 rounded-lg border transition-all ${getStatusStyle(log.action)}`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5">{getStatusIcon(log.action)}</div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {log.action === "approved"
                          ? t("approvals.status.approved") || "Aprobado"
                          : log.action === "rejected"
                            ? t("approvals.status.rejected") || "Rechazado"
                            : t("approvals.status.pending") ||
                              "Pendiente de revisión"}
                      </span>
                      {log.step && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t("approvals.step") || "Nivel"} {log.step.level_number}: {log.step.name}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {formatDateTime(log.requested_at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 opacity-70" />
                      <span>
                        {t("approvals.requestedBy") || "Solicitado por"}:
                      </span>
                      <span className="font-bold text-gray-700 dark:text-gray-300">
                        {log.requester?.name ||
                          t("common.unknownUser") ||
                          "Usuario Desconocido"}
                      </span>
                    </div>

                    {log.reviewer && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 opacity-70" />
                        <span>
                          {t("approvals.reviewedBy") || "Revisado por"}:
                        </span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                          {log.reviewer.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {log.action === "rejected" && log.rejection_reason && (
                    <div className="mt-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-rose-200/50 dark:border-rose-900/30">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-3.5 h-3.5 text-rose-500 opacity-70" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                          {t("approvals.rejectionReason") || "Motivo del rechazo"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                        "{log.rejection_reason}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
