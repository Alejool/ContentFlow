import StatCard from "@/Components/Statistics/StatCard";
import Skeleton from "@/Components/common/ui/Skeleton";
import { useTheme } from "@/Hooks/useTheme";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { Eye, Heart, MousePointer2, TrendingUp, Users } from "lucide-react";
import { Suspense, lazy, useState } from "react";
import { useTranslation } from "react-i18next";
import EmptyState from "../../Components/Analytics/EmptyState";
import { CampaignStat } from "../../Components/Analytics/PerformanceTable";
import PeriodSelector from "../../Components/Analytics/PeriodSelector";

const EngagementChart = lazy(
  () => import("@/Components/Statistics/EngagementChart"),
);
const CampaignPerformance = lazy(
  () => import("../../Components/Analytics/CampaignPerformance"),
);
const SocialMediaAccounts = lazy(
  () => import("../../Components/Analytics/SocialMediaAccounts"),
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
  };
  period: number;
}

export default function Index({ stats, period }: AnalyticsProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const overview = stats?.overview || {};
  const campaigns = stats?.campaigns || [];
  const socialMedia = stats?.social_media || [];
  const engagementTrends = stats?.engagement_trends || [];

  const handlePeriodChange = (days: number) => {
    setLoading(true);
    router.get(
      route("analytics.index"),
      { days },
      {
        preserveState: true,
        preserveScroll: true,
        only: ["stats", "period"],
        onFinish: () => setLoading(false),
      },
    );
  };

  return (
    <AuthenticatedLayout>
      <Head title={t("analytics.title")} />

      <div
        className={`py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-colors duration-300
                ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}
      >
        <div
          className={`rounded-lg p-8 mb-8 shadow-sm transition-colors duration-300 flex flex-col md:flex-row items-center justify-between gap-6 ${
            theme === "dark"
              ? "bg-gradient-to-r from-neutral-800/50 to-purple-900/90 border border-neutral-700/50"
              : "bg-gradient-to-r from-white to-gray-50 border border-gray-100"
          }`}
        >
          <div>
            <h1
              className={`text-3xl font-bold mb-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {t("analytics.title")}
            </h1>
            <p
              className={`text-lg ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {t("analytics.subtitle")}
            </p>
          </div>

          <PeriodSelector
            selectedPeriod={Number(period)}
            onPeriodChange={handlePeriodChange}
            theme={theme}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t("analytics.stats.totalViews")}
            value={overview.total_views || 0}
            change={overview.changes?.views}
            icon={<Eye className="w-6 h-6" />}
            color="primary"
            variant={1}
            theme={theme}
          />
          <StatCard
            title={t("analytics.stats.totalClicks")}
            value={overview.total_clicks || 0}
            change={overview.changes?.clicks}
            icon={<MousePointer2 className="w-6 h-6" />}
            color="primary"
            variant={2}
            theme={theme}
          />
          <StatCard
            title={t("analytics.stats.conversions")}
            value={overview.total_conversions || 0}
            change={overview.changes?.conversions}
            icon={<TrendingUp className="w-6 h-6" />}
            color="primary"
            variant={3}
            theme={theme}
          />
          <StatCard
            title={t("analytics.stats.totalReach")}
            value={overview.total_reach || 0}
            change={overview.changes?.engagement}
            icon={<Users className="w-6 h-6" />}
            color="primary"
            variant={4}
            theme={theme}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t("analytics.stats.avgEngagementRate")}
            value={overview.avg_engagement_rate || 0}
            icon={<Heart className="w-6 h-6" />}
            format="percentage"
            color="primary"
            variant={1}
            theme={theme}
          />
          <StatCard
            title={t("analytics.stats.avgCtr")}
            value={overview.avg_ctr || 0}
            icon={<MousePointer2 className="w-6 h-6" />}
            format="percentage"
            color="primary"
            variant={2}
            theme={theme}
          />
          <StatCard
            title={t("analytics.stats.avgConversionRate")}
            value={overview.avg_conversion_rate || 0}
            icon={<TrendingUp className="w-6 h-6" />}
            format="percentage"
            color="primary"
            variant={3}
            theme={theme}
          />
          <StatCard
            title={t("analytics.stats.totalEngagement")}
            value={overview.total_engagement || 0}
            icon={<Heart className="w-6 h-6" />}
            color="primary"
            variant={4}
            theme={theme}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">
          <div
            className={`rounded-lg p-6 transition-colors duration-300
                        ${
                          theme === "dark"
                            ? "bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50"
                            : "bg-white shadow-lg border border-gray-100"
                        }`}
          >
            <h2
              className={`text-xl font-bold mb-4
                            ${
                              theme === "dark"
                                ? "text-gray-100"
                                : "text-gray-900"
                            }`}
            >
              {t("analytics.charts.engagementTrends")}
            </h2>
            <Suspense
              fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}
            >
              <EngagementChart data={engagementTrends} theme={theme as any} />
            </Suspense>
          </div>
        </div>

        {campaigns.length > 0 && (
          <Suspense
            fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}
          >
            <CampaignPerformance campaigns={campaigns} theme={theme} />
          </Suspense>
        )}

        {socialMedia.length > 0 && (
          <div className="mb-8">
            <Suspense
              fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}
            >
              <SocialMediaAccounts
                accounts={socialMedia}
                theme={theme}
                showChart={true}
              />
            </Suspense>
          </div>
        )}

        {campaigns.length === 0 && socialMedia.length === 0 && (
          <EmptyState
            theme={theme}
            title={t("analytics.emptyState.title")}
            description={t("analytics.emptyState.description")}
          />
        )}
      </div>
    </AuthenticatedLayout>
  );
}
