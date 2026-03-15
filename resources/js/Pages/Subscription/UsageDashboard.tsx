import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Progress } from '@/Components/ui/progress';
import Button from '@/Components/common/Modern/Button';
import { Badge } from '@/Components/ui/badge';
import { AlertCircle, TrendingUp, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/Utils/i18nHelpers';

interface UsageMetric {
  type: string;
  current: number;
  limit: number;
  percentage: number;
  remaining: number;
}

interface Subscription {
  plan: string;
  status: string;
  trial_ends_at: string | null;
}

interface Props {
  subscription: Subscription;
  usage: UsageMetric[];
}

export default function UsageDashboard({ subscription, usage }: Props) {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (plan: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'free':
        return 'secondary';
      case 'starter':
        return 'default';
      case 'professional':
        return 'default';
      case 'enterprise':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'publications':
        return '📝';
      case 'storage':
        return '💾';
      case 'ai_requests':
        return '🤖';
      default:
        return '📊';
    }
  };

  const getMetricName = (type: string) => {
    switch (type) {
      case 'publications':
        return t('subscription.usage.publications');
      case 'storage':
        return t('subscription.usage.storage');
      case 'ai_requests':
        return t('subscription.usage.aiRequests');
      default:
        return type;
    }
  };

  const formatLimit = (limit: number, type: string) => {
    if (limit === -1) return '∞';
    if (type === 'storage') return `${limit} GB`;
    return limit.toString();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('subscription.usage.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subscription.usage.description')}</p>
        </div>
        <Badge variant={getPlanBadgeColor(subscription.plan)} className="px-4 py-2 text-lg">
          {t('subscription.billing.plan')}{' '}
          {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
        </Badge>
      </div>

      {/* Trial Alert */}
      {subscription.status === 'trialing' && subscription.trial_ends_at && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('subscription.usage.trialEndsOn')}{' '}
            <strong>{formatDate(subscription.trial_ends_at, 'long', i18n.language)}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {usage.map((metric) => {
          const isNearLimit = metric.percentage >= 80;
          const isAtLimit = metric.percentage >= 100;

          return (
            <Card key={metric.type} className={isAtLimit ? 'border-red-500' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{getMetricIcon(metric.type)}</span>
                  {getMetricName(metric.type)}
                </CardTitle>
                <CardDescription>
                  {metric.current} / {formatLimit(metric.limit, metric.type)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress
                  value={Math.min(metric.percentage, 100)}
                  className={`h-2 ${
                    isAtLimit ? 'bg-red-100' : isNearLimit ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}
                />

                {isAtLimit && (
                  <Alert variant="destructive">
                    <AlertDescription className="text-sm">
                      {t('subscription.usage.atLimit')}
                    </AlertDescription>
                  </Alert>
                )}

                {isNearLimit && !isAtLimit && (
                  <Alert>
                    <AlertDescription className="text-sm">
                      {t('subscription.usage.nearLimit')} ({Math.round(metric.percentage)}%)
                    </AlertDescription>
                  </Alert>
                )}

                {(isNearLimit || isAtLimit) && subscription.plan !== 'enterprise' && (
                  <Button
                    onClick={() => handleUpgrade('professional')}
                    className="w-full"
                    variant="default"
                    disabled={isLoading}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    {t('subscription.usage.upgradePlan')}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upgrade Section */}
      {subscription.plan === 'free' && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              {t('subscription.usage.upgrade')}
            </CardTitle>
            <CardDescription>{t('subscription.usage.upgradeDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={() => handleUpgrade('starter')} variant="default" disabled={isLoading}>
              {t('pricing.plans.starter.name')} - $19/
              {t('pricing.billing.month')}
            </Button>
            <Button
              onClick={() => handleUpgrade('professional')}
              variant="default"
              disabled={isLoading}
            >
              {t('pricing.plans.professional.name')} - $49/
              {t('pricing.billing.month')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
