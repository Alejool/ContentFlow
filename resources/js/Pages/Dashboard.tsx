import { CampaignStat } from "@/Components/Analytics/PerformanceTable";
import StatCard from "@/Components/Statistics/StatCard";
import Skeleton from "@/Components/common/ui/Skeleton";
import { useTheme } from "@/Hooks/useTheme";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import axios from "axios";
import {
  BarChart3,
  Calendar,
  Eye,
  FileText,
  Heart,
  Mail,
  MousePointer2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Suspense, lazy, useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

// Custom hook to fetch publication stats (avoids fetch in useEffect warning)
const useFetchPublicationStats = (shouldFetch: boolean) => {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(shouldFetch);

  const fetchStats = useCallback(() => {
    if (!shouldFetch) return;
    
    axios
      .get(route("api.v1.publications.stats"))
      .then((res) => setData(res.data || {}))
      .catch((error) => {
        if (error.response?.status !== 401) {
          // Handle error silently
        }
      })
      .finally(() => setLoading(false));
  }, [shouldFetch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, refetch: fetchStats };
};

const PlatformPerformance = lazy(
  () => import("@/Components/Analytics/PlatformPerformance"),
);
const SocialMediaAccounts = lazy(
  () => import("@/Components/Analytics/SocialMediaAccounts"),
);
const EngagementChart = lazy(
  () => import("@/Components/Statistics/EngagementChart"),
);

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
}

export default function Dashboard({
  auth,
  stats,
  status,
  period = 30,
}: DashboardProps) {
  const { t } = useTranslation();
  const { actualTheme: theme } = useTheme();
  const [showBanner, setShowBanner] = useState(true);
  
  // Use custom hook for fetching stats - always call hooks unconditionally
  const shouldFetch = !stats.publicationStats;
  const { data: fetchedStats, loading: loadingPubStats, refetch: refetchStats } = useFetchPublicationStats(shouldFetch);
  const pubStats = stats.publicationStats || fetchedStats;
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    status === "verification-link-sent",
  );

  useEffect(() => {
    if (!auth?.user?.id) return;

    const channel = window.Echo.private(`users.${auth.user.id}`);

    channel.listen(".PublicationStatusUpdated", refetchStats);

    return () => {
      channel.stopListening(".PublicationStatusUpdated");
    };
  }, [auth?.user?.id, refetchStats]);
  
  // Early return if auth or user is not available (after all hooks)
  if (!auth || !auth.user) {
    return null;
  }

  const handlePeriodChange = (days: number) => {
    router.get(
      route("dashboard"),
      { days },
      {
        preserveState: true,
        preserveScroll: true,
        only: ["stats", "period"],
      },
    );
  };

  const handleResendVerification = () => {
    setSending(true);
    axios
      .post(route("verification.send"))
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
      <Head title={t("dashboard.title")} />

      <div
        id="dashboard"
        className={`py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto
          min-h-screen transition-colors duration-300 `}
      >
        <div
          data-theme-color={auth.user.theme_color}
          className="rounded-lg p-8 mb-8 shadow-sm transition-colors duration-300 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-white/90 to-white/95 border border-white/70 dark:bg-gradient-to-r dark:from-neutral-800 dark:to-neutral-900 dark:border-neutral-700"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
              {t("dashboard.welcomeMessage", { name: auth.user.name })}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {t("dashboard.systemStats")}
            </p>
          </div>

          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => handlePeriodChange(days)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  period === days
                    ? "bg-white dark:bg-neutral-900 shadow-sm text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {days} {t("common.days", "Days")}
              </button>
            ))}
          </div>
        </div>

        {!auth.user.email_verified_at && showBanner && (
          <div className="mb-8 rounded-lg p-6 shadow-sm transition-colors duration-300 bg-white border border-gray-200 dark:bg-gradient-to-r dark:from-neutral-800 dark:to-neutral-900 dark:border-neutral-700">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 dark:bg-neutral-700">
                    <Mail className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">
                    {t("auth.verification.banner.title")}
                  </h3>
                  <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">
                    {t("auth.verification.banner.message")}
                  </p>
                  {successMessage && (
                    <div className="mb-3 p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800/30">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        ✓ {t("auth.verification.banner.successMessage")}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleResendVerification}
                    disabled={sending}
                    className="group relative overflow-hidden transition-all duration-300 font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none p-2"
                  >
                    {sending
                      ? t("auth.verification.banner.sending")
                      : t("auth.verification.banner.resendButton")}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowBanner(false)}
                className="flex-shrink-0 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard
            title={t("dashboard.totalViews")}
            value={stats.totalViews}
            icon={<Eye className="w-6 h-6" />}
            color="primary"
            variant={1}
            theme={theme}
          />
          <StatCard
            title={t("dashboard.totalClicks")}
            value={stats.totalClicks}
            icon={<MousePointer2 className="w-6 h-6" />}
            color="primary"
            variant={2}
            theme={theme}
          />
          <StatCard
            title={t("dashboard.conversions")}
            value={stats.totalConversions}
            icon={<TrendingUp className="w-6 h-6" />}
            color="primary"
            variant={3}
            theme={theme}
          />
          <StatCard
            title={t("dashboard.totalReach")}
            value={stats.totalReach}
            icon={<Users className="w-6 h-6" />}
            color="primary"
            variant={4}
            theme={theme}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <StatCard
            title={t("dashboard.totalEngagement")}
            value={stats.totalEngagement}
            icon={<Heart className="w-6 h-6" />}
            color="primary"
            variant={1}
            theme={theme}
          />
          <StatCard
            title={t("dashboard.avgEngagementRate")}
            value={stats.avgEngagementRate.toFixed(2)}
            icon={<TrendingUp className="w-6 h-6" />}
            color="primary"
            format="percentage"
            variant={2}
            theme={theme}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 mb-8">
          {[
            {
              key: "draft",
              color: "gray",
              icon: FileText,
            },
            {
              key: "pending_review",
              color: "primary",
              icon: Eye,
            },
            {
              key: "approved",
              color: "purple",
              icon: Sparkles,
            },
            {
              key: "scheduled",
              color: "sky",
              icon: Calendar,
            },
            {
              key: "publishing",
              color: "blue",
              icon: TrendingUp,
            },
            {
              key: "published",
              color: "green",
              icon: Target,
            },
            { key: "failed", color: "red", icon: X },
          ].map((status) => (
            <div
              key={status.key}
              className="p-3 sm:p-4 rounded-lg border flex flex-col items-center text-center transition-all bg-white border-gray-100 shadow-sm dark:bg-neutral-800/50 dark:border-neutral-700"
            >
              <div className={`p-1.5 sm:p-2 rounded-full mb-1.5 sm:mb-2 bg-${status.color === "sky" ? "sky" : status.color}-50 dark:bg-${status.color === "sky" ? "sky" : status.color}-900/20`}>
                <status.icon
                  className={`w-3 h-3 sm:w-4 sm:h-4 text-${
                    status.color === "sky" ? "sky" : status.color
                  }-500`}
                />
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">
                {t(`publications.status.${status.key}`)}
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {loadingPubStats ? "..." : pubStats[status.key] || 0}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">
          {stats.engagementTrends.length > 0 && (
            <div className="rounded-lg p-6 shadow-sm transition-colors duration-300 bg-white/60 backdrop-blur-lg border border-gray-100 dark:bg-neutral-800/70 dark:backdrop-blur-sm dark:border-neutral-700/50">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/20">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                {t("dashboard.engagementTrends")}
              </h2>
              <Suspense
                fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}
              >
                <EngagementChart
                  data={stats.engagementTrends}
                  theme={theme as any}
                />
              </Suspense>
            </div>
          )}
        </div>

        {stats.platformComparison.length > 0 && (
          <div className="mb-8">
            <Suspense
              fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}
            >
              <PlatformPerformance
                data={stats.platformComparison}
                theme={theme as any}
              />
            </Suspense>
          </div>
        )}

        {stats.platformData.length > 0 && (
          <div className="mb-8">
            <Suspense
              fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}
            >
              <SocialMediaAccounts
                accounts={stats.platformData}
                theme={theme as any}
                showChart={true}
              />
            </Suspense>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              href: "/content?tab=campaigns",
              icon: Calendar,
              title: t("dashboard.quickActions.campaigns.title"),
              desc: t("dashboard.quickActions.campaigns.description"),
              color: "blue",
            },
            {
              href: "/analytics",
              icon: BarChart3,
              title: t("dashboard.quickActions.analytics.title"),
              desc: t("dashboard.quickActions.analytics.description"),
              color: "purple",
            },
            {
              href: "/content",
              icon: FileText,
              title: t("dashboard.quickActions.content.title"),
              desc: t("dashboard.quickActions.content.description"),
              color: "green",
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group relative overflow-hidden rounded-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white border border-gray-100 shadow-sm hover:border-gray-200 dark:bg-neutral-800/40 dark:backdrop-blur-md dark:border-neutral-700/50 dark:hover:bg-neutral-800/60"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 bg-${action.color}-50 text-${action.color}-600 dark:bg-${action.color}-900/20 dark:text-${action.color}-400`}>
                <action.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                {action.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {action.desc}
              </p>

              {/* Subtle hover indicator */}
              <div className={`absolute bottom-0 left-0 h-1 transition-all duration-300 bg-${action.color}-500 w-0 group-hover:w-full dark:bg-${action.color}-500/50`} />
            </Link>
          ))}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
