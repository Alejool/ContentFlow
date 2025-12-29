import BarChart from "@/Components/Statistics/BarChart";
import LineChart from "@/Components/Statistics/LineChart";
import PieChart from "@/Components/Statistics/PieChart";
import StatCard from "@/Components/Statistics/StatCard";
import { useTheme } from "@/Hooks/useTheme";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Eye,
  FileText,
  Heart,
  Mail,
  MousePointerClick,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";

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
    campaigns: any[];
    engagementTrends: any[];
    platformData: any[];
  };
}

export default function Dashboard({ auth, stats, status }: DashboardProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [pubStats, setPubStats] = useState<Record<string, number>>(stats.publicationStats || {});
  const [loadingPubStats, setLoadingPubStats] = useState(!stats.publicationStats);
  const [showBanner, setShowBanner] = useState(true);
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    status === "verification-link-sent"
  );

  useEffect(() => {
    if (!stats.publicationStats) {
      axios.get(route('api.publications.stats'))
        .then(res => setPubStats(res.data.data || {}))
        .finally(() => setLoadingPubStats(false));
    }
  }, []);

  const handleResendVerification = () => {
    setSending(true);
    axios.post(route("verification.send")).then(() => {
      setSuccessMessage(true);
      setSending(false);
      setTimeout(() => {
        setSuccessMessage(false);
      }, 5000);
    }).catch(() => {
      setSending(false);
    });
  };

  const campaignChartData = stats.campaigns.map((c) => ({
    name: c.title.length > 15 ? c.title.substring(0, 15) + "..." : c.title,
    views: c.views,
    clicks: c.clicks,
    engagement: c.engagement,
  }));

  const getContainerBg = () => {
    return theme === "dark" ? "bg-neutral-900" : "bg-gray-50";
  };

  const getCardBg = () => {
    return theme === "dark"
      ? "bg-neutral-800/70 backdrop-blur-sm border border-neutral-700/50"
      : "bg-white/60 backdrop-blur-lg border border-gray-100";
  };

  const getTextColor = (
    type: "primary" | "secondary" | "title" = "primary"
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
          className={`rounded-lg p-8 mb-8 shadow-sm transition-colors duration-300 ${theme === "dark"
            ? "bg-gradient-to-r from-neutral-800/50 to-purple-900/90 border border-neutral-700/50"
            : "bg-gradient-to-r from-primary-50/50 to-purple-50/50 border border-primary-100"
            }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1
                className={`text-3xl font-bold mb-2 ${getTextColor("title")}`}
              >
                {t("dashboard.welcomeMessage", { name: auth.user.name })}
              </h1>
              <p className={`text-lg ${getTextColor("secondary")}`}>
                {t("dashboard.systemStats")}
              </p>
            </div>
            <div
              className={`flex items-center gap-4 p-4 rounded-lg ${theme === "dark" ? "bg-neutral-800/30" : "bg-white/60"
                }`}
            >
              <div
                className={`p-3 rounded-lg ${theme === "dark" ? "bg-purple-900/20" : "bg-purple-100"
                  }`}
              >
                <Sparkles
                  className={`w-6 h-6 ${theme === "dark" ? "text-purple-400" : "text-purple-600"
                    }`}
                />
              </div>
            </div>
          </div>
        </div>

        {!auth.user.email_verified_at && showBanner && (
          <div
            className={`mb-8 rounded-lg p-6 shadow-sm transition-colors duration-300 ${theme === "dark"
              ? "bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30"
              : "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200"
              }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-blue-900/30" : "bg-blue-100"
                      }`}
                  >
                    <Mail
                      className={`w-6 h-6 ${theme === "dark" ? "text-blue-400" : "text-blue-600"
                        }`}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-lg font-semibold mb-1 ${getTextColor(
                      "title"
                    )}`}
                  >
                    {t("auth.verification.banner.title")}
                  </h3>
                  <p className={`text-sm mb-4 ${getTextColor("secondary")}`}>
                    {t("auth.verification.banner.message")}
                  </p>
                  {successMessage && (
                    <div
                      className={`mb-3 p-3 rounded-lg ${theme === "dark"
                        ? "bg-green-900/20 border border-green-800/30"
                        : "bg-green-50 border border-green-200"
                        }`}
                    >
                      <p
                        className={`text-sm font-medium ${theme === "dark" ? "text-green-300" : "text-green-800"
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
                      getGradientButton("from-blue-600", "to-purple-600") +
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
                className={`flex-shrink-0 transition-colors ${theme === "dark"
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
            color="blue"
            theme={theme}
          />
          <StatCard
            title={t("dashboard.totalClicks")}
            value={stats.totalClicks}
            icon={<MousePointerClick className="w-6 h-6" />}
            color="green"
            theme={theme}
          />
          <StatCard
            title={t("dashboard.conversions")}
            value={stats.totalConversions}
            icon={<TrendingUp className="w-6 h-6" />}
            color="purple"
            theme={theme}
          />
          <StatCard
            title={t("dashboard.totalReach")}
            value={stats.totalReach}
            icon={<Users className="w-6 h-6" />}
            color="orange"
            theme={theme}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <StatCard
            title={t("dashboard.totalEngagement")}
            value={stats.totalEngagement}
            icon={<Heart className="w-6 h-6" />}
            color="red"
            theme={theme}
          />
          <StatCard
            title={t("dashboard.avgEngagementRate")}
            value={stats.avgEngagementRate.toFixed(2)}
            icon={<TrendingUp className="w-6 h-6" />}
            color="purple"
            format="percentage"
            theme={theme}
          />
        </div>

        {/* Publication Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-8">
          {[
            { key: 'draft', label: 'Drafts', color: 'gray', icon: FileText },
            { key: 'pending_review', label: 'Pending Review', color: 'orange', icon: Eye },
            { key: 'approved', label: 'Approved', color: 'purple', icon: Sparkles },
            { key: 'publishing', label: 'Publishing', color: 'blue', icon: TrendingUp },
            { key: 'published', label: 'Published', color: 'green', icon: Target },
            { key: 'failed', label: 'Failed', color: 'red', icon: X },
          ].map((status) => (
            <div
              key={status.key}
              className={`p-3 sm:p-4 rounded-lg border flex flex-col items-center text-center transition-all ${theme === "dark"
                ? "bg-neutral-800/50 border-neutral-700"
                : "bg-white border-gray-100 shadow-sm"
                }`}
            >
              <div className={`p-1.5 sm:p-2 rounded-full mb-1.5 sm:mb-2 ${theme === "dark" ? `bg-${status.color}-900/20` : `bg-${status.color}-50`
                }`}>
                <status.icon className={`w-3 h-3 sm:w-4 sm:h-4 text-${status.color}-500`} />
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1">{status.label}</p>
              <p className={`text-lg sm:text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {loadingPubStats ? '...' : pubStats[status.key] || 0}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {stats.engagementTrends.length > 0 && (
            <div
              className={`rounded-lg p-6 shadow-sm transition-colors duration-300 ${getCardBg()}`}
            >
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${getTextColor(
                  "title"
                )}`}
              >
                <div
                  className={`p-2 rounded-lg ${theme === "dark" ? "bg-purple-900/20" : "bg-purple-100"
                    }`}
                >
                  <TrendingUp
                    className={`w-5 h-5 ${theme === "dark" ? "text-purple-400" : "text-purple-600"
                      }`}
                  />
                </div>
                {t("dashboard.engagementTrends")}
              </h2>
              <LineChart
                data={stats.engagementTrends}
                lines={[
                  {
                    dataKey: "views",
                    name: t("dashboard.views"),
                    color: theme === "dark" ? "#60a5fa" : "#3b82f6",
                  },
                  {
                    dataKey: "clicks",
                    name: t("dashboard.clicks"),
                    color: theme === "dark" ? "#34d399" : "#10b981",
                  },
                  {
                    dataKey: "engagement",
                    name: t("dashboard.engagement"),
                    color: theme === "dark" ? "#a78bfa" : "#8b5cf6",
                  },
                ]}
                xAxisKey="date"
                height={300}
              />
            </div>
          )}

          {stats.platformData.length > 0 && (
            <div
              className={`rounded-lg p-6 shadow-sm transition-colors duration-300 ${getCardBg()}`}
            >
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${getTextColor(
                  "title"
                )}`}
              >
                <div
                  className={`p-2 rounded-lg ${theme === "dark" ? "bg-primary-900/20" : "bg-primary-100"
                    }`}
                >
                  <Target
                    className={`w-5 h-5 ${theme === "dark" ? "text-primary-400" : "text-primary-600"
                      }`}
                  />
                </div>
                {t("dashboard.followersByPlatform")}
              </h2>
              <PieChart
                data={stats.platformData}
                innerRadius={60}
                height={300}
                theme={theme}
              />
            </div>
          )}
        </div>

        {campaignChartData.length > 0 && (
          <div
            className={`rounded-lg p-6 shadow-sm transition-colors duration-300 mb-8 ${getCardBg()}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className={`text-xl font-bold ${getTextColor(
                  "title"
                )} flex items-center gap-2`}
              >
                <div
                  className={`p-2 rounded-lg ${theme === "dark" ? "bg-blue-900/20" : "bg-blue-100"
                    }`}
                >
                  <BarChart3
                    className={`w-5 h-5 ${theme === "dark" ? "text-blue-400" : "text-blue-600"
                      }`}
                  />
                </div>
                {t("dashboard.campaignPerformance")}
              </h2>
              <Link
                href="/campaigns"
                className={`text-sm font-medium flex items-center gap-1 transition-colors ${theme === "dark"
                  ? "text-blue-400 hover:text-blue-300"
                  : "text-blue-600 hover:text-blue-700"
                  }`}
              >
                {t("common.viewAll")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <BarChart
              data={campaignChartData}
              bars={[
                {
                  dataKey: "views",
                  name: t("dashboard.views"),
                  color: theme === "dark" ? "#60a5fa" : "#3b82f6",
                },
                {
                  dataKey: "clicks",
                  name: t("dashboard.clicks"),
                  color: theme === "dark" ? "#34d399" : "#10b981",
                },
                {
                  dataKey: "engagement",
                  name: t("dashboard.engagement"),
                  color: theme === "dark" ? "#a78bfa" : "#8b5cf6",
                },
              ]}
              xAxisKey="name"
              height={350}
              theme={theme}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/campaigns"
            className={`group relative overflow-hidden rounded-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${theme === "dark"
              ? "bg-gradient-to-r from-blue-900/40 to-blue-800/40 border border-blue-800/30"
              : "bg-gradient-to-r from-blue-500 to-blue-600"
              }`}
          >
            <div
              className={`p-3 rounded-lg inline-block mb-4 ${theme === "dark" ? "bg-blue-900/30" : "bg-white/20"
                }`}
            >
              <Calendar
                className={`w-6 h-6 ${theme === "dark" ? "text-blue-400" : "text-white"
                  }`}
              />
            </div>
            <h3
              className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-white"
                }`}
            >
              {t("dashboard.quickActions.campaigns.title")}
            </h3>
            <p
              className={`text-sm ${theme === "dark" ? "text-blue-300/80" : "text-blue-100"
                }`}
            >
              {t("dashboard.quickActions.campaigns.description")}
            </p>
            <div
              className={`absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ${theme === "dark"
                ? "bg-gradient-to-r from-transparent via-white/5 to-transparent"
                : "bg-gradient-to-r from-transparent via-white/10 to-transparent"
                }`}
            ></div>
          </Link>

          <Link
            href="/analytics"
            className={`group relative overflow-hidden rounded-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${theme === "dark"
              ? "bg-gradient-to-r from-purple-900/40 to-purple-800/40 border border-purple-800/30"
              : "bg-gradient-to-r from-purple-500 to-purple-600"
              }`}
          >
            <div
              className={`p-3 rounded-lg inline-block mb-4 ${theme === "dark" ? "bg-purple-900/30" : "bg-white/20"
                }`}
            >
              <BarChart3
                className={`w-6 h-6 ${theme === "dark" ? "text-purple-400" : "text-white"
                  }`}
              />
            </div>
            <h3
              className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-white"
                }`}
            >
              {t("dashboard.quickActions.analytics.title")}
            </h3>
            <p
              className={`text-sm ${theme === "dark" ? "text-purple-300/80" : "text-purple-100"
                }`}
            >
              {t("dashboard.quickActions.analytics.description")}
            </p>
            <div
              className={`absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ${theme === "dark"
                ? "bg-gradient-to-r from-transparent via-white/5 to-transparent"
                : "bg-gradient-to-r from-transparent via-white/10 to-transparent"
                }`}
            ></div>
          </Link>

          <Link
            href="/ManageContent"
            className={`group relative overflow-hidden rounded-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${theme === "dark"
              ? "bg-gradient-to-r from-green-900/40 to-green-800/40 border border-green-800/30"
              : "bg-gradient-to-r from-green-500 to-green-600"
              }`}
          >
            <div
              className={`p-3 rounded-lg inline-block mb-4 ${theme === "dark" ? "bg-green-900/30" : "bg-white/20"
                }`}
            >
              <FileText
                className={`w-6 h-6 ${theme === "dark" ? "text-green-400" : "text-white"
                  }`}
              />
            </div>
            <h3
              className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-white"
                }`}
            >
              {t("dashboard.quickActions.content.title")}
            </h3>
            <p
              className={`text-sm ${theme === "dark" ? "text-green-300/80" : "text-green-100"
                }`}
            >
              {t("dashboard.quickActions.content.description")}
            </p>
            <div
              className={`absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ${theme === "dark"
                ? "bg-gradient-to-r from-transparent via-white/5 to-transparent"
                : "bg-gradient-to-r from-transparent via-white/10 to-transparent"
                }`}
            ></div>
          </Link>
        </div>

        {stats.campaigns.length === 0 && (
          <div
            className={`rounded-lg p-12 text-center transition-colors duration-300 ${getCardBg()}`}
          >
            <div className="max-w-md mx-auto">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === "dark" ? "bg-blue-900/30" : "bg-blue-100"
                  }`}
              >
                <TrendingUp
                  className={`w-8 h-8 ${theme === "dark" ? "text-blue-400" : "text-blue-600"
                    }`}
                />
              </div>
              <h3
                className={`text-xl font-semibold mb-2 ${getTextColor(
                  "title"
                )}`}
              >
                {t("dashboard.emptyState.title")}
              </h3>
              <p className={`mb-6 ${getTextColor("secondary")}`}>
                {t("dashboard.emptyState.message")}
              </p>
              <code
                className={`px-4 py-2 rounded text-sm font-mono ${theme === "dark"
                  ? "bg-neutral-800 text-gray-300"
                  : "bg-gray-100 text-gray-700"
                  }`}
              >
                {t("dashboard.emptyState.command")}
              </code>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
