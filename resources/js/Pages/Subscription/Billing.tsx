import React, { useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import Button from '@/Components/common/Modern/Button';
import { Badge } from '@/Components/ui/badge';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Progress } from '@/Components/ui/progress';
import { Download, CreditCard, Calendar, DollarSign, ArrowLeft, Info, TrendingUp, FileText, HardDrive, Sparkles, Users, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import axios from 'axios';

declare function route(name: string, params?: any): string;

interface Invoice {
  id: string;
  date: string;
  total: string;
  status: string;
  invoice_pdf: string;
}

interface UsageMetric {
  type: string;
  current: number;
  limit: number;
  percentage: number;
  remaining: number;
}

interface Props {
  auth: any;
  subscription: {
    plan: string;
    status: string;
    stripe_status: string;
    trial_ends_at?: string;
    ends_at?: string;
  };
  invoices: Invoice[];
  upcomingInvoice?: any;
  usage?: UsageMetric[];
}

export default function Billing({ auth, subscription, invoices, upcomingInvoice, usage }: Props) {
  const { t, i18n } = useTranslation();
  const { flash } = usePage().props as any;

  useEffect(() => {
    if (flash?.error) {
      toast.error(flash.error);
    }
    if (flash?.success) {
      toast.success(flash.success);
    }
  }, [flash]);

  const formatDate = (dateString: string) => {
    const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  const handleBack = () => {
    router.visit('/profile');
  };

  const handleUpdatePayment = async () => {
    try {
      // Usar axios que ya tiene configurado el token CSRF
      const response = await axios.post(route('subscription.billing-portal'));
      
      if (response.data.url) {
        // Redirigir a la URL del portal de Stripe
        window.location.href = response.data.url;
      } else if (response.data.error) {
        toast.error(response.data.error);
      }
    } catch (error: any) {
      console.error('Error al acceder al portal de facturación:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || t('subscription.billing.portalError', 'No se pudo acceder al portal de facturación');
      toast.error(errorMessage);
    }
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'publications':
        return <FileText className="h-4 w-4" />;
      case 'storage':
        return <HardDrive className="h-4 w-4" />;
      case 'ai_requests':
        return <Sparkles className="h-4 w-4" />;
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'trialing':
        return 'secondary';
      case 'past_due':
      case 'canceled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPlanBadgeClass = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'free':
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600';
      case 'demo':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
      case 'starter':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
      case 'professional':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600';
    }
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t('subscription.billing.title', 'Facturación')} />

      <div className="py-12 dark:text-white">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Button onClick={handleBack} 
              variant="ghost" 
              icon={ArrowLeft}
              className="mb-4">
          
              {t('common.back', 'Volver')}
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('subscription.billing.title', 'Facturación')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('subscription.billing.description', 'Gestiona tu facturación y métodos de pago')}
            </p>
          </div>

          {/* Workspace Note */}
          <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-300">
              {t('subscription.billing.workspaceNote', 'Este plan aplica para todos los miembros de este workspace')}
            </AlertDescription>
          </Alert>

          {/* Free/Demo Plan Alert */}
          {(subscription.plan === 'free' || subscription.plan === 'demo') && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-300">
                {t('subscription.billing.freePlanNote', 'Estás en el plan gratuito. Para acceder al portal de facturación, necesitas suscribirte a un plan de pago.')}
                <Button 
                  className="ml-2 p-0 h-auto text-yellow-800 dark:text-yellow-300 underline"
                  onClick={() => router.visit('/pricing')}
                >
                  {t('subscription.billing.viewPlans', 'Ver planes disponibles')}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Current Plan */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    {t('subscription.billing.currentPlan', 'Plan Actual')}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {t('subscription.billing.planDescription', 'Información de tu suscripción')}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={getPlanBadgeClass(subscription.plan)}>
                    {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(subscription.stripe_status)} className="text-xs">
                    {t(`subscription.status.${subscription.stripe_status}`, subscription.stripe_status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('subscription.billing.plan', 'Plan')}
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {subscription.plan}
                    </p>
                  </div>
                  {subscription.ends_at && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('subscription.billing.renewsOn', 'Se renueva el')}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatDate(subscription.ends_at)}
                      </p>
                    </div>
                  )}
                </div>

                {subscription.plan !== 'free' && subscription.plan !== 'demo' && (
                  <div className="flex gap-3">
                    <Button  
                    className="flex-1" 
                    icon={CreditCard}
                    size='md'
                    onClick={handleUpdatePayment}>
                      {t('subscription.billing.updatePayment', 'Actualizar Método de Pago')}
                    </Button>
                    <Button 
                    variant="ghost"
                    buttonStyle="outline"
                    className="flex-1" 
                    icon={TrendingUp}
                    size='md'
                    onClick={() => router.visit('/pricing')}>
                      {t('subscription.billing.changePlan', 'Cambiar Plan')}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Usage */}
          {usage && usage.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {t('subscription.usage.currentUsage', 'Uso Actual')}
                </CardTitle>
                <CardDescription>
                  {t('subscription.usage.description', 'Monitorea tu uso y gestiona tu suscripción')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {usage.map((metric) => (
                    <div key={metric.type} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {getMetricIcon(metric.type)}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {getMetricName(metric.type)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {metric.current}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
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
                        <p className="text-xs text-gray-600 dark:text-gray-400">
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
          )}

          {/* Upcoming Invoice */}
          {upcomingInvoice && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t('subscription.billing.upcomingInvoice', 'Próxima Factura')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {t('subscription.billing.amount', 'Monto')}
                    </p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      ${formatAmount(upcomingInvoice.total)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {t('subscription.billing.dueDate', 'Fecha de vencimiento')}
                    </p>
                    <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                      {formatDate(upcomingInvoice.date)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                {t('subscription.billing.invoiceHistory', 'Historial de Facturas')}
              </CardTitle>
              <CardDescription>
                {t('subscription.billing.invoiceHistoryDescription', 'Todas tus facturas anteriores')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('subscription.billing.noInvoices', 'No hay facturas disponibles')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatDate(invoice.date)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ${formatAmount(invoice.total)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                          {t(`subscription.status.${invoice.status}`, invoice.status)}
                        </Badge>
                        <Button
                          size="md"
                          icon={Download}
                          onClick={() => {
                            if (invoice.invoice_pdf) {
                              window.open(invoice.invoice_pdf, '_blank');
                            }
                          }}
                          disabled={!invoice.invoice_pdf}
                        >
                   
                          {t('subscription.billing.download', 'Descargar')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
