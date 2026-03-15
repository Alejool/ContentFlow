import { LucideIcon } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Zap } from 'lucide-react';

interface UsageCardProps {
  label: string;
  icon: LucideIcon;
  percentage: number;
  used: number | string;
  limit: number | string;
  total_available?: number | string;
  remaining: number | string;
  addon_info?: {
    total: number;
    remaining: number;
  };
  canBuy: boolean;
  addonType?: string;
  upgradeUrl?: string;
}

export function UsageCard({
  label,
  icon: Icon,
  percentage,
  used,
  limit,
  total_available,
  remaining,
  addon_info,
  canBuy,
  addonType,
  upgradeUrl,
}: UsageCardProps) {
  const { t } = useTranslation();

  const isCritical = percentage > 90;
  const isHigh = percentage > 80 && percentage <= 90;
  const isWarning = percentage > 70 && percentage <= 80;
  const shouldShowBuyButton = canBuy && percentage > 70;
  const shouldShowUpgradeButton = !canBuy && percentage > 70;

  const getProgressBarColor = (percentage: number) => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 80) return 'bg-orange-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-primary-500';
  };

  const getBadgeColor = (percentage: number) => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 80) return 'bg-orange-500';
    if (percentage > 70) return 'bg-yellow-500';
    return '';
  };

  const getBadgeText = (percentage: number) => {
    if (percentage > 90) return t('subscription.addons.critical', '¡Crítico!');
    if (percentage > 80) return t('subscription.addons.high', 'Muy Alto');
    if (percentage > 70) return t('subscription.addons.warning', 'Alto');
    return '';
  };

  const isUnlimited = limit === '∞' || limit === -1;

  return (
    <div className="h-full rounded-lg bg-gradient-to-br from-primary-50/10 to-primary-50 p-4 shadow-sm transition-all hover:shadow-md dark:from-primary-200/10 dark:to-primary-600/20">
      <div className="relative mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2">
            <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{label}</span>
        </div>
        {(isCritical || isHigh || isWarning) && (
          <span
            className={`absolute -right-5 -top-5 rounded-full px-2 py-1 text-xs font-semibold text-white ${getBadgeColor(percentage)}`}
          >
            {getBadgeText(percentage)}
          </span>
        )}
      </div>

      <div className="mb-2">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {isUnlimited ? used : `${Math.round(percentage)}%`}
        </div>
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          {isUnlimited
            ? t('subscription.usage.unlimited', 'Ilimitado')
            : `${used} / ${total_available || limit}`}
        </div>
        {addon_info && addon_info.total > 0 && (
          <div className="mt-1 text-xs text-primary-600 dark:text-primary-400">
            <span className="font-medium">Plan:</span> {limit} +
            <span className="font-medium"> Addons:</span> {addon_info.remaining}/{addon_info.total}
          </div>
        )}
      </div>

      {!isUnlimited && (
        <div className="mb-3">
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-2 rounded-full transition-all ${getProgressBarColor(percentage)}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="mb-3 text-xs text-gray-600 dark:text-gray-400">
        {isUnlimited ? (
          t('subscription.addons.noLimits', 'Sin límites')
        ) : (
          <>
            <span className="font-semibold text-primary-600 dark:text-primary-400">
              {remaining}
            </span>{' '}
            {t('subscription.addons.remaining', 'restantes')}
          </>
        )}
      </div>

      {shouldShowBuyButton && (
        <Link
          href={`/subscription/addons?tab=${addonType}`}
          className="block w-full rounded-lg bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
        >
          <Sparkles className="mr-1 inline h-3 w-3" />
          {t('subscription.addons.buyMore', 'Comprar Más')}
        </Link>
      )}

      {shouldShowUpgradeButton && (
        <Link
          href={upgradeUrl || '/pricing'}
          className="block w-full rounded-lg bg-gray-600 px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600"
        >
          <Zap className="mr-1 inline h-3 w-3" />
          {t('subscription.addons.upgradePlan', 'Actualizar Plan')}
        </Link>
      )}
    </div>
  );
}
