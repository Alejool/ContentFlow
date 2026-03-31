import { ApprovalRequest } from '@/types/ApprovalTypes';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ApprovalWorkflowStatusProps {
  approvalRequest: ApprovalRequest | null | undefined;
  className?: string;
}

export default function ApprovalWorkflowStatus({
  approvalRequest,
  className = '',
}: ApprovalWorkflowStatusProps) {
  const { t } = useTranslation();

  if (!approvalRequest) return null;

  const { status, currentStep, workflow, logs = [], rejection_reason } = approvalRequest;
  const levels = workflow?.levels ?? [];

  // Último rechazo
  const lastRejection = [...logs]
    .filter((l) => l.action === 'rejected')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  const isRejected = status === 'rejected';
  const isApproved = status === 'approved';
  const isPending = status === 'pending';

  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      label: t('approvals.status.pending') || 'En revisión',
    },
    approved: {
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      label: t('approvals.status.approved') || 'Aprobado',
    },
    rejected: {
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      label: t('approvals.status.rejected') || 'Rechazado',
    },
    cancelled: {
      icon: AlertCircle,
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800',
      label: t('approvals.status.cancelled') || 'Cancelado',
    },
  };

  const cfg = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;
  const StatusIcon = cfg.icon;

  // Progreso
  const completedLevels = logs.filter((l) => l.action === 'approved').length;
  const totalLevels = levels.length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Estado actual */}
      <div className={`rounded-xl border p-4 ${cfg.bg}`}>
        <div className="flex items-start gap-3">
          <StatusIcon className={`mt-0.5 h-6 w-6 flex-shrink-0 ${cfg.color}`} />
          <div className="flex-1">
            <h4 className="mb-1 font-semibold text-gray-900 dark:text-white">{cfg.label}</h4>
            {isPending && currentStep && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('approvals.awaitingLevel') || 'Esperando aprobación en'}:{' '}
                <span className="font-medium">{currentStep.level_name}</span>
                {currentStep.role && ` (${currentStep.role.name})`}
              </p>
            )}
            {isApproved && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('approvals.approvedReadyToPublish') || 'Aprobado. Listo para publicar.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Detalle del rechazo */}
      {isRejected && (lastRejection || rejection_reason) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              {lastRejection?.user && (
                <h5 className="mb-1 font-semibold text-red-900 dark:text-red-100">
                  {t('approvals.rejectedBy') || 'Rechazado por'}: {lastRejection.user.name}
                </h5>
              )}
              {lastRejection?.level_number && (
                <p className="mb-2 text-xs text-red-700 dark:text-red-300">
                  {t('approvals.rejectedAtLevel') || 'En nivel'} {lastRejection.level_number}
                </p>
              )}
              {(lastRejection?.comment || rejection_reason) && (
                <div className="rounded-lg bg-white/50 p-3 dark:bg-black/20">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <span className="font-medium">{t('approvals.reason') || 'Razón'}:</span>{' '}
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
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h5 className="mb-4 font-semibold text-gray-900 dark:text-white">
            {t('approvals.workflowProgress') || 'Progreso del flujo'}
          </h5>

          {/* Barra */}
          {totalLevels > 0 && (
            <div className="mb-5">
              <div className="mb-1.5 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{t('approvals.progress') || 'Progreso'}</span>
                <span>
                  {completedLevels} / {totalLevels}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-neutral-700">
                <div
                  className="h-2 rounded-full bg-primary-600 transition-all duration-300"
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
                (l) => l.action === 'approved' && l.level_number === level.level_number,
              );
              const rejectedLog = logs.find(
                (l) => l.action === 'rejected' && l.level_number === level.level_number,
              );
              const isCurrent = isPending && currentStep?.level_number === level.level_number;
              const isDone = !!approvedLog;
              const isRejectedHere = !!rejectedLog;

              return (
                <div key={level.id} className="relative">
                  {index < levels.length - 1 && (
                    <div
                      className={`absolute bottom-0 left-5 top-10 w-0.5 ${
                        isDone
                          ? 'bg-green-500'
                          : isRejectedHere
                            ? 'bg-red-500'
                            : 'bg-gray-200 dark:bg-neutral-700'
                      }`}
                    />
                  )}
                  <div className="flex items-start gap-3">
                    <div
                      className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        isDone
                          ? 'bg-green-500 text-white'
                          : isRejectedHere
                            ? 'bg-red-500 text-white'
                            : isCurrent
                              ? 'animate-pulse bg-primary-500 text-white'
                              : 'bg-gray-200 text-gray-500 dark:bg-neutral-700 dark:text-gray-400'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : isRejectedHere ? (
                        <XCircle className="h-5 w-5" />
                      ) : isCurrent ? (
                        <Clock className="h-5 w-5" />
                      ) : (
                        level.level_number
                      )}
                    </div>

                    <div className="flex-1 pb-4 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {level.level_name}
                        </span>
                        {isCurrent && (
                          <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                            {t('approvals.inProgress') || 'En revisión'}
                          </span>
                        )}
                        {isRejectedHere && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            {t('approvals.rejectedHere') || 'Rechazado aquí'}
                          </span>
                        )}
                      </div>
                      {level.role && (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {t('approvals.approverRole') || 'Rol'}: {level.role.name}
                        </p>
                      )}
                      {/* Quién aprobó/rechazó */}
                      {(approvedLog || rejectedLog) && (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {(approvedLog || rejectedLog)!.user?.name} ·{' '}
                          {new Date((approvedLog || rejectedLog)!.created_at).toLocaleString()}
                          {(approvedLog || rejectedLog)!.comment && (
                            <span className="ml-1 italic">
                              &ldquo;{(approvedLog || rejectedLog)!.comment}&rdquo;
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
