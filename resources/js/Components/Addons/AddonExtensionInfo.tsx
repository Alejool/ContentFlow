import { ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AddonExtensionInfo() {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
      <div className="mb-2 flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-yellow-800 dark:text-yellow-400" />
        <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
          {t('subscription.addons.extensionAddons.title')}
        </h3>
      </div>
      <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
        <li>
          • <strong>{t('subscription.addons.extensionAddons.planIndependent')}:</strong>{' '}
          {t('subscription.addons.extensionAddons.planIndependentDesc')}
        </li>
        <li>
          • <strong>{t('subscription.addons.extensionAddons.onlyWhenNeeded')}:</strong>{' '}
          {t('subscription.addons.extensionAddons.onlyWhenNeededDesc')}
        </li>
        <li>
          • <strong>{t('subscription.addons.extensionAddons.fifo')}:</strong>{' '}
          {t('subscription.addons.extensionAddons.fifoDesc')}
        </li>
        <li>
          • <strong>{t('subscription.addons.extensionAddons.noExpiration')}:</strong>{' '}
          {t('subscription.addons.extensionAddons.noExpirationDesc')}
        </li>
        <li>
          • <strong>{t('subscription.addons.extensionAddons.trackingPerPlan')}:</strong>{' '}
          {t('subscription.addons.extensionAddons.trackingPerPlanDesc')}
        </li>
      </ul>
    </div>
  );
}
