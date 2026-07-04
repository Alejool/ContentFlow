import type { CampaignStat } from '@/Components/Analytics/PerformanceTable';
import { AddonsPromotionCard } from '@/Components/Dashboard/AddonsPromotionCard';
import { PublicationStatusCards } from '@/Components/Dashboard/PublicationStatusCards';
import StatCard from '@/Components/Statistics/StatCard';
import Skeleton from '@/Components/common/ui/Skeleton';
import { useDashboardStats } from '@/Hooks/Dashboard/useDashboardStats';
import { useTheme } from '@/Hooks/Layout/useTheme';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { profileService } from '@/Services/Auth/profileService';
import { motion, AnimatePresence } from 'framer-motion';
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
  LayoutDashboard,
  Share2,
  Activity
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
  const [activeTab, setActiveTab] = useState<'overview' | 'engagement' | 'social'>('overview');

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

    const subscribeToChannel = () => {
      if (!window.Echo) {
        const timer = setTimeout(subscribeToChannel, 100);
        return () => clearTimeout(timer);
      }

      const channel = window.Echo.private(`users.${auth.user.id}`);
      channel.listen('.PublicationStatusUpdated', () => refetchStats());

      return () => {
        if (channel) {
          channel.stopListening('.PublicationStatusUpdated');
        }
      };
    };

    return subscribeToChannel();
  }, [auth?.user?.id, refetchStats]);

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
    profileService
      .resendEmailVerification()
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

  const tabs = [
    { id: 'overview', label: t('dashboard.tabs.overview', 'Resumen'), icon: LayoutDashboard },
    { id: 'engagement', label: t('dashboard.tabs.engagement', 'Interacción'), icon: Activity },
    { id: 'social', label: t('dashboard.tabs.social', 'Redes Sociales'), icon: Share2 },
  ];

  const isDark = theme === 'dark';

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
          className="mb-8 flex flex-col items-center justify-between gap-6 rounded-lg border border-white/70 bg-gradient-to-r from-white/90 to-white/95 p-8 shadow-sm transition-colors duration-300 md:flex-row dark:border-neutral-700 dark:bg-gradient-to-r dark:from-neutral-800 dark:to-neutral-900"
        >
          <div>
            <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
              ¡Bienvenido, {auth.user.name}!
            </h1>
            <p className="text-lg text-gray-600 dark:text-neutral-400">
              {t('dashboard.subtitle', 'Estadísticas generales del sistema.')}
            </p>
          </div>

          <div className="flex rounded-lg bg-neutral-100 p-1 dark:bg-theme-bg-secondary">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => handlePeriodChange(days)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  period === days
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-neutral-800 dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-gray-200'
                }`}
              >
                {days} {t('common.units.days', 'Days')}
              </button>
            ))}
          </div>
        </motion.div>

        {!auth.user.email_verified_at && showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-neutral-700 dark:bg-gradient-to-r dark:from-neutral-800 dark:to-neutral-900"
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-1 items-start gap-4">
                <div className="shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-700">
                    <Mail className="h-6 w-6 text-gray-600 dark:text-neutral-300" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {t('auth.verification.banner.title')}
                  </h3>
                  <p className="mb-4 text-sm text-gray-600 dark:text-neutral-400">
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
                className="shrink-0 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8 border-b border-gray-200 dark:border-neutral-800">
          <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    group inline-flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-neutral-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500 dark:text-neutral-500 dark:group-hover:text-gray-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* TABS CONTENT */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('dashboard.sections.performance', 'Resumen de Rendimiento')}
                  </h2>
                  <p className="text-gray-600 dark:text-neutral-400">
                    {t('dashboard.sections.performanceDesc', 'Métricas clave sobre el alcance y la interacción de tu contenido.')}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { title: t('dashboard.totalViews'), value: stats.totalViews, icon: <Eye className="h-6 w-6" />, variant: 1 as const },
                    { title: t('dashboard.totalClicks'), value: stats.totalClicks, icon: <MousePointer2 className="h-6 w-6" />, variant: 2 as const },
                    { title: t('dashboard.conversions'), value: stats.totalConversions, icon: <TrendingUp className="h-6 w-6" />, variant: 3 as const },
                    { title: t('dashboard.totalReach'), value: stats.totalReach, icon: <Users className="h-6 w-6" />, variant: 4 as const },
                  ].map((stat, index) => (
                    <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}>
                      <StatCard title={stat.title} value={stat.value} icon={stat.icon} color="primary" variant={stat.variant} theme={theme} />
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('dashboard.sections.publications', 'Estado de Publicaciones')}
                  </h2>
                  <p className="text-gray-600 dark:text-neutral-400">
                    {t('dashboard.sections.publicationsDesc', 'Reporte del estado actual de tus campañas y publicaciones recientes.')}
                  </p>
                </div>
                <PublicationStatusCards variant="carousel" stats={pubStats} loading={loadingPubStats} />
              </div>

              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                {[
                  { href: '/content?tab=campaigns', icon: Calendar, title: t('dashboard.quickActions.campaigns.title'), desc: t('dashboard.quickActions.campaigns.description'), color: 'blue' },
                  { href: '/analytics', icon: BarChart3, title: t('dashboard.quickActions.analytics.title'), desc: t('dashboard.quickActions.analytics.description'), color: 'purple' },
                  { href: '/content', icon: FileText, title: t('dashboard.quickActions.content.title'), desc: t('dashboard.quickActions.content.description'), color: 'green' },
                ].map((action) => (
                  <Link key={action.href} href={action.href} className="group relative overflow-hidden rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:shadow-xl dark:border-neutral-700/50 dark:bg-theme-bg-secondary dark:backdrop-blur-md dark:hover:bg-neutral-800/60">
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 bg-${action.color}-50 text-${action.color}-600 dark:bg-${action.color}-900/20 dark:text-${action.color}-400`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{action.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-neutral-400">{action.desc}</p>
                    <div className={`absolute bottom-0 left-0 h-1 transition-all duration-300 bg-${action.color}-500 w-0 group-hover:w-full dark:bg-${action.color}-500/50`} />
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'engagement' && (
            <motion.div
              key="engagement"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('dashboard.sections.interaction', 'Métricas de Interacción')}
                  </h2>
                  <p className="text-gray-600 dark:text-neutral-400">
                    {t('dashboard.sections.interactionDesc', 'Análisis detallado de cómo los usuarios interactúan con tu marca.')}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { title: t('dashboard.totalEngagement'), value: stats.totalEngagement, icon: <Heart className="h-6 w-6" />, variant: 1 as const },
                    { title: t('dashboard.avgEngagementRate'), value: stats.avgEngagementRate.toFixed(2), icon: <TrendingUp className="h-6 w-6" />, variant: 2 as const, format: 'percentage' as const },
                  ].map((stat, index) => (
                    <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}>
                      <StatCard title={stat.title} value={stat.value} icon={stat.icon} color="primary" {...(stat.format && { format: stat.format })} variant={stat.variant} theme={theme} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {stats.engagementTrends.length > 0 && (
                <div className="rounded-lg border border-gray-100 bg-white/60 p-6 shadow-sm backdrop-blur-lg transition-colors duration-300 dark:border-neutral-700/50 dark:bg-theme-bg-secondary dark:backdrop-blur-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                    <div className="bg-primary-100 dark:bg-primary-900/20 rounded-lg p-2">
                      <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    {t('dashboard.engagementTrends')}
                  </h2>
                  <Suspense fallback={<Skeleton className="h-1 w-full rounded-lg" />}>
                    <EngagementChart data={stats.engagementTrends} theme={theme as any} />
                  </Suspense>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'social' && (
            <motion.div
              key="social"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {stats.platformComparison.length > 0 && (
                <div>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                    {t('dashboard.sections.platforms', 'Comparativa de Plataformas')}
                  </h2>
                  <Suspense fallback={<Skeleton className="h-1 w-full rounded-lg" />}>
                    <PlatformPerformance data={stats.platformComparison} theme={theme as any} />
                  </Suspense>
                </div>
              )}

              {stats.platformData.length > 0 && (
                <div>
                  <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                    {t('dashboard.sections.accounts', 'Estado de Cuentas Conectadas')}
                  </h2>
                  <Suspense fallback={<Skeleton className="h-75 w-full rounded-lg" />}>
                    <SocialMediaAccounts
                      accounts={stats.platformData}
                      theme={theme as any}
                      showChart={true}
                    />
                  </Suspense>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8">
          <AddonsPromotionCard showCarousel={true} showPromoBanner={true} />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
