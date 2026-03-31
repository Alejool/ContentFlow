import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AddonsInfoBanner() {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100 p-6 dark:border-primary-700/50 dark:from-primary-900/20 dark:to-primary-800/20">
      <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
        {t('subscription.addons.howItWorks', '¿Cómo funcionan los add-ons?')}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-start gap-3">
          <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600 dark:text-primary-400" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t(
              'subscription.addons.howItWorksPoint1',
              'Los add-ons se usan automáticamente cuando excedes el límite de tu plan',
            )}
          </p>
        </div>
        <div className="flex items-start gap-3">
          <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600 dark:text-primary-400" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t(
              'subscription.addons.howItWorksPoint2',
              'Primero se usa el límite de tu plan, luego los add-ons',
            )}
          </p>
        </div>
        <div className="flex items-start gap-3">
          <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600 dark:text-primary-400" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t(
              'subscription.addons.howItWorksPoint3',
              'Los créditos no expiran y se acumulan si compras múltiples paquetes',
            )}
          </p>
        </div>
        <div className="flex items-start gap-3">
          <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600 dark:text-primary-400" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t(
              'subscription.addons.howItWorksPoint4',
              'Puedes solicitar reembolso dentro de los 7 días si no has usado el add-on',
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
