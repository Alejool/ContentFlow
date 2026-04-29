import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

export interface RecentActivity {
  key: string;
  label: string;
  category: string;
  value: boolean | string | number;
  updated_at: string;
  updated_by: string;
}

interface AdminRecentActivityProps {
  recentActivity: RecentActivity[];
}

function categoryDot(category: string) {
  const map: Record<string, string> = {
    plans: 'bg-blue-500',
    addons: 'bg-purple-500',
    features: 'bg-green-500',
    integrations: 'bg-orange-500',
    payment_methods: 'bg-pink-500',
    general: 'bg-gray-500',
  };
  return map[category] ?? 'bg-gray-400';
}

export default function AdminRecentActivity({ recentActivity = [] }: AdminRecentActivityProps) {
  const { t } = useTranslation();

  return (
    <Card className="mt-2 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100">
          {t('admin.dashboard.recent_activity')}
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Latest system settings changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentActivity.length === 0 ? (
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            No settings have been modified yet
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${categoryDot(item.category)}`}
                />
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {item.label || item.key}
                  </span>
                  <span className="mx-1 text-gray-400">→</span>
                  <span
                    className={
                      item.value === true
                        ? 'font-semibold text-green-600 dark:text-green-400'
                        : item.value === false
                          ? 'font-semibold text-red-500 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                    }
                  >
                    {String(item.value)}
                  </span>
                </div>
                <div className="shrink-0 text-right text-xs text-gray-400 dark:text-gray-500">
                  <div>{item.updated_by}</div>
                  <div>{formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
