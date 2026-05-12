import { Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AddonsSummaryEmpty() {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg bg-gray-50 py-12 text-center dark:bg-gray-800/50">
      <div className="mb-4 text-gray-400 dark:text-gray-500">
        <Package className="mx-auto h-12 w-12" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
        {t('subscription.addons.noPurchases')}
      </h3>
      <p className="mb-4 text-gray-500 dark:text-gray-400">
        {t('subscription.addons.extensionAddons.onlyWhenNeededDesc')}
      </p>
      <button className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
        {t('subscription.addons.buyCredits')}
      </button>
    </div>
  );
}
