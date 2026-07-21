import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, CalendarDays, Clock, Lightbulb, Share2, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { route } from 'ziggy-js';

interface Insight {
  type: 'best_hour' | 'best_weekday' | 'best_platform' | 'best_format' | 'week_trend';
  value: string | number | null;
  label?: string;
  sample_size?: number;
  avg_engagement?: number;
  this_week?: number;
  previous_week?: number;
}

interface InsightsResponse {
  has_data: boolean;
  sample_size: number;
  insights: Insight[];
}

const WEEKDAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function useInsights() {
  return useQuery<InsightsResponse>({
    queryKey: ['publishing-insights'],
    queryFn: () =>
      axios
        .get(route('api.v1.analytics.insights'))
        .then((r) => r.data.data ?? r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export default function PublishingInsightsCard() {
  const { t } = useTranslation();
  const { data, isPending, error } = useInsights();

  if (isPending || error || !data || !data.has_data || data.insights.length === 0) {
    return null; // the card earns its space only when there is something to say
  }

  const items = data.insights
    .map((insight) => {
      switch (insight.type) {
        case 'best_hour':
          return {
            icon: Clock,
            text: t('analytics.insights.bestHour', {
              hour: insight.label,
              defaultValue: 'Your audience responds best around {{hour}} — schedule your next post then.',
            }),
          };
        case 'best_weekday': {
          const day = t(`analytics.insights.weekdays.${WEEKDAY_KEYS[(insight.value as number) - 1]}`);
          return {
            icon: CalendarDays,
            text: t('analytics.insights.bestWeekday', {
              day,
              defaultValue: '{{day}} is your strongest day for engagement.',
            }),
          };
        }
        case 'best_platform':
          return {
            icon: Share2,
            text: t('analytics.insights.bestPlatform', {
              platform: insight.value,
              defaultValue: '{{platform}} drives your highest engagement per post.',
            }),
          };
        case 'best_format':
          return {
            icon: BarChart3,
            text: t('analytics.insights.bestFormat', {
              format: insight.value,
              defaultValue: 'Your best-performing format is {{format}} — lean into it.',
            }),
          };
        case 'week_trend': {
          if (insight.value === null) return null;
          const up = (insight.value as number) >= 0;
          return {
            icon: up ? TrendingUp : TrendingDown,
            text: up
              ? t('analytics.insights.trendUp', {
                  percent: insight.value,
                  defaultValue: 'You published {{percent}}% more than last week. Keep the rhythm!',
                })
              : t('analytics.insights.trendDown', {
                  percent: Math.abs(insight.value as number),
                  defaultValue: 'Publishing dropped {{percent}}% vs last week — a quick post today keeps you visible.',
                }),
          };
        }
        default:
          return null;
      }
    })
    .filter(Boolean) as { icon: typeof Clock; text: string }[];

  if (items.length === 0) return null;

  return (
    <div className="mb-8 rounded-lg border border-primary-200/60 bg-gradient-to-r from-primary-50/60 to-white p-6 shadow-sm dark:border-primary-800/40 dark:from-primary-900/10 dark:to-neutral-900">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('analytics.insights.title', 'Recommendations for you')}
        </h2>
        <span className="ml-auto text-xs text-gray-400 dark:text-neutral-500">
          {t('analytics.insights.basedOn', {
            count: data.sample_size,
            defaultValue: 'Based on your last {{count}} posts',
          })}
        </span>
      </div>

      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <li key={index} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
              <span className="text-sm text-gray-700 dark:text-neutral-300">{item.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
