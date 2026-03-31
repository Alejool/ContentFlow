import { Sparkles, HardDrive, FileText, Users, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ActiveAddon } from '@/Hooks/useActiveAddons';

interface AddonCardProps {
  addon: ActiveAddon;
}

export function AddonCard({ addon }: AddonCardProps) {
  const { t } = useTranslation();

  const getIcon = (type: ActiveAddon['type']) => {
    switch (type) {
      case 'ai_credits':
        return Sparkles;
      case 'storage':
        return HardDrive;
      case 'publications':
        return FileText;
      case 'team_members':
        return Users;
      default:
        return Package;
    }
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 75) return 'bg-orange-500';
    if (percentage > 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusBadge = (addon: ActiveAddon) => {
    if (addon.status === 'expired') {
      return (
        <span className="absolute -right-5 -top-5 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {t('subscription.addons.expired', 'Expirado')}
        </span>
      );
    }
    if (addon.status === 'depleted') {
      return (
        <span className="absolute -right-5 -top-5 rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          {t('subscription.addons.depleted', 'Agotado')}
        </span>
      );
    }
    if (addon.percentage > 90) {
      return (
        <span className="absolute -right-5 -top-5 rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">
          {t('subscription.addons.lowBalance', 'Bajo')}
        </span>
      );
    }
    return (
      <span className="absolute -right-5 -top-5 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-200">
        {t('subscription.addons.active', 'Activo')}
      </span>
    );
  };

  const Icon = getIcon(addon.type);
  const isLow = addon.percentage > 75;

  return (
    <div
      className={`rounded-xl border-2 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-gray-800 ${
        isLow
          ? 'border-orange-300 bg-orange-50/30 dark:border-orange-700 dark:bg-orange-900/10'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Header */}
      <div className="relative mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-800/50">
            <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {t(`subscription.addons.packages.${addon.sku}.name`, addon.name)}
          </span>
        </div>
        {getStatusBadge(addon)}
      </div>

      {/* Uso actual - Más prominente */}
      <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
            {t('subscription.addons.currentUsage', 'Uso Actual')}
          </span>
          <span
            className={`rounded-full px-2 py-1 text-xs font-bold ${
              addon.percentage > 90
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                : addon.percentage > 75
                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
            }`}
          >
            {addon.percentage.toFixed(0)}%
          </span>
        </div>

        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {addon.type === 'storage' ? `${addon.used.toFixed(1)} GB` : addon.used.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            / {addon.type === 'storage' ? `${addon.amount} GB` : addon.amount.toLocaleString()}
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="mb-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-600">
          <div
            className={`h-2 rounded-full transition-all ${getProgressBarColor(addon.percentage)}`}
            style={{ width: `${Math.min(addon.percentage, 100)}%` }}
          />
        </div>

        <div className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium">{t('subscription.addons.remaining', 'Restante')}: </span>
          <span className="font-semibold text-primary-600 dark:text-primary-400">
            {addon.type === 'storage'
              ? `${addon.remaining.toFixed(1)} GB`
              : addon.remaining.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Información de compra */}
      <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {addon.purchase_count && addon.purchase_count > 1 ? (
            <>
              {t('subscription.addons.multiplePurchases', '{{count}} compras', {
                count: addon.purchase_count,
              })}
              {' • '}
              <span className="font-semibold">${addon.total_price?.toFixed(2)}</span>
            </>
          ) : (
            <>
              {t('subscription.addons.purchasedOn', 'Comprado el')}:{' '}
              {addon.first_purchased_at
                ? new Date(addon.first_purchased_at).toLocaleDateString()
                : 'N/A'}
              {' • '}
              <span className="font-semibold">
                ${addon.price?.toFixed(2) || addon.total_price?.toFixed(2)}
              </span>
            </>
          )}
        </div>
        {addon.expires_at && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('subscription.addons.expiresOn', 'Expira el')}:{' '}
            {new Date(addon.expires_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}
