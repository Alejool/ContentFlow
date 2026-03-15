import Button from '@/Components/common/Modern/Button';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ApprovalUpgradeBannerProps {
  currentPlan?: string;
  className?: string;
}

/**
 * Banner reutilizable para mostrar mensaje de upgrade de aprobaciones básicas a avanzadas.
 * Se muestra cuando el plan actual es 'basic' (Professional) y el usuario intenta acceder
 * a características de multinivel que solo están disponibles en Enterprise.
 */
export default function ApprovalUpgradeBanner({
  currentPlan = 'professional',
  className = '',
}: ApprovalUpgradeBannerProps) {
  const { t } = useTranslation();

  // @ts-ignore
  const route = window.route;

  return (
    <div
      className={`animate-in fade-in slide-in-from-top-2 flex flex-col items-start justify-between gap-4 rounded-xl border border-primary-200 bg-primary-50 p-4 shadow-sm duration-500 dark:border-primary-800 dark:bg-primary-900/20 sm:flex-row sm:items-center ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-full bg-primary-100 p-2 dark:bg-primary-900/40">
          <Shield className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-primary-900 dark:text-primary-300">
            {t('common.approvals.basic_enabled.title')}
          </p>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-primary-700 dark:text-primary-400">
            {t('common.approvals.basic_enabled.description')}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="primary"
        buttonStyle="solid"
        onClick={() => (window.location.href = route('pricing'))}
        className="shrink-0 whitespace-nowrap shadow-md shadow-primary-500/20"
      >
        {t('common.upgrade_plan') || 'Upgrade Plan'}
      </Button>
    </div>
  );
}
