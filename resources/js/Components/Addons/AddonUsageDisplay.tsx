import { formatBytesAsGB, gbToBytes } from '@/Utils/storageHelpers';
import { useTranslation } from 'react-i18next';

interface AddonUsageProps {
  type: string;
  name: string;
  planLimit: number;
  currentUsage: number;
  addonTotal: number;
  addonUsed: number;
  addonRemaining: number;
  unit: string;
}

export default function AddonUsageDisplay({
  type,
  name,
  planLimit,
  currentUsage,
  addonTotal,
  addonUsed,
  addonRemaining,
  unit,
}: AddonUsageProps) {
  const { t } = useTranslation();

  const isStorage = type === 'storage';

  // El backend envía planLimit y currentUsage en bytes, pero los addons en GB. Normalizamos a bytes.
  const normalizedAddonTotal = isStorage ? gbToBytes(addonTotal) : addonTotal;
  const normalizedAddonUsed = isStorage ? gbToBytes(addonUsed) : addonUsed;
  const normalizedAddonRemaining = isStorage ? gbToBytes(addonRemaining) : addonRemaining;

  const isUnlimited = planLimit === -1;
  const isExceedingPlan = !isUnlimited && currentUsage > planLimit;
  const planUsage = isUnlimited ? currentUsage : Math.min(currentUsage, planLimit);
  const excessUsage = isExceedingPlan ? currentUsage - planLimit : 0;

  const formatValue = (value: number) => {
    if (isStorage) {
      return formatBytesAsGB(value);
    }
    return `${value.toLocaleString()} ${unit}`;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{name}</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatValue(currentUsage)} {t('subscription.addons.used', 'usado')}
        </span>
      </div>

      {/* Plan Base Usage */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('subscription.addons.basePlan', 'Plan Base')}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isUnlimited ? t('subscription.addons.unlimited', 'Ilimitado') : formatValue(planLimit)}
          </span>
        </div>

        {!isUnlimited && (
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all duration-300 dark:bg-blue-400"
              style={{
                width: `${Math.min((planUsage / planLimit) * 100, 100)}%`,
              }}
            />
          </div>
        )}

        <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {formatValue(planUsage)} {t('subscription.addons.usedFromPlan', 'usado del plan')}
          </span>
          {!isUnlimited && <span>{((planUsage / planLimit) * 100).toFixed(1)}%</span>}
        </div>
      </div>

      {/* Addon Usage (only if exceeding plan or has addons) */}
      {(normalizedAddonTotal > 0 || isExceedingPlan) && (
        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
              {t('subscription.addons.extensionAddonsTitle', 'Addons de Extensión')}
            </span>
            <span className="text-sm text-orange-600 dark:text-orange-400">
              {formatValue(normalizedAddonTotal)} {t('subscription.addons.available', 'disponible')}
            </span>
          </div>

          {normalizedAddonTotal > 0 && (
            <div className="h-2 w-full rounded-full bg-orange-100 dark:bg-orange-900/30">
              <div
                className="h-2 rounded-full bg-orange-500 transition-all duration-300 dark:bg-orange-400"
                style={{
                  width: `${normalizedAddonTotal > 0 ? (normalizedAddonUsed / normalizedAddonTotal) * 100 : 0}%`,
                }}
              />
            </div>
          )}

          <div className="mt-1 flex justify-between text-xs text-orange-600 dark:text-orange-400">
            <span>
              {formatValue(normalizedAddonUsed)} {t('subscription.addons.usedFromAddons', 'usado de addons')}
            </span>
            <span>
              {formatValue(normalizedAddonRemaining)} {t('subscription.addons.remaining', 'restante')}
            </span>
          </div>

          {/* Explanation */}
          <div className="mt-3 rounded-md bg-orange-50 p-3 dark:bg-orange-900/20">
            <p className="text-xs text-orange-800 dark:text-orange-300">
              {isExceedingPlan ? (
                <>
                  <strong>{t('subscription.addons.usingAddons', 'Usando addons:')}</strong>{' '}
                  {t('subscription.addons.exceededPlanBy', 'Has excedido tu plan base por')}{' '}
                  {formatValue(excessUsage)}.{' '}
                  {t(
                    'subscription.addons.addonsConsumingAutomatically',
                    'Los addons se están consumiendo automáticamente.',
                  )}
                </>
              ) : (
                <>
                  <strong>{t('subscription.addons.addonsAvailable', 'Addons disponibles:')}</strong>{' '}
                  {t(
                    'subscription.addons.addonsWillActivateWhenExceeding',
                    'Tus addons se activarán automáticamente cuando excedas el límite de tu plan base',
                  )}{' '}
                  ({isUnlimited ? t('subscription.addons.unlimited', 'Ilimitado').toLowerCase() : formatValue(planLimit)}).
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Total Usage Summary */}
      <div className="-mx-6 -mb-6 mt-4 rounded-b-lg border-t border-gray-200 bg-gray-50 px-6 pb-6 pt-4 dark:border-gray-700 dark:bg-gray-900/50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('subscription.addons.totalAvailableUsage', 'Uso Total Disponible')}
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {isUnlimited ? t('subscription.addons.unlimited', 'Ilimitado') : formatValue(planLimit + normalizedAddonTotal)}
          </span>
        </div>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t('subscription.addons.planLabel', 'Plan:')}{' '}
          {isUnlimited ? t('subscription.addons.unlimited', 'Ilimitado') : formatValue(planLimit)} +{' '}
          {t('subscription.addons.addonsLabel', 'Addons:')} {formatValue(normalizedAddonTotal)}
        </div>
      </div>
    </div>
  );
}
