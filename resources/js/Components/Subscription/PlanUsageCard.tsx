import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Progress } from '@/Components/ui/progress';
import { FileText, HardDrive, TrendingUp, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UsageMetric {
  type: string;
  current: number;
  limit: number;
  percentage: number;
  remaining: number;
}

interface PlanUsageCardProps {
  usage: UsageMetric[];
  className?: string;
}

export default function PlanUsageCard({ usage, className = '' }: PlanUsageCardProps) {
  const { t } = useTranslation();

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'publications':
        return <FileText className="h-4 w-4" />;
      case 'storage':
        return <HardDrive className="h-4 w-4" />;
      case 'team_members':
        return <Users className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getMetricName = (type: string) => {
    return t(`subscription.usage.${type}`, type);
  };

  const formatLimit = (limit: number, type: string) => {
    if (limit === -1) return t('subscription.usage.unlimited', '∞');
    if (type === 'storage') return `${limit} GB`;
    return limit.toString();
  };

  if (!usage || usage.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t('subscription.usage.currentUsage', 'Uso Actual')}
        </CardTitle>
        <CardDescription>
          {t('subscription.usage.description', 'Monitorea tu uso y gestiona tu suscripción')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {usage.map((metric) => (
            <div
              key={metric.type}
              className="rounded-lg border border-gray-200 p-4 dark:border-neutral-700"
            >
              <div className="mb-2 flex items-center gap-2">
                {getMetricIcon(metric.type)}
                <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                  {getMetricName(metric.type)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metric.current}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-neutral-400">
                    / {formatLimit(metric.limit, metric.type)}
                  </span>
                </div>
                <Progress
                  value={Math.min(metric.percentage, 100)}
                  className={`h-2 ${
                    metric.percentage >= 100
                      ? '[&>div]:bg-red-500'
                      : metric.percentage >= 80
                        ? '[&>div]:bg-yellow-500'
                        : '[&>div]:bg-green-500'
                  }`}
                />
                <p className="text-xs text-gray-600 dark:text-neutral-400">
                  {metric.remaining === -1
                    ? t('subscription.usage.unlimited', 'Ilimitado')
                    : `${metric.remaining} ${t('subscription.usage.remaining', 'restante')}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
