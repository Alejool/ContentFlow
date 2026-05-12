import { queryKeys } from '@/lib/queryKeys';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface AnalyticsOverview {
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

export interface AnalyticsData {
  overview: AnalyticsOverview;
  campaigns: any[];
  social_media: any[];
  engagement_trends: any[];
  detailedPlatforms?: any[];
  detailedPublications?: any[];
}

async function fetchAnalyticsDataFn(period: number): Promise<AnalyticsData> {
  const response = await axios.get(route('analytics.data'), {
    params: { days: period },
  });
  return response.data;
}

/**
 * useAnalyticsData — fetches analytics for a given period.
 * staleTime is long (10 min) since historical data rarely changes.
 * Used to avoid full Inertia page reload when switching periods.
 */
export function useAnalyticsData(period: number, workspaceId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.analyticsData.period(period, workspaceId!),
    queryFn: () => fetchAnalyticsDataFn(period),
    enabled: !!workspaceId,
    staleTime: 10 * 60 * 1000, // 10 min — historical data is stable
    gcTime: 30 * 60 * 1000, // keep 30 min in cache for fast period switching
    placeholderData: (prev) => prev, // show previous period data while loading new one
  });
}
