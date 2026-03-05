import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Progress } from '@/Components/ui/progress';
import Button from '@/Components/common/Modern/Button';
import { Badge } from '@/Components/ui/badge';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Separator } from '@/Components/ui/separator';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  TrendingUp,
  FileText,
  HardDrive,
  Users,
  Sparkles,
  Calendar,
  BarChart3,
  CreditCard,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
} from 'lucide-react';

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
  stripe_status: string;
}

interface Props {
  auth: any;
  subscription: Subscription;
  usage: UsageMetric[];
  billingHistory?: any[];
}

export default function UsageMetrics({ auth, subscription, usage, billingHistory }: Props) {
  const { t, i18n } = useTranslation();

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'publications':
        return <FileText className="h-5 w-5" />;
      case 'storage':
        return <HardDrive className="h-5 w-5" />;
      case 'ai_requests':
        return <Sparkles className="h-5 w-5" />;
      case 'team_members':
        return <Users className="h-5 w-5" />;
      default:
        return <BarChart3 className="h-5 w-5" />;
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

  const formatDate = (dateString: string) => {
    const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'demo':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'free':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'starter':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'professional':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleUpgrade = () => {
    router.visit('/pricing');
  };

  const handleManageBilling = () => {
    router.post('/api/v1/subscription/billing-portal');
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t('subscription.usage.title', 'Uso y Facturación')} />

      <div className="py-12 bg-gradient-to-br from-gray-50 via-white to-primary-50/20 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900 min-h-screen">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
          {/* Header with Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <BarChart3 className="h-10 w-10 text-primary-600 dark:text-primary-400" />
                {t('subscription.usage.title', 'Uso y Facturación')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                {t('subscription.usage.description', 'Monitorea tu uso y gestiona tu suscripción')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Badge className={`${getPlanColor(subscription.plan)} text-lg px-6 py-3 shadow-md`}>
                {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
              </Badge>
              {subscription.plan !== 'free' && subscription.plan !== 'demo' && (
                <Button 
                  onClick={handleManageBilling}
                  variant="outline"
                  className="gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  {t('subscription.manageBilling', 'Gestionar Facturación')}
                </Button>
              )}
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subscription Status Card */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  {t('subscription.status.title', 'Estado de Suscripción')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('subscription.status.current', 'Plan Actual')}
                  </span>
                  <Badge className={getPlanColor(subscription.plan)}>
                    {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t('subscription.status.label', 'Estado')}
                  </span>
                  <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                    {subscription.status === 'trialing' ? 'Prueba' : subscription.status === 'active' ? 'Activo' : subscription.status}
                  </Badge>
                </div>
                {subscription.status === 'trialing' && subscription.trial_ends_at && (
                  <>
                    <Separator />
                    <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
                      <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <AlertDescription className="text-purple-800 dark:text-purple-300 text-sm">
                        {t('subscription.usage.trialEndsOn', 'Tu período de prueba termina el')}{' '}
                        <strong>{formatDate(subscription.trial_ends_at)}</strong>
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="border-2 shadow-lg bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/10 dark:to-neutral-900">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  {t('subscription.actions.title', 'Acciones Rápidas')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(subscription.plan === 'free' || subscription.plan === 'demo') && (
                  <Button 
                    onClick={handleUpgrade} 
                    className="w-full gap-2 shadow-md"
                    size="lg"
                  >
                    <TrendingUp className="h-4 w-4" />
                    {t('subscription.actions.upgrade', 'Actualizar Plan')}
                  </Button>
                )}
                {subscription.plan !== 'free' && subscription.plan !== 'demo' && (
                  <Button 
                    onClick={handleManageBilling}
                    variant="outline"
                    className="w-full gap-2"
                    size="lg"
                  >
                    <CreditCard className="h-4 w-4" />
                    {t('subscription.actions.manageBilling', 'Gestionar Facturación')}
                  </Button>
                )}
                <Button 
                  onClick={handleUpgrade}
                  variant="outline"
                  className="w-full gap-2"
                  size="lg"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  {t('subscription.actions.viewPlans', 'Ver Todos los Planes')}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Demo Plan Alert */}
          {subscription.plan === 'demo' && (
            <Alert className="border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-lg">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <AlertDescription className="text-purple-900 dark:text-purple-200 text-base">
                {t('subscription.usage.demoWarning', 'Estás usando el plan Demo. Este plan es temporal y puede ser deshabilitado en cualquier momento. Considera actualizar a un plan de pago para acceso continuo.')}
              </AlertDescription>
            </Alert>
          )}

          {/* Usage Metrics Section */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                {t('subscription.usage.planUsage', 'Uso del Plan')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('subscription.usage.planUsageDescription', 'Monitorea tu consumo mensual')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {usage.map((metric) => {
                const isNearLimit = metric.percentage >= 80;
                const isAtLimit = metric.percentage >= 100;

                return (
                  <Card 
                    key={metric.type} 
                    className={`transition-all duration-300 hover:shadow-xl ${
                      isAtLimit 
                        ? 'border-2 border-red-400 dark:border-red-600 shadow-lg' 
                        : 'border-2 shadow-md hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl ${
                            isAtLimit 
                              ? 'bg-red-100 dark:bg-red-900/30' 
                              : isNearLimit 
                              ? 'bg-yellow-100 dark:bg-yellow-900/30'
                              : 'bg-primary-100 dark:bg-primary-900/30'
                          }`}>
                            {getMetricIcon(metric.type)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {getMetricName(metric.type)}
                            </CardTitle>
                            <CardDescription className="text-sm font-medium">
                              {metric.current} / {formatLimit(metric.limit, metric.type)}
                            </CardDescription>
                          </div>
                        </div>
                        {isAtLimit && (
                          <Badge variant="destructive" className="text-xs shadow-md">
                            <XCircle className="h-3 w-3 mr-1" />
                            {t('subscription.usage.limit', 'Límite')}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Progress
                          value={Math.min(metric.percentage, 100)}
                          className={`h-3 ${
                            isAtLimit
                              ? '[&>div]:bg-red-500'
                              : isNearLimit
                              ? '[&>div]:bg-yellow-500'
                              : '[&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-500'
                          }`}
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">
                            {metric.remaining === -1
                              ? t('subscription.usage.unlimited', 'Ilimitado')
                              : `${metric.remaining} ${t('subscription.usage.remaining', 'restante')}${metric.remaining !== 1 ? 's' : ''}`}
                          </span>
                          <span
                            className={`font-bold text-base ${
                              isAtLimit
                                ? 'text-red-600 dark:text-red-400'
                                : isNearLimit
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}
                          >
                            {Math.round(metric.percentage)}%
                          </span>
                        </div>
                      </div>

                      {isAtLimit && (
                        <Alert variant="destructive" className="shadow-md">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm font-medium">
                            {t('subscription.usage.atLimit', 'Has alcanzado el límite de tu plan')}
                          </AlertDescription>
                        </Alert>
                      )}

                      {isNearLimit && !isAtLimit && (
                        <Alert className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 shadow-md">
                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                            {t('subscription.usage.nearLimit', 'Cerca del límite')} ({Math.round(metric.percentage)}%)
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Upgrade CTA */}
          {(subscription.plan === 'free' || subscription.plan === 'demo') && (
            <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-2 border-blue-300 dark:border-blue-700 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  {t('subscription.usage.upgrade', 'Desbloquea más funcionalidades')}
                </CardTitle>
                <CardDescription className="text-base">
                  {t('subscription.usage.upgradeDescription', 'Actualiza tu plan para obtener más publicaciones, almacenamiento y funciones avanzadas')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleUpgrade} 
                  size="lg" 
                  className="flex-1 gap-2 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Sparkles className="h-5 w-5" />
                  {t('subscription.usage.viewPlans', 'Ver Planes y Precios')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Billing History */}
          {billingHistory && billingHistory.length > 0 && (
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <CreditCard className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      {t('subscription.usage.billingHistory', 'Historial de Facturación')}
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      {t('subscription.usage.billingHistoryDescription', 'Tus últimas facturas y pagos')}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    {t('subscription.downloadAll', 'Descargar')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {billingHistory.map((invoice: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${
                          invoice.status === 'paid' 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          {invoice.status === 'paid' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-base">
                            {invoice.description}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(invoice.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="font-bold text-xl text-gray-900 dark:text-white">
                          ${invoice.amount}
                        </p>
                        <Badge
                          variant={invoice.status === 'paid' ? 'default' : 'destructive'}
                          className="text-xs shadow-sm"
                        >
                          {t(`subscription.status.${invoice.status}`, invoice.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
