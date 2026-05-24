import { Link } from '@inertiajs/react';
import { Sparkles, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UsageCardProps } from '@/Components/Subscription/planUsage.types';

// ── Accent colour maps ────────────────────────────────────────────
const ACCENT_ICON: Record<string, string> = {
  primary: 'text-primary-500 dark:text-primary-400',
  violet: 'text-violet-500 dark:text-violet-400',
  amber: 'text-amber-500 dark:text-amber-400',
  teal: 'text-teal-500 dark:text-teal-400',
  pink: 'text-pink-500 dark:text-pink-400',
};

const ACCENT_ICON_BG: Record<string, string> = {
  primary: 'bg-primary-50 dark:bg-primary-500/10',
  violet: 'bg-violet-50 dark:bg-violet-500/10',
  amber: 'bg-amber-50 dark:bg-amber-500/10',
  teal: 'bg-teal-50 dark:bg-teal-500/10',
  pink: 'bg-pink-50 dark:bg-pink-500/10',
};

const ACCENT_BAR_OK: Record<string, string> = {
  primary: 'bg-primary-500',
  violet: 'bg-violet-500',
  amber: 'bg-amber-400',
  teal: 'bg-teal-500',
  pink: 'bg-pink-500',
};

const ACCENT_TEXT: Record<string, string> = {
  primary: 'text-primary-600 dark:text-primary-400',
  violet: 'text-violet-600 dark:text-violet-400',
  amber: 'text-amber-600 dark:text-amber-400',
  teal: 'text-teal-600 dark:text-teal-400',
  pink: 'text-pink-600 dark:text-pink-400',
};

// ── Status helpers ────────────────────────────────────────────────
const getBarColor = (pct: number, accentBar: string) => {
  if (pct > 90) return 'bg-red-500';
  if (pct > 80) return 'bg-orange-500';
  if (pct > 70) return 'bg-yellow-500';
  return accentBar;
};

const getStatusBadge = (
  pct: number,
): { label: string; className: string } | null => {
  if (pct > 90)
    return {
      label: '¡Crítico!',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
  if (pct > 80)
    return {
      label: 'Muy Alto',
      className:
        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    };
  if (pct > 70)
    return {
      label: 'Alto',
      className:
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
  return null;
};

// ── Component ─────────────────────────────────────────────────────
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
  accent = 'primary',
}: UsageCardProps) {
  const { t } = useTranslation();

  const isUnlimited = limit === '∞' || limit === -1;
  const shouldShowBuyButton = canBuy && percentage > 70;
  const shouldShowUpgradeButton = !canBuy && percentage > 70;
  const statusBadge = getStatusBadge(percentage);
  const barColor = getBarColor(percentage, ACCENT_BAR_OK[accent]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-theme-bg-secondary">
      {/* Top accent strip */}
      <div className={`h-1 w-full ${ACCENT_BAR_OK[accent]}`} />

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Header: icon + label + badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${ACCENT_ICON_BG[accent]}`}
            >
              <Icon className={`h-5 w-5 ${ACCENT_ICON[accent]}`} />
            </div>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {label}
            </span>
          </div>

          {statusBadge && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>
          )}
        </div>

        {/* Main value */}
        <div>
          <div className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {isUnlimited ? used : `${Math.round(percentage)}%`}
          </div>
          <div className="mt-0.5 text-xs text-gray-500 dark:text-neutral-400">
            {isUnlimited
              ? t('subscription.usage.unlimited')
              : `${used} / ${total_available ?? limit}`}
          </div>
          {addon_info && addon_info.total > 0 && (
            <div className={`mt-1 text-xs ${ACCENT_TEXT[accent]}`}>
              <span className="font-medium">Plan:</span> {limit}{' '}
              <span className="font-medium">+ Addons:</span> {addon_info.remaining}/
              {addon_info.total}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {!isUnlimited && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        )}

        {/* Remaining label */}
        <p className="text-xs text-gray-500 dark:text-neutral-400">
          {isUnlimited ? (
            t('subscription.addons.noLimits')
          ) : (
            <>
              <span className={`font-semibold ${ACCENT_TEXT[accent]}`}>
                {remaining}
              </span>{' '}
              {t('subscription.addons.remaining')}
            </>
          )}
        </p>

        {/* CTA buttons — pushed to bottom */}
        {(shouldShowBuyButton || shouldShowUpgradeButton) && (
          <div className="mt-auto pt-1">
            {shouldShowBuyButton && (
              <Link
                href={`/subscription/addons?tab=${addonType}`}
                className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 ${ACCENT_BAR_OK[accent]}`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {t('subscription.addons.buyMore')}
              </Link>
            )}
            {shouldShowUpgradeButton && (
              <Link
                href={upgradeUrl ?? '/pricing'}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-700 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 dark:bg-neutral-700"
              >
                <Zap className="h-3.5 w-3.5" />
                {t('subscription.addons.upgradePlan')}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
