import StatCard from '@/Components/Statistics/StatCard';
import EmptyState from '@/Components/common/EmptyState';
import Skeleton from '@/Components/common/ui/Skeleton';
import { useAnalyticsData } from '@/Hooks/useAnalyticsData';
import { useAnalyticsSync } from '@/Hooks/useAnalyticsSync';
import { useTheme } from '@/Hooks/useTheme';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { getEmptyStateByKey } from '@/Utils/emptyStateMapper';
import { Head, router, usePage } from '@inertiajs/react';
import { Eye, Heart, LockKeyhole, MousePointer2, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { Suspense, lazy, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CampaignStat } from '../../Components/Analytics/PerformanceTable';
import PeriodSelector from '../../Components/Analytics/PeriodSelector';

const EngagementChart = lazy(() => import('@/Components/Statistics/EngagementChart'));
const CampaignPerformance = lazy(() => import('../../Components/Analytics/CampaignPerformance'));
const SocialMediaAccounts = lazy(() => import('../../Components/Analytics/SocialMediaAccounts'));
const DetailedPlatformChart = lazy(
  () => import('../../Components/Analytics/DetailedPlatformChart'),
);
const DetailedPublicationPerformance = lazy(
  () => import('../../Components/Analytics/DetailedPublicationPerformance'),
);

interface OverviewStats {
  total_views: number;
  total_clicks: number;
  total_conversions: number;
  total_reach: number;
  avg_engagement_rate: number;
  avg_ctr: number;
  avg_conversion_rate: number;
  total_engagement: number;
  changes?: {
    views?: number;
    clicks?: number;
    conversions?: number;
    engagement?: number;
  };
}

interface SocialMediaAccount {
  id: number;
  platform: string;
  account_name: string;
  followers: number;
  engagement_rate: number;
  reach: number;
  follower_growth_30d: number;
}

interface EngagementTrend {
  date: string;
  views: number;
  clicks: number;
  engagement: number;
}

interface AnalyticsProps {
  stats: {
    overview: OverviewStats;
    campaigns: CampaignStat[];
    social_media: SocialMediaAccount[];
    engagement_trends: EngagementTrend[];
    detailedPlatforms?: any[];
    detailedPublications?: any[];
  };
  period: number;
}

export default function Index({ stats: initialStats, period }: AnalyticsProps) {
  const { t } = useTranslation();
  const { actualTheme: theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState(Number(period));
  const isDark = theme === 'dark';
  const { auth } = usePage<any>().props;
  const workspaceId = auth?.user?.current_workspace_id;

  // Gate advanced analytics based on workspace plan features
  const hasAdvancedAnalytics =
    auth?.current_workspace?.features?.advanced_analytics ||
    ['professional', 'enterprise'].includes(auth?.current_workspace?.plan?.toLowerCase() ?? '');

  // TanStack Query — caches data per period so switching is instant after first load
  const { data: queryStats, isFetching } = useAnalyticsData(selectedPeriod, workspaceId);
  const { sync, isBusy, phase, locked, retryAfter, lastSyncedAt } = useAnalyticsSync(workspaceId);

  // Use query data when available, fall back to Inertia SSR props for initial render
  const stats = queryStats ?? initialStats;

  const overview = stats?.overview ?? {};
  const campaigns = stats?.campaigns ?? [];
  const socialMedia = stats?.social_media ?? [];
  const engagementTrends = stats?.engagement_trends ?? [];
  const detailedPlatforms = stats?.detailedPlatforms ?? [];
  const detailedPublications = stats?.detailedPublications ?? [];

  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days);
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('analytics.title')} />

      <div className="mx-auto max-w-7xl px-4 py-8 text-gray-900 transition-colors duration-300 dark:text-gray-100 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center justify-between gap-6 rounded-lg border border-white/70 bg-gradient-to-r from-white/90 to-white/95 p-8 shadow-sm transition-colors duration-300 dark:border-black/70 dark:from-black/90 dark:to-black/95 md:flex-row">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              {t('analytics.title')}
              {isFetching && (
                <span className="ml-3 inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-400 border-t-transparent align-middle" />
              )}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">{t('analytics.subtitle')}</p>
            {lastSyncedAt && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {t('analytics.lastSynced', 'Última actualización')}:{' '}
                {lastSyncedAt.toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
              theme={theme}
            />

            {/* Manual sync button */}
            <button
              onClick={sync}
              disabled={isBusy || locked}
              title={
                locked
                  ? `Próxima actualización disponible en ${Math.ceil(retryAfter / 60)} min`
                  : isBusy
                    ? 'Actualizando datos...'
                    : 'Actualizar datos desde las redes sociales'
              }
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                isDark
                  ? 'bg-neutral-700 text-gray-200 hover:bg-neutral-600'
                  : 'bg-white text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} />
              {phase === 'dispatching' && 'Iniciando...'}
              {phase === 'waiting' && 'Actualizando...'}
              {phase === 'locked' && `${Math.ceil(retryAfter / 60)}m`}
              {(phase === 'idle' || phase === 'done') && 'Actualizar'}
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t('analytics.stats.totalViews')}
            value={overview.total_views || 0}
            change={overview.changes?.views}
            icon={<Eye className="h-6 w-6" />}
            color="primary"
            variant={1}
            theme={theme}
          />
          <StatCard
            title={t('analytics.stats.totalClicks')}
            value={overview.total_clicks || 0}
            change={overview.changes?.clicks}
            icon={<MousePointer2 className="h-6 w-6" />}
            color="primary"
            variant={2}
            theme={theme}
          />
          <StatCard
            title={t('analytics.stats.conversions')}
            value={overview.total_conversions || 0}
            change={overview.changes?.conversions}
            icon={<TrendingUp className="h-6 w-6" />}
            color="primary"
            variant={3}
            theme={theme}
          />
          <StatCard
            title={t('analytics.stats.totalReach')}
            value={overview.total_reach || 0}
            change={overview.changes?.engagement}
            icon={<Users className="h-6 w-6" />}
            color="primary"
            variant={4}
            theme={theme}
          />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t('analytics.stats.avgEngagementRate')}
            value={overview.avg_engagement_rate || 0}
            icon={<Heart className="h-6 w-6" />}
            format="percentage"
            color="primary"
            variant={1}
            theme={theme}
          />
          <StatCard
            title={t('analytics.stats.avgCtr')}
            value={overview.avg_ctr || 0}
            icon={<MousePointer2 className="h-6 w-6" />}
            format="percentage"
            color="primary"
            variant={2}
            theme={theme}
          />
          <StatCard
            title={t('analytics.stats.avgConversionRate')}
            value={overview.avg_conversion_rate || 0}
            icon={<TrendingUp className="h-6 w-6" />}
            format="percentage"
            color="primary"
            variant={3}
            theme={theme}
          />
          <StatCard
            title={t('analytics.stats.totalEngagement')}
            value={overview.total_engagement || 0}
            icon={<Heart className="h-6 w-6" />}
            color="primary"
            variant={4}
            theme={theme}
          />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6">
          <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-lg transition-colors duration-300 dark:border-neutral-700/50 dark:bg-neutral-800/50 dark:backdrop-blur-sm">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
              {t('analytics.charts.engagementTrends')}
            </h2>
            <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
              <EngagementChart data={engagementTrends} theme={theme as any} />
            </Suspense>
          </div>
        </div>

        {campaigns.length > 0 && (
          <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
            <CampaignPerformance campaigns={campaigns} theme={theme} />
          </Suspense>
        )}

        {/* Publication performance — visible for all plans */}
        {(detailedPublications.length > 0 || campaigns.length > 0) && (
          <div className="mb-8">
            <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-lg transition-colors duration-300 dark:border-neutral-700/50 dark:bg-neutral-800/50 dark:backdrop-blur-sm">
              <div className="mb-5 flex flex-col gap-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t('analytics.charts.detailedPublications', 'Rendimiento de Publicaciones')}
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t(
                    'analytics.publications.subtitle',
                    'Seguimiento detallado por publicación — vistas, clicks, engagement y alcance por plataforma',
                  )}
                </p>
                {selectedPeriod > 90 && (
                  <span
                    className={`mt-1 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {t(
                      'analytics.publications.aggregated_note',
                      'Datos agregados por semana para este período',
                    )}
                  </span>
                )}
              </div>
              <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
                <DetailedPublicationPerformance publications={detailedPublications} theme={theme} />
              </Suspense>
            </div>
          </div>
        )}

        {socialMedia.length > 0 && (
          <div className="mb-8">
            <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
              <SocialMediaAccounts accounts={socialMedia} theme={theme} showChart={true} />
            </Suspense>
          </div>
        )}

        {/* Advanced platform analytics — gated by plan */}
        {hasAdvancedAnalytics ? (
          <>
            {detailedPlatforms.length > 0 && (
              <div className="mb-8">
                <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-lg transition-colors duration-300 dark:border-neutral-700/50 dark:bg-neutral-800/50 dark:backdrop-blur-sm">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {t('analytics.charts.detailedPlatforms')}
                  </h2>
                  <p className={`mb-5 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('analytics.advanced.daily_metrics')}
                  </p>
                  <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
                    <DetailedPlatformChart platforms={detailedPlatforms} theme={theme} />
                  </Suspense>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="relative mb-8 overflow-hidden rounded-2xl border border-primary-200/50 shadow-lg dark:border-primary-800/30">
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white/80 p-8 backdrop-blur-sm dark:bg-neutral-900/80">
              <div className="rounded-full bg-primary-100 p-4 dark:bg-primary-900/40">
                <LockKeyhole className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-center text-xl font-bold text-gray-900 dark:text-white">
                {t('analytics.advanced.locked_title')}
              </h3>
              <p className="max-w-md text-center text-sm text-gray-600 dark:text-gray-400">
                {t('analytics.advanced.locked_description')}
              </p>
              <button
                onClick={() => router.visit('/pricing')}
                className="mt-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary-700"
              >
                {t('analytics.advanced.upgrade_cta')}
              </button>
            </div>
            <div className="pointer-events-none select-none p-6 opacity-20">
              <Skeleton className="mb-4 h-8 w-48 rounded-lg" />
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </div>
          </div>
        )}

        {campaigns.length === 0 &&
          socialMedia.length === 0 &&
          detailedPublications.length === 0 && (
            <EmptyState config={getEmptyStateByKey('analytics', t)!} />
          )}
      </div>
    </AuthenticatedLayout>
  );
}
