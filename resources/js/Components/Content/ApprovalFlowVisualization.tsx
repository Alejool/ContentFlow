import { ApprovalLog, ApprovalRequest } from "@/types/ApprovalTypes";
import { Publication } from "@/types/Publication";
import axios from "axios";
import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface ApprovalFlowVisualizationProps {
  publication: Publication;
  onRefresh?: () => void;
}

export default function ApprovalFlowVisualization({
  publication,
  onRefresh,
}: ApprovalFlowVisualizationProps) {
  const { t } = useTranslation();
  const [approvalRequest, setApprovalRequest] =
    useState<ApprovalRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [isActing, setIsActing] = useState(false);

  useEffect(() => {
    fetchApprovalStatus();
  }, [publication.id]);

  const fetchApprovalStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get(
        route("api.v1.approvals.publication.history", publication.id),
      );

      if (response.data.success) {
        // Tomar la solicitud más reciente (pending o la última)
        const history: ApprovalRequest[] = response.data.history || [];
        const active =
          history.find((r) => r.status === "pending") || history[0] || null;
        setApprovalRequest(active);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Error al cargar el estado de aprobación",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approvalRequest) return;
    try {
      setIsActing(true);
      const response = await axios.post(
        route("api.v1.approvals.approve", approvalRequest.id),
        { comment: comment || undefined },
      );

      if (response.data.success) {
        const updated: ApprovalRequest = response.data.request;
        if (updated.status === "approved") {
          toast.success(
            t("approvals.messages.finalApproval") ||
              "Aprobación final completada.",
          );
        } else {
          toast.success(
            t("approvals.messages.levelApproved", {
              level: updated.currentStep?.level_name || "Siguiente nivel",
            }) || "Nivel aprobado. Avanzando al siguiente.",
          );
        }
        setComment("");
        await fetchApprovalStatus();
        onRefresh?.();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al aprobar");
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async () => {
    if (!approvalRequest || !rejectionReason.trim()) {
      toast.error(
        t("approvals.errors.reasonRequired") || "La razón es requerida",
      );
      return;
    }
    try {
      setIsActing(true);
      const response = await axios.post(
        route("api.v1.approvals.reject", approvalRequest.id),
        { reason: rejectionReason },
      );

      if (response.data.success) {
        toast.success(t("approvals.rejectedSuccess") || "Solicitud rechazada.");
        setRejectionReason("");
        setShowRejectInput(false);
        await fetchApprovalStatus();
        onRefresh?.();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al rechazar");
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          {t("common.loading")}...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!approvalRequest) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {t("approvals.noActiveRequest") ||
          "No hay solicitud de aprobación activa."}
      </div>
    );
  }

  const levels = approvalRequest.workflow?.levels ?? [];
  const logs = approvalRequest.logs ?? [];
  const totalLevels = levels.length;
  const completedLevels = logs.filter((l) => l.action === "approved").length;
  const progressPct =
    totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;

  // Determinar si el usuario puede aprobar (viene del backend en canApprove)
  const isPending = approvalRequest.status === "pending";

  return (
    <div className="space-y-5">
      {/* Barra de progreso */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-5">
        <div className="flex items-center justify-between mb-2 text-sm text-gray-600 dark:text-gray-400">
          <span>
            {t("approvals.flowVisualization.completedLevels") ||
              "Niveles completados"}
            : {completedLevels} / {totalLevels}
          </span>
          <span>{progressPct}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Estado actual */}
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {t("approvals.currentStatus") || "Estado"}:
          </span>
          <StatusBadge status={approvalRequest.status} t={t} />
        </div>
      </div>

      {/* Línea de tiempo de niveles */}
      {levels.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-5">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            {t("approvals.flowVisualization.title") || "Flujo de aprobación"}
          </h4>
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
                isPending &&
                approvalRequest.currentStep?.level_number ===
                  level.level_number;
              const isDone = !!approvedLog;
              const isRejected = !!rejectedLog;

              return (
                <div key={level.id} className="relative">
                  {index < levels.length - 1 && (
                    <div
                      className={`absolute left-5 top-10 h-full w-0.5 ${
                        isDone
                          ? "bg-green-400"
                          : isRejected
                            ? "bg-red-400"
                            : "bg-gray-200 dark:bg-neutral-700"
                      }`}
                    />
                  )}
                  <div className="flex items-start gap-3">
                    {/* Círculo indicador */}
                    <div
                      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm ${
                        isDone
                          ? "bg-green-500 text-white"
                          : isRejected
                            ? "bg-red-500 text-white"
                            : isCurrent
                              ? "bg-primary-500 text-white ring-4 ring-primary-200 dark:ring-primary-900"
                              : "bg-gray-200 dark:bg-neutral-700 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : isRejected ? (
                        <XCircle className="w-5 h-5" />
                      ) : isCurrent ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        level.level_number
                      )}
                    </div>

                    {/* Info del nivel */}
                    <div className="flex-1 pt-1.5 pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {level.level_name}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-medium rounded-full">
                            {t("approvals.inProgress") || "En revisión"}
                          </span>
                        )}
                        {isRejected && (
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
                      {/* Log de acción */}
                      {(approvedLog || rejectedLog) && (
                        <LogEntry log={(approvedLog || rejectedLog)!} t={t} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historial de logs */}
      {logs.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-5">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            {t("approvals.auditTrail") || "Historial de acciones"}
          </h4>
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 text-sm py-2 border-b border-gray-100 dark:border-neutral-700 last:border-0"
              >
                <ActionIcon action={log.action} />
                <div className="flex-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {log.user?.name || t("common.system")}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">
                    — {t(`approvals.actions.${log.action}`) || log.action}
                    {log.level_number
                      ? ` (${t("approvals.level") || "Nivel"} ${log.level_number})`
                      : ""}
                  </span>
                  {log.comment && (
                    <p className="text-gray-600 dark:text-gray-400 mt-0.5 italic">
                      "{log.comment}"
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones: Aprobar / Rechazar */}
      {isPending && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-5 space-y-3">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {t("approvals.yourAction") || "Tu acción"}
          </h4>

          {/* Comentario opcional */}
          {!showRejectInput && (
            <textarea
              className="w-full rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={2}
              placeholder={
                t("approvals.commentOptional") || "Comentario opcional..."
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          )}

          {/* Input de rechazo */}
          {showRejectInput && (
            <div className="space-y-2">
              <textarea
                className="w-full rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder={
                  t("approvals.rejectionReasonRequired") ||
                  "Razón del rechazo (requerida)..."
                }
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={isActing || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isActing
                    ? t("common.loading")
                    : t("approvals.confirmReject") || "Confirmar rechazo"}
                </button>
                <button
                  onClick={() => {
                    setShowRejectInput(false);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}

          {!showRejectInput && (
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={isActing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {isActing ? t("common.loading") : t("approvals.approve")}
              </button>
              <button
                onClick={() => setShowRejectInput(true)}
                disabled={isActing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <XCircle className="w-4 h-4" />
                {t("approvals.reject")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Aprobado final */}
      {approvalRequest.status === "approved" && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            {t("approvals.approvedReadyToPublish") ||
              "Aprobado. Listo para publicar."}
          </p>
        </div>
      )}

      {/* Rechazado */}
      {approvalRequest.status === "rejected" && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                {t("approvals.requestRejected") || "Solicitud rechazada"}
              </p>
              {approvalRequest.rejection_reason && (
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {approvalRequest.rejection_reason}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-componentes auxiliares

function StatusBadge({ status, t }: { status: string; t: any }) {
  const config: Record<string, { color: string; label: string }> = {
    pending: {
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      label: t("approvals.status.pending") || "Pendiente",
    },
    approved: {
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      label: t("approvals.status.approved") || "Aprobado",
    },
    rejected: {
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      label: t("approvals.status.rejected") || "Rechazado",
    },
    cancelled: {
      color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
      label: t("approvals.status.cancelled") || "Cancelado",
    },
  };
  const { color, label } = config[status] || config.pending;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${color}`}>
      {label}
    </span>
  );
}

function LogEntry({ log, t }: { log: ApprovalLog; t: any }) {
  return (
    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
      {log.user?.name && <span>{log.user.name} · </span>}
      {new Date(log.created_at).toLocaleString()}
      {log.comment && <span className="italic ml-1">"{log.comment}"</span>}
    </div>
  );
}

function ActionIcon({ action }: { action: string }) {
  const cls = "w-4 h-4 flex-shrink-0 mt-0.5";
  switch (action) {
    case "approved":
      return <CheckCircle className={`${cls} text-green-500`} />;
    case "rejected":
      return <XCircle className={`${cls} text-red-500`} />;
    default:
      return <Clock className={`${cls} text-gray-400`} />;
  }
}
