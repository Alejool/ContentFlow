import { Calendar, RefreshCw, Shield, Zap } from 'lucide-react';
import { formatDateString } from '@/Utils/formatters';
import { useTranslation } from 'react-i18next';

interface PlanTrackingInfoBannerProps {
  startDate?: string;
}

export function PlanTrackingInfoBanner({ startDate }: PlanTrackingInfoBannerProps) {
  const { t } = useTranslation();

  const formattedDate = startDate ? formatDateString(startDate) : formatDateString(new Date());

  return (
    <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-emerald-100 p-6 dark:border-green-700/50 dark:from-green-900/20 dark:to-emerald-800/20">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
        <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
        {t('subscription.addons.newTrackingSystem.title', 'Nuevo Sistema de Trazabilidad por Plan')}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-start gap-3">
          <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {t(
                'subscription.addons.newTrackingSystem.independentUsage',
                'Uso independiente por plan',
              )}
            </p>
            <p className="text-sm text-gray-700 dark:text-neutral-300">
              {t(
                'subscription.addons.newTrackingSystem.independentUsageDesc',
                'Cada plan empieza desde 0',
              )}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {t('subscription.addons.newTrackingSystem.startDate', 'Fecha de inicio')}
            </p>
            <p className="text-sm text-gray-700 dark:text-neutral-300">
              {t(
                'subscription.addons.newTrackingSystem.startDateDesc',
                'El uso se cuenta desde {date}',
                {
                  date: formattedDate,
                },
              )}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {t('subscription.addons.newTrackingSystem.addonsIntact', 'Addons intactos')}
            </p>
            <p className="text-sm text-gray-700 dark:text-neutral-300">
              {t(
                'subscription.addons.newTrackingSystem.addonsIntactDesc',
                'Tus addons se mantienen al cambiar de plan',
              )}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Zap className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {t('subscription.addons.newTrackingSystem.smartConsumption', 'Consumo inteligente')}
            </p>
            <p className="text-sm text-gray-700 dark:text-neutral-300">
              {t(
                'subscription.addons.newTrackingSystem.smartConsumptionDesc',
                'Solo se usan cuando excedes tu plan base',
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
