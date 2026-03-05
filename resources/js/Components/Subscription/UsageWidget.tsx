import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Progress } from '@/Components/ui/progress';
import Button from '@/Components/common/Modern/Button';
import { Badge } from '@/Components/ui/badge';
import { Link } from '@inertiajs/react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UsageMetric {
  type: string;
  current: number;
  limit: number;
  percentage: number;
}

interface Props {
  plan: string;
  usage: UsageMetric[];
  className?: string;
}

export default function UsageWidget({ plan, usage, className }: Props) {
  const { t } = useTranslation();

  const getMetricName = (type: string) => {
    return t(`subscription:usage.${type}`, type);
  };

  const formatLimit = (limit: number, type: string) => {
    if (limit === -1) return '∞';
    if (type === 'storage') return `${limit} GB`;
    return limit.toString();
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'demo':
        return 'bg-purple-100 text-purple-800';
      case 'free':
        return 'bg-gray-100 text-gray-800';
      case 'starter':
        return 'bg-blue-100 text-blue-800';
      case 'professional':
        return 'bg-yellow-100 text-yellow-800';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const hasNearLimitMetrics = usage.some((m) => m.percentage >= 80);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('subscription.usage.planUsage')}</CardTitle>
            <CardDescription>{t('subscription.usage.monitorConsumption')}</CardDescription>
          </div>
          <Badge className={getPlanColor(plan)}>
            {plan.charAt(0).toUpperCase() + plan.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {usage.slice(0, 3).map((metric) => {
          const isNearLimit = metric.percentage >= 80;
          const isAtLimit = metric.percentage >= 100;

          return (
            <div key={metric.type} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{getMetricName(metric.type)}</span>
                <span className="text-gray-600">
                  {metric.current} / {formatLimit(metric.limit, metric.type)}
                </span>
              </div>
              <Progress
                value={Math.min(metric.percentage, 100)}
                className={`h-2 ${
                  isAtLimit
                    ? '[&>div]:bg-red-500'
                    : isNearLimit
                    ? '[&>div]:bg-yellow-500'
                    : '[&>div]:bg-green-500'
                }`}
              />
              {isAtLimit && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>{t('subscription.usage.limitReached')}</span>
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-4 space-y-2">
          <Link href="/subscription/usage">
            <Button variant="outline" className="w-full" size="sm">
              {t('subscription.usage.viewFullDetails')}
            </Button>
          </Link>

          {(plan === 'free' || plan === 'demo' || hasNearLimitMetrics) && (
            <Link href="/pricing">
              <Button className="w-full" size="sm">
                <TrendingUp className="mr-2 h-4 w-4" />
                {t('subscription.usage.upgradePlan')}
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
