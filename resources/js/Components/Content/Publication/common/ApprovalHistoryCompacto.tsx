import type { ApprovalHistorySectionProps } from '@/Components/Content/Publication/common/edit/ApprovalHistorySection';
import ApprovalHistorySection from '@/Components/Content/Publication/common/edit/ApprovalHistorySection';
import { getApprovalColor } from '@/lib/common/designTokens';
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Clock, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ApprovalHistoryCompactoProps extends ApprovalHistorySectionProps {
  isExpanded: boolean;
  onToggle: () => void;
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

    const sortedLogs = [...logs].sort((a, b) => {
      const dateA = new Date(a.created_at || a.requested_at || 0).getTime();
      const dateB = new Date(b.created_at || b.requested_at || 0).getTime();
      return dateB - dateA;
    });

    return sortedLogs[0];
  };

  const getApprovalStats = () => {
    const approved = logs.filter((log) => log.action === 'approved').length;
    const rejected = logs.filter((log) => log.action === 'rejected').length;
    const pending = logs.filter((log) => log.action === 'submitted' || !log.action).length;

    return { approved, rejected, pending };
  };

  const latestLog = getLatestApprovalStatus();
  const totalLogs = logs.length;

  const getStatusColor = (action: string) => getApprovalColor(action);

  const getStatusText = (action: string) => {
    const map: Record<string, string> = {
      approved: t('approvals.status.approved'),
      rejected: t('approvals.status.rejected'),
      submitted: t('approvals.status.submitted'),
      pending: t('approvals.status.pending'),
      cancelled: t('approvals.status.cancelled'),
      reassigned: t('approvals.status.reassigned'),
      auto_advanced: t('approvals.status.auto_advanced'),
    };
    return map[action] ?? action;
  };

  const getStatusIcon = (action: string) => {
    if (action === 'approved') return <CheckCircle className="h-4 w-4" />;
    if (action === 'rejected') return <AlertCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  if (totalLogs === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-neutral-600 dark:bg-neutral-700/30">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-600/30"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-gray-200 bg-white p-2 dark:border-neutral-500 dark:bg-neutral-600">
            <Shield className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {t('approvals.historyTitle')}
              </span>
              {latestLog && (
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${getStatusColor(latestLog.action || 'pending')}`}
                >
                  {getStatusIcon(latestLog.action || 'pending')}
                  {getStatusText(latestLog.action || 'pending')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isExpanded ? t('common.collapse') : t('common.expand')}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="custom-scrollbar max-h-96 overflow-y-auto border-t border-gray-200 p-4 pr-2 dark:border-neutral-600">
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
