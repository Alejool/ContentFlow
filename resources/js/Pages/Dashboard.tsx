import { CampaignStat } from '@/Components/Analytics/PerformanceTable';
import { AddonsPromotionCard } from '@/Components/Dashboard/AddonsPromotionCard';
import ExpiredTokensBanner from '@/Components/Dashboard/ExpiredTokensBanner';
import { PublicationStatusCards } from '@/Components/Dashboard/PublicationStatusCards';
import StatCard from '@/Components/Statistics/StatCard';
import Skeleton from '@/Components/common/ui/Skeleton';
import { useDashboardStats } from '@/Hooks/useDashboardStats';
import { useTheme } from '@/Hooks/useTheme';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Calendar,
  Eye,
  FileText,
  Heart,
  Mail,
  MousePointer2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const PlatformPerformance = lazy(() => import('@/Components/Analytics/PlatformPerformance'));
const SocialMediaAccounts = lazy(() => import('@/Components/Analytics/SocialMediaAccounts'));
const EngagementChart = lazy(() => import('@/Components/Statistics/EngagementChart'));

interface ProblematicAccount {
  id: number;
  platform: string;
  account_name: string;
  reason: 'expired' | 'failures';
}

interface DashboardProps {
  auth: {
    user: any;
  };
  status?: string;
  stats: {
    totalViews: number;
    totalClicks: number;
    totalConversions: number;
    totalReach: number;
    totalEngagement: number;
    avgEngagementRate: number;
    publicationStats?: Record<string, number>;
    campaigns: CampaignStat[];
    engagementTrends: any[];
    platformData: any[];
    platformComparison: any[];
  };
  period: number;
  problematicAccounts?: ProblematicAccount[];
}

export default function Dashboard({
  auth,
  stats,
  status,
  period = 30,
  problematicAccounts = [],
}: DashboardProps) {
  const { t } = useTranslation();
  const { actualTheme: theme } = useTheme();
  const { auth: pageAuth } = usePage<any>().props;
  const workspaceId = pageAuth?.user?.current_workspace_id;
  const [showBanner, setShowBanner] = useState(true);

  // TanStack Query — replaces the manual useFetchPublicationStats hook
  const {
    data: fetchedStats,
    isLoading: loadingPubStats,
    refetch: refetchStats,
  } = useDashboardStats(workspaceId);
  const pubStats = stats.publicationStats ?? fetchedStats ?? {};

  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState(status === 'verification-link-sent');

  useEffect(() => {
    if (!auth?.user?.id) return;

    const channel = window.Echo.private(`users.${auth.user.id}`);
    channel.listen('.PublicationStatusUpdated', () => refetchStats());

    return () => {
      channel.stopListening('.PublicationStatusUpdated');
    };
  }, [auth?.user?.id, refetchStats]);

  // Early return if auth or user is not available (after all hooks)
  if (!auth || !auth.user) {
    return null;
  }

  const handlePeriodChange = (days: number) => {
    router.get(
      route('dashboard'),
      { days },
      {
        preserveState: true,
        preserveScroll: true,
        only: ['stats', 'period'],
      },
    );
  };

  const handleResendVerification = () => {
    setSending(true);
    axios
      .post(route('verification.send'))
      .then(() => {
        setSuccessMessage(true);
        setSending(false);
        setTimeout(() => {
          setSuccessMessage(false);
        }, 5000);
      })
      .catch(() => {
        setSending(false);
      });
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('dashboard.title')} />

      <div
        id="dashboard"
        className={`mx-auto min-h-screen max-w-7xl px-4 py-8 transition-colors duration-300 sm:px-6 lg:px-8`}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          data-theme-color={auth.user?.theme_color || 'orange'}
          className="mb-8 flex flex-col items-center justify-between gap-6 rounded-lg border border-white/70 bg-gradient-to-r from-white/90 to-white/95 p-8 shadow-sm transition-colors duration-300 dark:border-neutral-700 dark:bg-gradient-to-r dark:from-neutral-800 dark:to-neutral-900 md:flex-row"
        >
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              {t('dashboard.welcomeMessage', { name: auth.user.name })}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">{t('dashboard.systemStats')}</p>
          </div>

          <div className="flex rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => handlePeriodChange(days)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  period === days
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-neutral-900 dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {days} {t('common.units.days', 'Days')}
              </button>
            ))}
          </div>
        </motion.div>

        <ExpiredTokensBanner accounts={problematicAccounts} />

        {!auth.user.email_verified_at && showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-neutral-700 dark:bg-gradient-to-r dark:from-neutral-800 dark:to-neutral-900"
          >
            {' '}
            <div className="flex items-start justify-between">
              <div className="flex flex-1 items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-700">
                    <Mail className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {t('auth.verification.banner.title')}
                  </h3>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    {t('auth.verification.banner.message')}
                  </p>
                  {successMessage && (
                    <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800/30 dark:bg-green-900/20">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        ✓ {t('auth.verification.banner.successMessage')}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleResendVerification}
                    disabled={sending}
                    className="group relative transform overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 p-2 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending
                      ? t('auth.verification.banner.sending')
                      : t('auth.verification.banner.resendButton')}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowBanner(false)}
                className="flex-shrink-0 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: t('dashboard.totalViews'),
              value: stats.totalViews,
              icon: <Eye className="h-6 w-6" />,
              variant: 1 as const,
            },
            {
              title: t('dashboard.totalClicks'),
              value: stats.totalClicks,
              icon: <MousePointer2 className="h-6 w-6" />,
              variant: 2 as const,
            },
            {
              title: t('dashboard.conversions'),
              value: stats.totalConversions,
              icon: <TrendingUp className="h-6 w-6" />,
              variant: 3 as const,
            },
            {
              title: t('dashboard.totalReach'),
              value: stats.totalReach,
              icon: <Users className="h-6 w-6" />,
              variant: 4 as const,
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
            >
              <StatCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color="primary"
                variant={stat.variant}
                theme={theme}
              />
            </motion.div>
          ))}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              title: t('dashboard.totalEngagement'),
              value: stats.totalEngagement,
              icon: <Heart className="h-6 w-6" />,
              variant: 1 as const,
            },
            {
              title: t('dashboard.avgEngagementRate'),
              value: stats.avgEngagementRate.toFixed(2),
              icon: <TrendingUp className="h-6 w-6" />,
              variant: 2 as const,
              format: 'percentage' as const,
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
            >
              <StatCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color="primary"
                {...(stat.format && { format: stat.format })}
                variant={stat.variant}
                theme={theme}
              />
            </motion.div>
          ))}
        </div>

        <PublicationStatusCards
          variant="carousel"
          stats={pubStats}
          loading={loadingPubStats}
          className="mb-8"
        />

        {/* Add-ons Promotion Card con Carrusel */}
        <div className="mb-8">
          <AddonsPromotionCard showCarousel={true} showPromoBanner={true} />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6">
          {stats.engagementTrends.length > 0 && (
            <div className="rounded-lg border border-gray-100 bg-white/60 p-6 shadow-sm backdrop-blur-lg transition-colors duration-300 dark:border-neutral-700/50 dark:bg-neutral-800/70 dark:backdrop-blur-sm">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/20">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                {t('dashboard.engagementTrends')}
              </h2>
              <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
                <EngagementChart data={stats.engagementTrends} theme={theme as any} />
              </Suspense>
            </div>
          )}
        </div>

        {stats.platformComparison.length > 0 && (
          <div className="mb-8">
            <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
              <PlatformPerformance data={stats.platformComparison} theme={theme as any} />
            </Suspense>
          </div>
        )}

        {stats.platformData.length > 0 && (
          <div className="mb-8">
            <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
              <SocialMediaAccounts
                accounts={stats.platformData}
                theme={theme as any}
                showChart={true}
              />
            </Suspense>
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              href: '/content?tab=campaigns',
              icon: Calendar,
              title: t('dashboard.quickActions.campaigns.title'),
              desc: t('dashboard.quickActions.campaigns.description'),
              color: 'blue',
            },
            {
              href: '/analytics',
              icon: BarChart3,
              title: t('dashboard.quickActions.analytics.title'),
              desc: t('dashboard.quickActions.analytics.description'),
              color: 'purple',
            },
            {
              href: '/content',
              icon: FileText,
              title: t('dashboard.quickActions.content.title'),
              desc: t('dashboard.quickActions.content.description'),
              color: 'green',
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group relative overflow-hidden rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:shadow-xl dark:border-neutral-700/50 dark:bg-neutral-800/40 dark:backdrop-blur-md dark:hover:bg-neutral-800/60"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 bg-${action.color}-50 text-${action.color}-600 dark:bg-${action.color}-900/20 dark:text-${action.color}-400`}
              >
                <action.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                {action.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {action.desc}
              </p>

              {/* Subtle hover indicator */}
              <div
                className={`absolute bottom-0 left-0 h-1 transition-all duration-300 bg-${action.color}-500 w-0 group-hover:w-full dark:bg-${action.color}-500/50`}
              />
            </Link>
          ))}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
