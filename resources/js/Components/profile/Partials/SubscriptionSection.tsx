import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import Button from '@/Components/common/Modern/Button';
import { Badge } from '@/Components/ui/badge';
import { Progress } from '@/Components/ui/progress';
import { router } from '@inertiajs/react';
import { 
  Crown, 
  Zap, 
  TrendingUp, 
  Calendar, 
  CreditCard,
  ArrowUpCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SubscriptionSectionProps {
  subscription?: {
    plan_name: string;
    plan_id: string;
    status: string;
    current_period_end?: string;
    trial_ends_at?: string;
    is_trial?: boolean;
  };
  usage?: {
    publications_used: number;
    publications_limit: number;
    storage_used: number;
    storage_limit: number;
    ai_requests_used: number;
    ai_requests_limit: number;
  };
}

export default function SubscriptionSection({ subscription, usage }: SubscriptionSectionProps) {
  const { t } = useTranslation();

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
      case 'demo':
        return <Zap className="w-5 h-5" />;
      case 'starter':
        return <TrendingUp className="w-5 h-5" />;
      case 'professional':
      case 'enterprise':
        return <Crown className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'demo':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'starter':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'professional':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'enterprise':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('subscription.status.active')}
          </Badge>
        );
      case 'trialing':
        return (
          <Badge variant="default" className="bg-blue-500">
            <Calendar className="w-3 h-3 mr-1" />
            {t('subscription.status.trialing')}
          </Badge>
        );
      case 'canceled':
      case 'past_due':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            {t('subscription.status.canceled')}
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculatePercentage = (used: number, limit: number) => {
    if (limit === 0 || limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const handleUpgrade = () => {
    router.visit('/pricing');
  };

  const handleManageBilling = () => {
    router.visit('/subscription/billing');
  };

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {t('subscription.billing.title')}
          </CardTitle>
          <CardDescription>
            {t('subscription.billing.noSubscription', 'No tienes una suscripción activa')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleUpgrade} className="w-full">
            {t('subscription.billing.choosePlan', 'Elegir un Plan')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 text-black dark:text-white">
      {/* Plan Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${getPlanColor(subscription.plan_id)}`}>
                {getPlanIcon(subscription.plan_id)}
              </div>
              <div>
                <CardTitle className="text-xl">
                  {subscription.plan_name}
                </CardTitle>
                <CardDescription>
                  {subscription.is_trial
                    ? t('subscription.usage.trialEndsOn', 'Plan de prueba')
                    : t('subscription.billing.currentPlan')}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(subscription.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Trial or Renewal Date */}
          {subscription.trial_ends_at && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {t('subscription.usage.trialEndsOn')}: {formatDate(subscription.trial_ends_at)}
              </span>
            </div>
          )}
          
          {subscription.current_period_end && !subscription.is_trial && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('subscription.billing.renewsOn')}: {formatDate(subscription.current_period_end)}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {subscription.plan_id !== 'enterprise' && (
              <Button 
                onClick={handleUpgrade} 
                className="flex-1"
                variant="primary"
                icon={ArrowUpCircle}
                iconPosition="left"
              >
                {t('subscription.usage.upgradePlan')}
              </Button>
            )}
            {subscription.plan_id !== 'free' && subscription.plan_id !== 'demo' && (
              <Button 
                onClick={handleManageBilling} 
                variant="secondary"
                buttonStyle="outline"
                className="flex-1"
                icon={CreditCard}
                iconPosition="left"
              >
                {t('subscription.billing.manageBilling', 'Gestionar Facturación')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics Card */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('subscription.usage.planUsage')}
            </CardTitle>
            <CardDescription>
              {t('subscription.usage.monitorConsumption')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Publications Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {t('subscription.usage.publications')}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {usage.publications_used} / {usage.publications_limit === -1 ? '∞' : usage.publications_limit}
                </span>
              </div>
              <Progress 
                value={calculatePercentage(usage.publications_used, usage.publications_limit)} 
                className="h-2"
              />
            </div>

            {/* Storage Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {t('subscription.usage.storage')}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {formatStorage(usage.storage_used)} / {usage.storage_limit === -1 ? '∞' : formatStorage(usage.storage_limit)}
                </span>
              </div>
              <Progress 
                value={calculatePercentage(usage.storage_used, usage.storage_limit)} 
                className="h-2"
              />
            </div>

            {/* AI Requests Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {t('subscription.usage.aiRequests')}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {usage.ai_requests_used} / {usage.ai_requests_limit === -1 ? '∞' : usage.ai_requests_limit}
                </span>
              </div>
              <Progress 
                value={calculatePercentage(usage.ai_requests_used, usage.ai_requests_limit)} 
                className="h-2"
              />
            </div>

            {/* Warning if approaching limits */}
            {(calculatePercentage(usage.publications_used, usage.publications_limit) > 80 ||
              calculatePercentage(usage.storage_used, usage.storage_limit) > 80 ||
              calculatePercentage(usage.ai_requests_used, usage.ai_requests_limit) > 80) && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg ">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    {t('subscription.usage.nearLimit')}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    {t('subscription.usage.upgradeDescription')}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
