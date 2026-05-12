import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AddonTrackingInfoProps {
  planStartedAt: string | undefined;
  formatDate: (date?: string) => string;
}

export default function AddonTrackingInfo({ planStartedAt, formatDate }: AddonTrackingInfoProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
      <div className="mb-2 flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-800 dark:text-green-400" />
        <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">
          {t('subscription.addons.newTrackingSystem.title')}
        </h3>
      </div>
      <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
        <li>
          • <strong>{t('subscription.addons.newTrackingSystem.independentUsage')}:</strong>{' '}
          {t('subscription.addons.newTrackingSystem.independentUsageDesc')}
        </li>
        <li>
          • <strong>{t('subscription.addons.newTrackingSystem.startDate')}:</strong>{' '}
          {t('subscription.addons.newTrackingSystem.startDateDesc', {
            date: formatDate(planStartedAt),
          })}
        </li>
        <li>
          • <strong>{t('subscription.addons.newTrackingSystem.addonsIntact')}:</strong>{' '}
          {t('subscription.addons.newTrackingSystem.addonsIntactDesc')}
        </li>
        <li>
          • <strong>{t('subscription.addons.newTrackingSystem.smartConsumption')}:</strong>{' '}
          {t('subscription.addons.newTrackingSystem.smartConsumptionDesc')}
        </li>
      </ul>
    </div>
  );
}
