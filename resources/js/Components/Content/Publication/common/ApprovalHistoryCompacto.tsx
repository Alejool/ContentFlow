import ApprovalHistorySection from "@/Components/Content/Publication/common/edit/ApprovalHistorySection";
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ApprovalHistoryCompactoProps {
  logs: any[];
  isExpanded: boolean;
  onToggle: () => void;
  workflow?: any;
  currentStepNumber?: number;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'cancelled';
}

const ApprovalHistoryCompacto = ({
  logs,
  isExpanded,
  onToggle,
  workflow,
  currentStepNumber,
  approvalStatus,
}: ApprovalHistoryCompactoProps) => {
  const { t } = useTranslation();
  const getLatestApprovalStatus = () => {
    if (!logs || logs.length === 0) return null;

    const sortedLogs = [...logs].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return sortedLogs[0];
  };

  const getApprovalStats = () => {
    const approved = logs.filter((log) => log.action === "approved").length;
    const rejected = logs.filter((log) => log.action === "rejected").length;
    const pending = logs.filter((log) => log.action === "submitted" || (!log.action)).length;

    return { approved, rejected, pending };
  };

  const latestLog = getLatestApprovalStatus();
  const stats = getApprovalStats();
  const totalLogs = logs.length;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      approved:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    };
    return (
      colors[status] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    );
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      approved: "Aprobado",
      rejected: "Rechazado",
      pending: "Pendiente",
    };
    return texts[status] || status;
  };

  const getStatusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle className="w-4 h-4" />;
    if (status === "rejected") return <AlertCircle className="w-4 h-4" />;
    return <Shield className="w-4 h-4" />;
  };

  if (totalLogs === 0) return null;

  return (
    <div className="bg-gray-50 dark:bg-neutral-700/30 rounded-lg border border-gray-200 dark:border-neutral-600 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-neutral-600/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-neutral-600 rounded-lg border border-gray-200 dark:border-neutral-500">
            <Shield className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {t("approvals.historyTitle")}
              </span>
              {latestLog && (
                <span
                  className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(latestLog.action)}`}
                >
                  {getStatusIcon(latestLog.action)}
                  {getStatusText(latestLog.action)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isExpanded ? t("common.collapse") : t("common.expand")}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-neutral-600 p-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          <ApprovalHistorySection 
            logs={logs} 
            workflow={workflow}
            currentStepNumber={currentStepNumber}
            approvalStatus={approvalStatus}
          />
        </div>
      )}
    </div>
  );
};

export default ApprovalHistoryCompacto;
