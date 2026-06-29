import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AdminSubscriptionsByPlanProps {
  subscriptionsByPlan?: Record<string, number> | undefined;
}

export default function AdminSubscriptionsByPlan({ subscriptionsByPlan }: AdminSubscriptionsByPlanProps) {
  const { t } = useTranslation();

  if (!subscriptionsByPlan || Object.keys(subscriptionsByPlan).length === 0) {
    return null;
  }

  return (
    <Card className="border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-neutral-100">
          <Database className="h-4 w-4 text-green-500" />
          {t('admin.dashboard.subscriptions_by_plan')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {Object.entries(subscriptionsByPlan).map(([plan, count]) => (
            <div
              key={plan}
              className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 dark:bg-neutral-700"
            >
              <span className="text-sm font-medium capitalize text-gray-700 dark:text-neutral-300">
                {t(`admin.dashboard.plans.${plan}`, plan)}
              </span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                {count}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
