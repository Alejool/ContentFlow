import ApprovalHistorySection from '@/Components/Content/Publication/common/edit/ApprovalHistorySection';
import { Check, CheckCircle2, ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ApprovalsTabProps {
  item: any;
}

export default function ApprovalsTab({ item }: ApprovalsTabProps) {
  const { t } = useTranslation();

  return (
    <div className="max-h-[500px] space-y-6 overflow-y-auto pr-2">
      {/* Current Workflow Progress */}
      {item.status === 'pending_review' && item.currentApprovalStep?.workflow && (
        <div className="rounded-lg border border-primary-200 bg-gradient-to-br from-primary-50 to-blue-50 p-4 dark:border-primary-800 dark:from-primary-900/20 dark:to-blue-900/20">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary-900 dark:text-primary-300">
            <ClipboardList className="h-4 w-4" />
            {t('approvals.workflow_progress') || 'Progreso del Flujo Actual'}
          </h4>
          <div className="space-y-2">
            {item.currentApprovalStep.workflow.steps?.map((step: any, index: number) => {
              const isCurrent = step.id === item.currentApprovalStep?.id;
              const isPast =
                step.level_number < (item.currentApprovalStep?.level_number || 0);

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 rounded-lg p-3 transition-all ${
                    isCurrent
                      ? 'border-2 border-primary-400 bg-primary-100 shadow-sm dark:border-primary-600 dark:bg-primary-900/40'
                      : isPast
                        ? 'border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : 'border border-gray-200 bg-white/50 dark:border-neutral-700 dark:bg-neutral-800/50'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      isCurrent
                        ? 'bg-primary-500 text-white ring-2 ring-primary-300 dark:ring-primary-700'
                        : isPast
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {isPast ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {step.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {step.role?.name || 'Sin rol asignado'}
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="rounded-full bg-primary-200 px-2 py-1 text-xs font-bold text-primary-600 dark:bg-primary-800 dark:text-primary-400">
                      {t('approvals.in_progress') || 'En Proceso'}
                    </span>
                  )}
                  {isPast && (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400">
                      <Check className="h-3 w-3" />
                      {t('common.completed') || 'Completado'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Workflow Completed */}
      {item.status === 'approved' && item.currentApprovalStep?.workflow && (
        <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 dark:border-green-800 dark:from-green-900/20 dark:to-emerald-900/20">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-green-900 dark:text-green-300">
                {t('approvals.approved_ready_to_publish') ||
                  '¡Flujo Completado y Aprobado!'}
              </h4>
              <p className="text-xs text-green-700 dark:text-green-400">
                {t('approvals.next_action.ready_to_publish') ||
                  'La publicación ha sido aprobada y está lista para publicarse'}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {item.currentApprovalStep.workflow.steps?.map((step: any) => (
              <div
                key={step.id}
                className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-2 dark:border-green-800 dark:bg-green-900/20"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                  <Check className="h-3 w-3" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-900 dark:text-white">
                    {step.name}
                  </div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    {step.role?.name || 'Sin rol asignado'}
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400">
                  <Check className="h-3 w-3" />
                  {t('common.completed') || 'Completado'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approval History */}
      {item.approval_logs && item.approval_logs.length > 0 && (
        <div>
          <ApprovalHistorySection
            logs={item.approval_logs || []}
            workflow={
              item.approval_request?.workflow || item.currentApprovalStep?.workflow
            }
            currentStepNumber={
              item.approval_request?.current_step?.level_number ||
              item.currentApprovalStep?.level_number
            }
            approvalStatus={item.approval_request?.status}
          />
        </div>
      )}

      {/* No approvals */}
      {!item.approval_logs?.length &&
        item.status !== 'pending_review' &&
        item.status !== 'approved' && (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            <p>{t('approvals.noHistory') || 'No hay historial de aprobaciones'}</p>
          </div>
        )}
    </div>
  );
}
