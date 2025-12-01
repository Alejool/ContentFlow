import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatCard from '@/Components/Statistics/StatCard';
import LineChart from '@/Components/Statistics/LineChart';
import BarChart from '@/Components/Statistics/BarChart';
import PieChart from '@/Components/Statistics/PieChart';
import EngagementChart from '@/Components/Statistics/EngagementChart';
import {
    Eye,
    MousePointerClick,
    TrendingUp,
    Users,
    Heart,
} from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

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
    const [selectedPeriod, setSelectedPeriod] = useState(period || 30);
    const [loading, setLoading] = useState(false);

    const overview = stats?.overview || {};
    const campaigns = stats?.campaigns || [];
    const socialMedia = stats?.social_media || [];
    const engagementTrends = stats?.engagement_trends || [];

    // Platform distribution data for pie chart
    const platformData = socialMedia.map((sm: SocialMediaAccount) => ({
        name: sm.platform.charAt(0).toUpperCase() + sm.platform.slice(1),
        value: sm.followers,
    }));

    // Campaign performance data for bar chart
    const campaignData = campaigns.map((campaign: Campaign) => ({
        name: campaign.title.length > 20 
            ? campaign.title.substring(0, 20) + '...' 
            : campaign.title,
        engagement: campaign.total_engagement,
        views: campaign.total_views,
        clicks: campaign.total_clicks,
    }));

    return (
        <AuthenticatedLayout>
            <Head title={t('analytics.title')} />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {t('analytics.title')}
                    </h1>
                    <p className="mt-2 text-gray-600">
                        {t('analytics.subtitle')}
                    </p>
                </div>

                {/* Period Selector */}
                <div className="mb-6 flex gap-2">
                    {[7, 30, 90].map((days) => (
                        <button
                            key={days}
                            onClick={() => setSelectedPeriod(days)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                selectedPeriod === days
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {days} {t('analytics.days')}
                        </button>
                    ))}
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title={t('analytics.stats.totalViews')}
                        value={overview.total_views || 0}
                        change={overview.changes?.views}
                        icon={<Eye className="w-6 h-6" />}
                        color="blue"
                    />
                    <StatCard
                        title={t('analytics.stats.totalClicks')}
                        value={overview.total_clicks || 0}
                        change={overview.changes?.clicks}
                        icon={<MousePointerClick className="w-6 h-6" />}
                        color="green"
                    />
                    <StatCard
                        title={t('analytics.stats.conversions')}
                        value={overview.total_conversions || 0}
                        change={overview.changes?.conversions}
                        icon={<TrendingUp className="w-6 h-6" />}
                        color="purple"
                    />
                    <StatCard
                        title={t('analytics.stats.totalReach')}
                        value={overview.total_reach || 0}
                        change={overview.changes?.engagement}
                        icon={<Users className="w-6 h-6" />}
                        color="orange"
                    />
                </div>

                {/* Engagement Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title={t('analytics.stats.avgEngagementRate')}
                        value={overview.avg_engagement_rate || 0}
                        icon={<Heart className="w-6 h-6" />}
                        color="red"
                        format="percentage"
                    />
                    <StatCard
                        title={t('analytics.stats.avgCtr')}
                        value={overview.avg_ctr || 0}
                        icon={<MousePointerClick className="w-6 h-6" />}
                        color="blue"
                        format="percentage"
                    />
                    <StatCard
                        title={t('analytics.stats.avgConversionRate')}
                        value={overview.avg_conversion_rate || 0}
                        icon={<TrendingUp className="w-6 h-6" />}
                        color="green"
                        format="percentage"
                    />
                    <StatCard
                        title={t('analytics.stats.totalEngagement')}
                        value={overview.total_engagement || 0}
                        icon={<Heart className="w-6 h-6" />}
                        color="purple"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Engagement Trends */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {t('analytics.charts.engagementTrends')}
                        </h2>
                        <EngagementChart data={engagementTrends} />
                    </div>

                    {/* Platform Distribution */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {t('analytics.charts.followersByPlatform')}
                        </h2>
                        {platformData.length > 0 ? (
                            <PieChart data={platformData} innerRadius={60} />
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-gray-500">
                                {t('analytics.charts.noSocialMedia')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Campaign Performance */}
                {campaignData.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {t('analytics.charts.topCampaignPerformance')}
                        </h2>
                        <BarChart
                            data={campaignData}
                            bars={[
                                { dataKey: 'views', name: t('analytics.charts.views'), color: '#3b82f6' },
                                { dataKey: 'clicks', name: t('analytics.charts.clicks'), color: '#10b981' },
                                { dataKey: 'engagement', name: t('analytics.charts.engagement'), color: '#8b5cf6' },
                            ]}
                            xAxisKey="name"
                            height={350}
                        />
                    </div>
                )}

                {/* Social Media Overview */}
                {socialMedia.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">
                            {t('analytics.socialMedia.title')}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {socialMedia.map((account: any) => (
                                <div
                                    key={account.platform}
                                    className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold capitalize text-gray-900">
                                            {account.platform}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            account.follower_growth_30d > 0
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {account.follower_growth_30d > 0 ? '+' : ''}
                                            {account.follower_growth_30d}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">{t('analytics.socialMedia.followers')}</span>
                                            <span className="font-semibold text-gray-900">
                                                {account.followers.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">{t('analytics.socialMedia.engagementRate')}</span>
                                            <span className="font-semibold text-gray-900">
                                                {account.engagement_rate}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">{t('analytics.socialMedia.reach')}</span>
                                            <span className="font-semibold text-gray-900">
                                                {account.reach.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {campaigns.length === 0 && socialMedia.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <TrendingUp className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {t('analytics.emptyState.title')}
                            </h3>
                            <p className="text-gray-600">
                                {t('analytics.emptyState.description')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
