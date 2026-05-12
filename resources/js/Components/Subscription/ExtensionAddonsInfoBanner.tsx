import { ArrowRightLeft, Clock, Layers, Shield, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ExtensionAddonsInfoBanner() {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 p-6 dark:border-blue-700/50 dark:from-blue-900/20 dark:to-indigo-800/20">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
        <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        {t('subscription.addons.extensionAddons.title', 'Cómo funcionan los Addons de Extensión')}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {t('subscription.addons.extensionAddons.planIndependent', 'Independientes del plan')}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t(
                'subscription.addons.extensionAddons.planIndependentDesc',
                'Tus addons se mantienen al cambiar de plan',
              )}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {t(
                'subscription.addons.extensionAddons.onlyWhenNeeded',
                'Solo se usan cuando es necesario',
              )}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t(
                'subscription.addons.extensionAddons.onlyWhenNeededDesc',
                'Se activan automáticamente al exceder tu plan base',
              )}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <ArrowRightLeft className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {t(
                'subscription.addons.extensionAddons.fifo',
                'FIFO (Primero en entrar, primero en salir)',
              )}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('subscription.addons.extensionAddons.fifoDesc', 'Se consumen en orden de compra')}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {t('subscription.addons.extensionAddons.noExpiration', 'Sin expiración')}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t(
                'subscription.addons.extensionAddons.noExpirationDesc',
                'Los addons de extensión no caducan',
              )}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 md:col-span-2 lg:col-span-1">
          <Layers className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {t('subscription.addons.extensionAddons.trackingPerPlan', 'Trazabilidad por plan')}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t(
                'subscription.addons.extensionAddons.trackingPerPlanDesc',
                'El uso se resetea con cada cambio de plan',
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
