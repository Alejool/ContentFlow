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
                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 rounded-full font-semibold">
                    {t('subscription.addons.expired', 'Expirado')}
                </span>
            );
        }
        if (addon.status === 'depleted') {
            return (
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full font-semibold">
                    {t('subscription.addons.depleted', 'Agotado')}
                </span>
            );
        }
        if (addon.percentage > 90) {
            return (
                <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full font-semibold">
                    {t('subscription.addons.lowBalance', 'Bajo')}
                </span>
            );
        }
        return (
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded-full font-semibold">
                {t('subscription.addons.active', 'Activo')}
            </span>
        );
    };

    const Icon = getIcon(addon.type);
    const isLow = addon.percentage > 75;

    return (
        <div
            className={`bg-white dark:bg-gray-800 rounded-xl p-5 border-2 transition-all ${
                isLow
                    ? 'border-orange-300 dark:border-orange-700'
                    : 'border-gray-200 dark:border-gray-700'
            } hover:shadow-md`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-800/50">
                        <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {t(`subscription.addons.packages.${addon.sku}.name`, addon.name)}
                    </span>
                </div>
                {getStatusBadge(addon)}
            </div>

            {/* Cantidad usada */}
            <div className="mb-3">
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {addon.type === 'storage' ? `${addon.used.toFixed(1)} GB` : addon.used.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        / {addon.type === 'storage' ? `${addon.amount} GB` : addon.amount.toLocaleString()}
                    </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {addon.percentage.toFixed(0)}% {t('subscription.addons.used', 'usado')}
                </div>
            </div>

            {/* Barra de progreso */}
            <div className="mb-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all ${getProgressBarColor(addon.percentage)}`}
                        style={{ width: `${Math.min(addon.percentage, 100)}%` }}
                    />
                </div>
            </div>

            {/* Restante */}
            <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">
                    {t('subscription.addons.remaining', 'Restante')}:
                </span>
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                    {addon.type === 'storage' ? `${addon.remaining.toFixed(1)} GB` : addon.remaining.toLocaleString()}
                </span>
            </div>

            {/* Fecha de compra */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    {addon.purchase_count && addon.purchase_count > 1 ? (
                        <>
                            {t('subscription.addons.multiplePurchases', '{{count}} compras', { count: addon.purchase_count })}
                            {' • '}
                            {t('subscription.addons.totalSpent', 'Total')}: ${addon.total_price?.toFixed(2)}
                        </>
                    ) : (
                        <>
                            {t('subscription.addons.purchasedOn', 'Comprado el')}: {new Date(addon.first_purchased_at || addon.purchased_at).toLocaleDateString()}
                            {' • '}
                            ${addon.price?.toFixed(2) || addon.total_price?.toFixed(2)}
                        </>
                    )}
                </div>
                {addon.expires_at && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('subscription.addons.expiresOn', 'Expira el')}: {new Date(addon.expires_at).toLocaleDateString()}
                    </div>
                )}
            </div>
        </div>
    );
}
