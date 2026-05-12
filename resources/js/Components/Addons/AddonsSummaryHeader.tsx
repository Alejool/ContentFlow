import { useTranslation } from 'react-i18next';

interface AddonsSummaryHeaderProps {
  currentPlan: string;
  planStartedAt: string | undefined;
  formatDate: (date?: string) => string;
}

export default function AddonsSummaryHeader({
  currentPlan,
  planStartedAt,
  formatDate,
}: AddonsSummaryHeaderProps) {
  const { t } = useTranslation();

  const formattedDate = formatDate(planStartedAt);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
      <h2 className="mb-2 text-lg font-semibold text-blue-900 dark:text-blue-100">
        {t('subscription.billing.currentPlan')}:{' '}
        {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
      </h2>
      <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
        <p>
          <strong>{t('subscription.addons.newTrackingSystem.startDate')}:</strong>{' '}
          {formattedDate}
        </p>
        <p>
          {t('subscription.addons.newTrackingSystem.startDateDesc', {
            date: formattedDate,
          })}
        </p>
        <p className="mt-2">
          {t('subscription.addons.howItWorksPoint1')}
        </p>
      </div>
    </div>
  );
}
