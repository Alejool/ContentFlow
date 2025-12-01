// Pages/Dashboard.tsx
import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import StatCard from "@/Components/Statistics/StatCard";
import LineChart from "@/Components/Statistics/LineChart";
import BarChart from "@/Components/Statistics/BarChart";
import PieChart from "@/Components/Statistics/PieChart";
import ContentFlowVisualization3D from "@/Components/tree/ContentFlowVisualization3D";
import {
  Eye,
  MousePointerClick,
  TrendingUp,
  Users,
  Heart,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface DashboardProps {
  auth: {
    user: {
      name: string;
      email: string;
    };
  };
  stats: {
    totalViews: number;
    totalClicks: number;
    totalConversions: number;
    totalReach: number;
    totalEngagement: number;
    avgEngagementRate: number;
    campaigns: Array<{
      id: number;
      title: string;
      views: number;
      clicks: number;
      engagement: number;
    }>;
    engagementTrends: Array<{
      date: string;
      views: number;
      clicks: number;
      engagement: number;
    }>;
    platformData: Array<{
      name: string;
      value: number;
    }>;
  };
}

export default function Dashboard({ auth, stats }: DashboardProps) {
  const { t } = useTranslation();

  // Prepare chart data
  const campaignChartData = stats.campaigns.map((c) => ({
    name: c.title.length > 15 ? c.title.substring(0, 15) + "..." : c.title,
    views: c.views,
    clicks: c.clicks,
    engagement: c.engagement,
  }));

  return (
    <AuthenticatedLayout>
      <Head title={t("dashboard.title")} />

      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("dashboard.welcomeMessage", { name: auth.user.name })}
          </h1>
          <p className="mt-2 text-gray-600">{t("dashboard.systemStats")}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t("dashboard.totalViews")}
            value={stats.totalViews}
            icon={<Eye className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title={t("dashboard.totalClicks")}
            value={stats.totalClicks}
            icon={<MousePointerClick className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title={t("dashboard.conversions")}
            value={stats.totalConversions}
            icon={<TrendingUp className="w-6 h-6" />}
            color="purple"
          />
          <StatCard
            title={t("dashboard.totalReach")}
            value={stats.totalReach}
            icon={<Users className="w-6 h-6" />}
            color="orange"
          />
        </div>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            title={t("dashboard.totalEngagement")}
            value={stats.totalEngagement}
            icon={<Heart className="w-6 h-6" />}
            color="red"
          />
          <StatCard
            title={t("dashboard.avgEngagementRate")}
            value={stats.avgEngagementRate.toFixed(2)}
            icon={<TrendingUp className="w-6 h-6" />}
            color="purple"
            format="percentage"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Engagement Trends */}
          {stats.engagementTrends.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {t("dashboard.engagementTrends")}
              </h2>
              <LineChart
                data={stats.engagementTrends}
                lines={[
                  {
                    dataKey: "views",
                    name: t("dashboard.views"),
                    color: "#3b82f6",
                  },
                  {
                    dataKey: "clicks",
                    name: t("dashboard.clicks"),
                    color: "#10b981",
                  },
                  {
                    dataKey: "engagement",
                    name: t("dashboard.engagement"),
                    color: "#8b5cf6",
                  },
                ]}
                xAxisKey="date"
                height={300}
              />
            </div>
          )}

          {/* Platform Distribution */}
          {stats.platformData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {t("dashboard.followersByPlatform")}
              </h2>
              <PieChart
                data={stats.platformData}
                innerRadius={60}
                height={300}
              />
            </div>
          )}
        </div>

        {/* Campaign Performance */}
        {campaignChartData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {t("dashboard.campaignPerformance")}
              </h2>
              <Link
                href="/campaigns"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
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
                  color: "#3b82f6",
                },
                {
                  dataKey: "clicks",
                  name: t("dashboard.clicks"),
                  color: "#10b981",
                },
                {
                  dataKey: "engagement",
                  name: t("dashboard.engagement"),
                  color: "#8b5cf6",
                },
              ]}
              xAxisKey="name"
              height={350}
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/campaigns"
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white hover:shadow-xl transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">
              {t("dashboard.quickActions.campaigns.title")}
            </h3>
            <p className="text-blue-100 text-sm">
              {t("dashboard.quickActions.campaigns.description")}
            </p>
          </Link>
          <Link
            href="/analytics"
            className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white hover:shadow-xl transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">
              {t("dashboard.quickActions.analytics.title")}
            </h3>
            <p className="text-purple-100 text-sm">
              {t("dashboard.quickActions.analytics.description")}
            </p>
          </Link>
          <Link
            href="/manage-content"
            className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white hover:shadow-xl transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">
              {t("dashboard.quickActions.content.title")}
            </h3>
            <p className="text-green-100 text-sm">
              {t("dashboard.quickActions.content.description")}
            </p>
          </Link>
        </div>

        {/* Empty State */}
        {stats.campaigns.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center mt-8">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("dashboard.emptyState.title")}
              </h3>
              <p className="text-gray-600 mb-6">
                {t("dashboard.emptyState.message")}
              </p>
              <code className="bg-gray-100 px-4 py-2 rounded text-sm">
                {t("dashboard.emptyState.command")}
              </code>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
