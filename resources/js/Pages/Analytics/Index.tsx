import EngagementChart from "@/Components/Statistics/EngagementChart";
import PieChart from "@/Components/Statistics/PieChart";
import StatCard from "@/Components/Statistics/StatCard";
import { useTheme } from "@/Hooks/useTheme";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Eye, Heart, MousePointerClick, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import CampaignPerformance from "../../Components/Analytics/CampaignPerformance";
import EmptyState from "../../Components/Analytics/EmptyState";
import PeriodSelector from "../../Components/Analytics/PeriodSelector";
import SocialMediaAccounts from "../../Components/Analytics/SocialMediaAccounts";

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

interface Campaign {
  title: string;
  total_engagement: number;
  total_views: number;
  total_clicks: number;
}

interface SocialMediaAccount {
  platform: string;
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
    campaigns: Campaign[];
    social_media: SocialMediaAccount[];
    engagement_trends: EngagementTrend[];
  };
  period: number;
}

export default function Index({ stats, period }: AnalyticsProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState(period || 30);
  const [loading, setLoading] = useState(false);

  const overview = stats?.overview || {};
  const campaigns = stats?.campaigns || [];
  const socialMedia = stats?.social_media || [];
  const engagementTrends = stats?.engagement_trends || [];

  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days);
  };

  return (
    <AuthenticatedLayout>
      <Head title={t("analytics.title")} />

      <div
        className={`py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-colors duration-300
                ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t("analytics.title")}</h1>
          <p
            className={`mt-2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {t("analytics.subtitle")}
          </p>
        </div>

        <PeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t("analytics.stats.totalViews")}
            value={overview.total_views || 0}
            change={overview.changes?.views}
            icon={<Eye className="w-6 h-6" />}
            theme={theme}
          />
          <StatCard
            title={t("analytics.stats.totalClicks")}
            value={overview.total_clicks || 0}
            change={overview.changes?.clicks}
            icon={<MousePointerClick className="w-6 h-6" />}
            theme={theme}
          />
          <StatCard
            title={t("analytics.stats.conversions")}
            value={overview.total_conversions || 0}
            change={overview.changes?.conversions}
            icon={<TrendingUp className="w-6 h-6" />}
            theme={theme}
          />
          <StatCard
            title={t("analytics.stats.totalReach")}
            value={overview.total_reach || 0}
            change={overview.changes?.engagement}
            icon={<Users className="w-6 h-6" />}
            theme={theme}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t("analytics.stats.avgEngagementRate")}
            value={overview.avg_engagement_rate || 0}
            icon={<Heart className="w-6 h-6" />}
            format="percentage"
            theme={theme}
          />
          <StatCard
            title={t("analytics.stats.avgCtr")}
            value={overview.avg_ctr || 0}
            icon={<MousePointerClick className="w-6 h-6" />}
            format="percentage"
            theme={theme}
          />
          <StatCard
            title={t("analytics.stats.avgConversionRate")}
            value={overview.avg_conversion_rate || 0}
            icon={<TrendingUp className="w-6 h-6" />}
            format="percentage"
            theme={theme}
          />
          <StatCard
            title={t("analytics.stats.totalEngagement")}
            value={overview.total_engagement || 0}
            icon={<Heart className="w-6 h-6" />}
            theme={theme}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
            <EngagementChart data={engagementTrends} theme={theme} />
          </div>

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
              {t("analytics.charts.followersByPlatform")}
            </h2>
            {socialMedia.length > 0 ? (
              <PieChart
                data={socialMedia.map((sm) => ({
                  name:
                    sm.platform.charAt(0).toUpperCase() + sm.platform.slice(1),
                  value: sm.followers,
                }))}
                theme={theme}
              />
            ) : (
              <div
                className={`flex items-center justify-center h-[300px] 
                                ${
                                  theme === "dark"
                                    ? "text-gray-400"
                                    : "text-gray-500"
                                }`}
              >
                {t("analytics.charts.noSocialMedia")}
              </div>
            )}
          </div>
        </div>

        {campaigns.length > 0 && (
          <CampaignPerformance campaigns={campaigns} theme={theme} />
        )}

        {socialMedia.length > 0 && (
          <SocialMediaAccounts accounts={socialMedia} theme={theme} />
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
