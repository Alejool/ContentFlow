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
import { Suspense, lazy, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { theme } = useTheme() as { theme: "light" | "dark" | undefined };
  const [pubStats, setPubStats] = useState<Record<string, number>>(
    stats.publicationStats || {},
  );
  const [loadingPubStats, setLoadingPubStats] = useState(
    !stats.publicationStats,
  );
  const [showBanner, setShowBanner] = useState(true);
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    status === "verification-link-sent",
  );

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

  useEffect(() => {
    if (!stats.publicationStats) {
      axios
        .get(route("api.v1.publications.stats"))
        .then((res) => setPubStats(res.data || {}))
        .catch((error) => {
          if (error.response?.status !== 401) {
            console.error("Failed to fetch publication stats", error);
          }
        })
        .finally(() => setLoadingPubStats(false));
    }
  }, []);

  useEffect(() => {
    if (!auth.user?.id) return;

    const channel = window.Echo.private(`users.${auth.user.id}`);

    const refreshStats = () => {
      axios
        .get(route("api.v1.publications.stats"))
        .then((res) => setPubStats(res.data || {}))
        .catch((error) => {
          if (error.response?.status !== 401) {
            console.error("Failed to refresh publication stats", error);
          }
        });
    };

    channel.listen(".PublicationStatusUpdated", refreshStats);

    return () => {
      // Echo.private returns the channel, but stopListening is called on it
      channel.stopListening(".PublicationStatusUpdated");
    };
  }, [auth.user.id]);

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

  const getContainerBg = () => {
    return theme === "dark" ? "bg-neutral-900" : "bg-gray-50";
  };

  const getCardBg = () => {
    return theme === "dark"
      ? "bg-neutral-800/70 backdrop-blur-sm border border-neutral-700/50"
      : "bg-white/60 backdrop-blur-lg border border-gray-100";
  };

  const getTextColor = (
    type: "primary" | "secondary" | "title" = "primary",
  ) => {
    if (theme === "dark") {
      switch (type) {
        case "title":
          return "text-white";
        case "primary":
          return "text-gray-100";
        case "secondary":
          return "text-gray-400";
        default:
          return "text-gray-100";
      }
    } else {
      switch (type) {
        case "title":
          return "text-gray-900";
        case "primary":
          return "text-gray-700";
        case "secondary":
          return "text-gray-600";
        default:
          return "text-gray-900";
      }
    }
  };

  const getGradientButton = (from: string, to: string) => {
    const baseStyles =
      "group relative overflow-hidden transition-all duration-300 font-semibold rounded-lg";
    const darkStyles = `bg-gradient-to-r ${from} ${to} text-white hover:shadow-xl transform hover:-translate-y-0.5`;
    const lightStyles = `bg-gradient-to-r ${from} ${to} text-white hover:shadow-xl transform hover:-translate-y-0.5`;
    return `${baseStyles} ${theme === "dark" ? darkStyles : lightStyles}`;
  };

  return (
    <AuthenticatedLayout>
      <Head title={t("dashboard.title")} />

      <div
        className={`py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto
          min-h-screen transition-colors duration-300 `}
      >
        <div
          className={`rounded-lg p-8 mb-8 shadow-sm transition-colors duration-300 flex flex-col md:flex-row items-center justify-between gap-6 ${
            theme === "dark"
              ? "bg-gradient-to-r from-neutral-800/50 to-purple-900/90 border border-neutral-700/50"
              : "bg-gradient-to-r from-white to-gray-50 border border-gray-100" // Neutralized background
          }`}
        >
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${getTextColor("title")}`}>
              {t("dashboard.welcomeMessage", { name: auth.user.name })}
            </h1>
            <p className={`text-lg ${getTextColor("secondary")}`}>
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
                    ? "bg-white dark:bg-neutral-700 shadow-sm text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {days} {t("common.days", "Days")}
              </button>
            ))}
          </div>
        </div>

        {!auth.user.email_verified_at && showBanner && (
          <div
            className={`mb-8 rounded-lg p-6 shadow-sm transition-colors duration-300 ${
              theme === "dark"
                ? "bg-gradient-to-r from-neutral-800/80 to-neutral-900/80 border border-neutral-700"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      theme === "dark" ? "bg-neutral-700" : "bg-gray-100"
                    }`}
                  >
                    <Mail
                      className={`w-6 h-6 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-lg font-semibold mb-1 ${getTextColor(
                      "title",
                    )}`}
                  >
                    {t("auth.verification.banner.title")}
                  </h3>
                  <p className={`text-sm mb-4 ${getTextColor("secondary")}`}>
                    {t("auth.verification.banner.message")}
                  </p>
                  {successMessage && (
                    <div
                      className={`mb-3 p-3 rounded-lg ${
                        theme === "dark"
                          ? "bg-green-900/20 border border-green-800/30"
                          : "bg-green-50 border border-green-200"
                      }`}
                    >
                      <p
                        className={`text-sm font-medium ${
                          theme === "dark" ? "text-green-300" : "text-green-800"
                        }`}
                      >
                        ✓ {t("auth.verification.banner.successMessage")}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleResendVerification}
                    disabled={sending}
                    className={
                      getGradientButton("from-purple-600", "to-purple-700") +
                      " disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none p-2"
                    }
                  >
                    {sending
                      ? t("auth.verification.banner.sending")
                      : t("auth.verification.banner.resendButton")}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowBanner(false)}
                className={`flex-shrink-0 transition-colors ${
                  theme === "dark"
                    ? "text-gray-400 hover:text-gray-300"
                    : "text-gray-400 hover:text-gray-600"
                }`}
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
            color="orange"
            variant={1}
            theme={theme}
          />
          <StatCard
            title={t("dashboard.totalClicks")}
            value={stats.totalClicks}
            icon={<MousePointer2 className="w-6 h-6" />}
            color="orange"
            variant={2}
            theme={theme}
          />
          <StatCard
            title={t("dashboard.conversions")}
            value={stats.totalConversions}
            icon={<TrendingUp className="w-6 h-6" />}
            color="orange"
            variant={3}
            theme={theme}
          />
          <StatCard
            title={t("dashboard.totalReach")}
            value={stats.totalReach}
            icon={<Users className="w-6 h-6" />}
            color="orange"
            variant={4}
            theme={theme}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <StatCard
            title={t("dashboard.totalEngagement")}
            value={stats.totalEngagement}
            icon={<Heart className="w-6 h-6" />}
            color="orange"
            variant={1}
            theme={theme}
          />
          <StatCard
            title={t("dashboard.avgEngagementRate")}
            value={stats.avgEngagementRate.toFixed(2)}
            icon={<TrendingUp className="w-6 h-6" />}
            color="orange"
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
              color: "orange",
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
              className={`p-3 sm:p-4 rounded-lg border flex flex-col items-center text-center transition-all ${
                theme === "dark"
                  ? "bg-neutral-800/50 border-neutral-700"
                  : "bg-white border-gray-100 shadow-sm"
              }`}
            >
              <div
                className={`p-1.5 sm:p-2 rounded-full mb-1.5 sm:mb-2 ${
                  theme === "dark"
                    ? `bg-${status.color === "sky" ? "sky" : status.color}-900/20`
                    : `bg-${status.color === "sky" ? "sky" : status.color}-50`
                }`}
              >
                <status.icon
                  className={`w-3 h-3 sm:w-4 sm:h-4 text-${
                    status.color === "sky" ? "sky" : status.color
                  }-500`}
                />
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">
                {t(`publications.status.${status.key}`)}
              </p>
              <p
                className={`text-lg sm:text-xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {loadingPubStats ? "..." : pubStats[status.key] || 0}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">
          {stats.engagementTrends.length > 0 && (
            <div
              className={`rounded-lg p-6 shadow-sm transition-colors duration-300 ${getCardBg()}`}
            >
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${getTextColor(
                  "title",
                )}`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    theme === "dark" ? "bg-purple-900/20" : "bg-purple-100"
                  }`}
                >
                  <TrendingUp
                    className={`w-5 h-5 ${
                      theme === "dark" ? "text-purple-400" : "text-purple-600"
                    }`}
                  />
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
          ].map((action, idx) => (
            <Link
              key={idx}
              href={action.href}
              className={`group relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                theme === "dark"
                  ? "bg-neutral-800/40 backdrop-blur-md border border-neutral-700/50 hover:bg-neutral-800/60"
                  : "bg-white border border-gray-100 shadow-sm hover:border-gray-200"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${
                  theme === "dark"
                    ? `bg-${action.color}-900/20 text-${action.color}-400`
                    : `bg-${action.color}-50 text-${action.color}-600`
                }`}
              >
                <action.icon className="w-6 h-6" />
              </div>
              <h3
                className={`text-lg font-bold mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {action.title}
              </h3>
              <p
                className={`text-sm leading-relaxed ${getTextColor("secondary")}`}
              >
                {action.desc}
              </p>

              {/* Subtle hover indicator */}
              <div
                className={`absolute bottom-0 left-0 h-1 transition-all duration-300 ${
                  theme === "dark"
                    ? `bg-${action.color}-500/50 w-0 group-hover:w-full`
                    : `bg-${action.color}-500 w-0 group-hover:w-full`
                }`}
              />
            </Link>
          ))}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
