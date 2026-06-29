import { useAddonsSummary } from '@/Hooks/Addons/useAddonsSummary';
import { formatDateString } from '@/Utils/formatters';
import { useTranslation } from 'react-i18next';
import AddonExtensionInfo from '@/Components/Addons/AddonExtensionInfo';
import AddonsSummaryEmpty from '@/Components/Addons/AddonsSummaryEmpty';
import AddonsSummaryHeader from '@/Components/Addons/AddonsSummaryHeader';
import AddonTrackingInfo from '@/Components/Addons/AddonTrackingInfo';
import AddonUsageDisplay from '@/Components/Addons/AddonUsageDisplay';

export default function AddonsSummary() {
  const { t } = useTranslation();
  const { data, loading, error } = useAddonsSummary();

  const formatDate = (dateString?: string) =>
    formatDateString(dateString, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-lg bg-gray-200 dark:bg-neutral-700"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500 dark:text-neutral-400">{t('subscription.addons.loadingError')}</p>
      </div>
    );
  }

  const addonTypes = [
    {
      key: 'ai_credits',
      name: t('subscription.addons.aiCredits'),
      unit: t('subscription.addons.credits'),
    },
    {
      key: 'storage',
      name: t('subscription.addons.storage'),
      unit: 'GB',
    },
    {
      key: 'publications',
      name: t('subscription.addons.publications'),
      unit: t('subscription.addons.posts'),
    },
    {
      key: 'team_members',
      name: t('subscription.addons.teamMembers'),
      unit: t('subscription.addons.members'),
    },
  ];

  const hasActiveAddons = Object.values(data.summary).some((s) => s.total > 0);
  const hasNoAddons = Object.values(data.summary).every((s) => s.total === 0 && s.excess_usage === 0);

  return (
    <div className="space-y-6">
      {/* Plan Info Header */}
      <AddonsSummaryHeader
        currentPlan={data.plan_info.current_plan}
        planStartedAt={data.plan_info.plan_started_at}
        formatDate={formatDate}
      />

      {/* Addons Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {addonTypes.map((type) => {
          const summary = data.summary[type.key as keyof typeof data.summary];

          // Solo mostrar si tiene addons o está excediendo el plan
          if (summary.total === 0 && summary.excess_usage === 0) {
            return null;
          }

          return (
            <AddonUsageDisplay
              key={type.key}
              type={type.key}
              name={type.name}
              planLimit={summary.plan_limit}
              currentUsage={summary.current_usage}
              addonTotal={summary.total}
              addonUsed={summary.used}
              addonRemaining={summary.available}
              unit={type.unit}
            />
          );
        })}
      </div>

      {/* No Addons Message */}
      {hasNoAddons && <AddonsSummaryEmpty />}

      {/* Plan Tracking Explanation */}
      <AddonTrackingInfo planStartedAt={data.plan_info.plan_started_at} formatDate={formatDate} />

      {/* FIFO Explanation */}
      {hasActiveAddons && <AddonExtensionInfo />}
    </div>
  );
}
