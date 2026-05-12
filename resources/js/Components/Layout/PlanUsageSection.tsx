import { formatBytes, formatStorageUsage } from '@/Utils/formatters';
import { Link } from '@inertiajs/react';
import { ChevronDown, FileText, HardDrive, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AddonInfo {
  total: number;
  used: number;
  remaining: number;
}

interface UsageData {
  plan: string;
  publications: {
    used: number;
    limit: number;
    total_available: number;
    remaining: number;
    percentage: number;
    limit_reached: boolean;
    addon_info?: AddonInfo;
  };
  storage: {
    used_bytes: number;
    used_mb: number;
    used_gb: number;
    limit_bytes: number;
    limit_gb: number;
    total_available_bytes: number;
    total_available_gb: number;
    remaining_bytes: number;
    percentage: number;
    limit_reached: boolean;
    addon_info?: AddonInfo;
  };
  limits_reached: boolean;
}

interface PlanUsageSectionProps {
  usage: UsageData | null;
  usageLoading: boolean;
  isOwner: boolean;
}

export default function PlanUsageSection({ usage, usageLoading, isOwner }: PlanUsageSectionProps) {
  const { t } = useTranslation();

  const getPlanDisplayName = (planName: string) => {
    const planNames: Record<string, string> = {
      free: t('pricing.plans.free.name') || 'Free',
      starter: t('pricing.plans.starter.name') || 'Starter',
      growth: t('pricing.plans.growth.name') || 'Growth',
      professional: t('pricing.plans.professional.name') || 'Professional',
      enterprise: t('pricing.plans.enterprise.name') || 'Enterprise',
    };
    return planNames[planName] || planName;
  };

  if (!usage || usageLoading) {
    return null;
  }

  return (
    <div className="px-4 pb-3">
      <div className="rounded-lg border border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100/50 p-3 dark:border-primary-800/30 dark:from-primary-900/20 dark:to-primary-800/10">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-bold text-primary-900 dark:text-primary-100">
              {getPlanDisplayName(usage.plan)}
            </span>
          </div>
          {isOwner && (
            <Link
              href={route('pricing')}
              className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t('subscription.usage.upgradePlan') || 'Actualizar'}
            </Link>
          )}
        </div>

        <div className="space-y-2">
          {/* Publications */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                <FileText className="h-3 w-3" />
                <span>{t('subscription.usage.publications') || 'Publicaciones'}</span>
              </div>
              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                {usage.publications.limit === -1
                  ? `${usage.publications.used} / ∞`
                  : `${usage.publications.used} / ${usage.publications.total_available}`}
              </span>
            </div>
            {usage.publications.limit !== -1 && (
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full rounded-full transition-all ${
                    usage.publications.percentage >= 90
                      ? 'bg-red-500'
                      : usage.publications.percentage >= 70
                        ? 'bg-yellow-500'
                        : 'bg-primary-500'
                  }`}
                  style={{
                    width: `${Math.min(usage.publications.percentage, 100)}%`,
                  }}
                />
              </div>
            )}
            {usage.publications.addon_info && usage.publications.addon_info.total > 0 && (
              <div className="mt-1 text-xs text-primary-600 dark:text-primary-400">
                <span className="font-medium">Plan:</span> {usage.publications.limit} +{' '}
                <span className="font-medium">Addons:</span>{' '}
                {usage.publications.addon_info.remaining}/{usage.publications.addon_info.total}
              </div>
            )}
          </div>

          {/* Storage */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                <HardDrive className="h-3 w-3" />
                <span>{t('subscription.usage.storage') || 'Almacenamiento'}</span>
              </div>
              <span className="text-[10px] font-semibold text-gray-900 dark:text-white">
                {usage.storage.limit_gb === -1
                  ? `${formatBytes(usage.storage.used_bytes)} / ∞`
                  : formatStorageUsage(usage.storage.used_bytes, usage.storage.total_available_bytes)}
              </span>
            </div>
            <div className='text-[10px]'>
              {usage.storage.limit_gb !== -1 && (
                <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usage.storage.percentage >= 90
                        ? 'bg-red-500'
                        : usage.storage.percentage >= 70
                          ? 'bg-yellow-500'
                          : 'bg-primary-500'
                    }`}
                    style={{
                      width: `${Math.min(usage.storage.percentage, 100)}%`,
                    }}
                  />
                </div>
              )}
              {usage.storage.addon_info && usage.storage.addon_info.total > 0 && (
                <div className="mt-1 text-xs text-primary-600 dark:text-primary-400">
                  <span className="font-medium">Plan:</span> {usage.storage.limit_gb} GB +{' '}
                  <span className="font-medium">Addons:</span> {usage.storage.addon_info.remaining}/
                  {usage.storage.addon_info.total} GB
                </div>
              )}
            </div>
          </div>
        </div>

        {usage.limits_reached && (
          <div className="mt-2 border-t border-primary-200 pt-2 dark:border-primary-800/30">
            <Link
              href={route('subscription.addons')}
              className="group flex items-center justify-between gap-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-3 py-2 text-white transition-all hover:from-primary-600 hover:to-primary-700"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-semibold">
                  {t('subscription.addons.buyCredits') || 'Comprar Créditos'}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 -rotate-90 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
