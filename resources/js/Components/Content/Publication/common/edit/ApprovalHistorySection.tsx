import { Avatar } from '@/Components/common/Avatar';
import type { ApprovalLog as ApprovalLogType } from '@/types/ApprovalTypes';
import { formatDateTime } from '@/Utils/formatDate';
import { CheckCircle, Clock, MessageSquare, User, XCircle } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export interface ApprovalLog {
  id: number;
  action: string | null;
  created_at?: string;
  requested_at?: string;
  comment?: string | null;
  approval_step_id?: number | null;
  user?: {
    id: number;
    name: string;
    photo_url?: string;
  };
  approvalStep?: {
    id: number;
    level_name: string;
    level_number: number;
    role?: {
      id: number;
      name: string;
    };
  };
}

export interface UnifiedWorkflowStep {
  id: number;
  name?: string;
  level_name?: string;
  level_number?: number;
  step_order?: number;
  role?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    name: string;
    photo_url?: string;
  };
}

export interface ApprovalHistorySectionProps {
  logs: ApprovalLog[];
  workflow?: {
    id: number;
    name: string;
    steps?: UnifiedWorkflowStep[];
    levels?: UnifiedWorkflowStep[];
  };
  currentStepNumber?: number;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'cancelled';
}

export default function ApprovalHistorySection({
  logs,
  workflow,
  currentStepNumber,
  approvalStatus,
}: ApprovalHistorySectionProps) {
  const { t } = useTranslation();

  // Color helper for logs
  const getStatusIcon = (action: string | null) => {
    switch (action) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-rose-500" />;
      default:
        return <Clock className="h-5 w-5 text-amber-500" />;
    }
  };

  const getStatusStyle = (action: string | null) => {
    switch (action) {
      case 'approved':
        return 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20';
      case 'rejected':
        return 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20';
      default:
        return 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20';
    }
  };

  // Normalizar steps/levels - el backend puede devolver 'levels' o 'steps'
  const workflowSteps = useMemo(() => {
    const rawSteps = workflow?.steps || workflow?.levels || [];
    return rawSteps.map((step) => ({
      ...step,
      name: step.name || step.level_name,
      level_number: step.level_number ?? step.step_order,
    }));
  }, [workflow]);

  // Filtrar solo logs de acciones completadas (approved, rejected)
  const completedLogs = useMemo(
    () => logs.filter((log) => log.action === 'approved' || log.action === 'rejected'),
    [logs],
  );

  // Determinar si hay una solicitud activa
  const hasActiveRequest = approvalStatus === 'pending';

  if (logs.length === 0 && (!workflow || workflowSteps.length === 0)) return null;

  return (
    <div className="space-y-6">
      {/* Workflow Flow Visualization - SOLO mostrar si hay solicitud activa (pending) */}
      {hasActiveRequest && workflow && workflowSteps.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/50">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
              {t('approvals.workflow_status') || 'Estado del Flujo'}
            </h3>
            {workflow.name && (
              <span className="rounded-full border border-primary-100 bg-primary-50 px-2.5 py-1 text-[10px] font-bold text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                {workflow.name}
              </span>
            )}
          </div>

          <div className="relative flex justify-between">
            {/* Line connecting the steps */}
            <div className="absolute left-0 top-[18px] h-0.5 w-full bg-gray-100 dark:bg-neutral-800" />

            {workflowSteps.map((step) => {
              const stepLog = logs.find(
                (log) =>
                  (log.action === 'approved' || log.action === 'submitted') &&
                  log.approval_step_id === step.id,
              );
              const isCompleted = !!stepLog;

              // Verificar si es el nivel actual
              const stepIdentifier = step.level_number;
              const isCurrent =
                currentStepNumber !== undefined &&
                stepIdentifier === currentStepNumber &&
                !isCompleted;

              // Un nivel está en el pasado si está completado O si su número es menor al actual
              const isPast =
                isCompleted ||
                (currentStepNumber !== undefined &&
                  stepIdentifier !== undefined &&
                  stepIdentifier < currentStepNumber);

              return (
                <div
                  key={step.id}
                  className="relative z-10 flex flex-col items-center"
                  style={{ width: `${100 / workflowSteps.length}%` }}
                >
                  {/* Step Number/Status Icon or User Avatar */}
                  <div className="mb-2">
                    {step.user ? (
                      <div className="relative">
                        <Avatar src={step.user.photo_url ?? null} name={step.user.name} size="md" />
                        {(isPast || isCompleted) && (
                          <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-green-500 dark:border-neutral-800">
                            <span className="text-[10px] font-bold text-white">✓</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                          isCurrent
                            ? 'scale-110 border-primary-500 bg-primary-500 text-white shadow-[0_0_15px_rgba(var(--color-primary-500),0.4)]'
                            : isPast || isCompleted
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-gray-200 bg-white text-gray-400 dark:border-neutral-700 dark:bg-neutral-800'
                        }`}
                      >
                        {isCurrent ? (
                          <Clock className="h-5 w-5 animate-pulse" />
                        ) : isPast || isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <span className="text-xs font-bold">{stepIdentifier}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="text-center">
                    <div className="line-clamp-1 text-[11px] font-bold text-gray-900 dark:text-white">
                      {step.name}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                      {step.user ? (
                        <span className="max-w-[80px] truncate">{step.user.name}</span>
                      ) : (
                        <span className="max-w-[80px] truncate">
                          {step.role?.name || t('approvals.no_role_assigned') || 'Sin rol'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="mt-1 flex flex-col items-center gap-1">
                    {isCurrent && (
                      <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {t('approvals.in_progress') || 'En Proceso'}
                      </span>
                    )}
                    {stepLog?.action === 'approved' && (
                      <span className="text-[9px] font-bold text-green-600 dark:text-green-400">
                        {t('common.approved') || 'Aprobado'}
                      </span>
                    )}
                    {stepLog?.action === 'rejected' && (
                      <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400">
                        {t('common.rejected') || 'Rechazado'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Approval History - Solo mostrar si hay logs completados */}
      {completedLogs.length > 0 && (
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
            <Clock className="h-4 w-4 text-primary-500" />
            {t('approvals.historyTitle') || 'Historial de Aprobación'}
          </h4>

          <div className="space-y-3">
            {completedLogs.map((log) => (
              <div
                key={log.id}
                className={`rounded-lg border p-4 transition-all ${getStatusStyle(log.action)}`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">{getStatusIcon(log.action)}</div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {log.action === 'approved'
                            ? t('approvals.status.approved') || 'Aprobado'
                            : log.action === 'rejected'
                              ? t('approvals.status.rejected') || 'Rechazado'
                              : t('approvals.status.pending') || 'Pendiente'}
                        </span>
                        {log.approvalStep && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {t('approvals.step') || 'Nivel'} {log.approvalStep.level_number}:{' '}
                            {log.approvalStep.level_name}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[10px] font-bold text-gray-900 dark:text-gray-100 sm:text-xs">
                          {formatDateTime(log.created_at || log.requested_at || '')}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                      {log.user && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 opacity-70" />
                          <span>
                            {log.action === 'approved'
                              ? t('approvals.approvedBy') || 'Aprobado por'
                              : t('approvals.rejectedBy') || 'Rechazado por'}
                            :
                          </span>
                          <span className="font-bold text-gray-700 dark:text-gray-300">
                            {log.user.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {log.action === 'rejected' && log.comment && (
                      <div className="mt-2 rounded border border-rose-200 bg-white/50 p-2 dark:border-rose-900/30 dark:bg-neutral-800/50">
                        <div className="mb-1 flex items-center gap-2">
                          <MessageSquare className="h-3 w-3 text-rose-500" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                            {t('approvals.rejectionReason') || 'Motivo'}
                          </span>
                        </div>
                        <p className="text-xs italic text-gray-700 dark:text-gray-300">
                          "{log.comment}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
