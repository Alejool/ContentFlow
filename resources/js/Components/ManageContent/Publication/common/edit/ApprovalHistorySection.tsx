import { format } from "date-fns";
import { es } from "date-fns/locale";
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
}

interface ApprovalHistorySectionProps {
  logs: ApprovalLog[];
}

export default function ApprovalHistorySection({
  logs,
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
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
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
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {log.action === "approved"
                      ? t("approvals.status.approved") || "Aprobado"
                      : log.action === "rejected"
                        ? t("approvals.status.rejected") || "Rechazado"
                        : t("approvals.status.pending") ||
                          "Pendiente de revisión"}
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {format(new Date(log.requested_at), "PPp", {
                      locale: i18n.language === "es" ? es : undefined,
                    })}
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
  );
}
