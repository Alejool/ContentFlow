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
    <div className="bg-gradient-to-br from-primary-50/10 to-primary-50 dark:from-primary-200/10 dark:to-primary-600/20 rounded-lg p-4   shadow-sm hover:shadow-md transition-all h-full">
      <div className="flex items-center justify-between mb-3 relative">
        <div className="flex items-center gap-2">
          <div className="p-2">
            <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {label}
          </span>
        </div>
        {(isCritical || isHigh || isWarning) && (
          <span
            className={`absolute text-xs text-white px-2 py-1 -right-5 -top-5 rounded-full font-semibold ${getBadgeColor(percentage)}`}
          >
            {getBadgeText(percentage)}
          </span>
        )}
      </div>

      <div className="mb-2">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {isUnlimited ? used : `${Math.round(percentage)}%`}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {isUnlimited
            ? t('subscription.usage.unlimited', 'Ilimitado')
            : `${used} / ${total_available || limit}`}
        </div>
        {addon_info && addon_info.total > 0 && (
          <div className="text-xs text-primary-600 dark:text-primary-400 mt-1">
            <span className="font-medium">Plan:</span> {limit} +
            <span className="font-medium"> Addons:</span>{' '}
            {addon_info.remaining}/{addon_info.total}
          </div>
        )}
      </div>

      {!isUnlimited && (
        <div className="mb-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressBarColor(percentage)}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
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
          className="block w-full text-center bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors"
        >
          <Sparkles className="w-3 h-3 inline mr-1" />
          {t('subscription.addons.buyMore', 'Comprar Más')}
        </Link>
      )}

      {shouldShowUpgradeButton && (
        <Link
          href={upgradeUrl || '/pricing'}
          className="block w-full text-center bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors"
        >
          <Zap className="w-3 h-3 inline mr-1" />
          {t('subscription.addons.upgradePlan', 'Actualizar Plan')}
        </Link>
      )}
    </div>
  );
}
