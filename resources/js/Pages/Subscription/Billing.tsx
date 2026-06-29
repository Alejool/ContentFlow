import AlertCard from '@/Components/common/Modern/AlertCard';
import Button from '@/Components/common/Modern/Button';
import { DynamicModal } from '@/Components/common/Modern/DynamicModal';
import AdvancedPagination from '@/Components/common/ui/AdvancedPagination';
import PlanUsageCard from '@/Components/Subscription/PlanUsageCard';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDateString } from '@/Utils/formatters';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

declare function route(name: string, params?: any): string;

interface Invoice {
  id: string;
  date: string;
  total: string;
  status: string;
  invoice_pdf: string;
  hosted_invoice_url?: string;
  plan_name?: string;
  description?: string;
  currency?: string;
}

interface InvoicesPagination {
  data: Invoice[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
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
  invoices: Invoice[] | InvoicesPagination;
  upcomingInvoice?: any;
  usage?: UsageMetric[];
}

export default function Billing({ auth, subscription, invoices, upcomingInvoice, usage }: Props) {
  const { t, i18n } = useTranslation();
  const { flash } = usePage().props as any;

  // Determinar si invoices es paginado o array simple
  const isPaginated = invoices && typeof invoices === 'object' && 'data' in invoices;
  const invoicesList = isPaginated
    ? (invoices as InvoicesPagination).data
    : (invoices as Invoice[]) || [];
  const pagination = isPaginated ? (invoices as InvoicesPagination) : null;

  const [perPage, setPerPage] = useState(pagination?.per_page || 10);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Sincronizar perPage con la paginación del backend
  useEffect(() => {
    if (pagination?.per_page && pagination.per_page !== perPage) {
      setPerPage(pagination.per_page);
    }
  }, [pagination?.per_page]);

  const handlePageChange = (page: number) => {
    router.visit(route('subscription.billing', { page, per_page: perPage }), {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    router.visit(route('subscription.billing', { page: 1, per_page: newPerPage }), {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleExportInvoices = () => {
    window.location.href = route('subscription.billing.export');
  };

  useEffect(() => {
    if (flash?.error) {
      toast.error(flash.error);
    }
    if (flash?.success) {
      toast.success(flash.success);
    }
  }, [flash]);

  const formatDate = (dateString: string) =>
    formatDateString(dateString, { year: 'numeric', month: 'long', day: 'numeric' });

  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  const handleBack = () => {
    router.visit('/profile');
  };

  const handleUpdatePayment = async () => {
    try {
      toast.loading(t('subscription.billing.loadingPortal', 'Abriendo portal de facturación...'));

      const response = await axios.post(
        route('subscription.billing-portal'),
        {},
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      toast.dismiss();

      if (response.data.url) {
        window.location.href = response.data.url;
      } else if (response.data.error) {
        toast.error(response.data.error);
      }
    } catch (error: any) {
      toast.dismiss();
      console.error('Error al acceder al portal de facturación:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        t('subscription.billing.portalError', 'No se pudo acceder al portal de facturación');
      toast.error(errorMessage);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);

    try {
      const response = await axios.post(
        route('subscription.cancel-subscription'),
        {},
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.success) {
        toast.success(
          response.data.message ||
            t('subscription.billing.cancelSuccess', 'Suscripción cancelada exitosamente'),
        );
        setShowCancelModal(false);
        setTimeout(() => {
          router.reload();
        }, 1500);
      } else if (response.data.error) {
        toast.error(response.data.error);
      }
    } catch (error: any) {
      console.error('Error al cancelar la suscripción:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        t('subscription.billing.cancelError', 'No se pudo cancelar la suscripción');
      toast.error(errorMessage);
    } finally {
      setIsCancelling(false);
    }
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
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-600';
      case 'demo':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
      case 'starter':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
      case 'professional':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-600';
    }
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t('subscription.billing.title', 'Facturación')} />

      <div className="py-12 dark:text-white">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              onClick={handleBack}
              variant="ghost"
              buttonStyle="ghost"
              icon={ArrowLeft}
              className="mb-4"
            >
              {t('common.back', 'Volver')}
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('subscription.billing.title', 'Facturación')}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-neutral-400">
              {t('subscription.billing.description', 'Gestiona tu facturación y métodos de pago')}
            </p>
          </div>

          {/* Workspace Note */}
          <AlertCard
            type="info"
            message={t(
              'subscription.billing.workspaceNote',
              'This plan applies to all members of this workspace',
            )}
            className="mb-6"
          />

          {/* Active Subscription Info */}
          {subscription.plan !== 'free' &&
            subscription.plan !== 'demo' &&
            subscription.stripe_status === 'active' && (
              <AlertCard
                type="success"
                message={
                  <>
                    {t(
                      'subscription.billing.activeSubscriptionNote',
                      'You have an active subscription. You can change to any paid plan from the Pricing page. To change to Free, first cancel your subscription.',
                    )}{' '}
                    <Button
                      className="mt-4 h-auto p-0 text-green-800 dark:text-green-300"
                      onClick={() => router.visit('/pricing')}
                    >
                      {t('subscription.billing.changePlan', 'Change Plan')}
                    </Button>
                  </>
                }
                className="mb-6"
              />
            )}

          {/* Free/Demo Plan Alert */}
          {(subscription.plan === 'free' || subscription.plan === 'demo') && (
            <AlertCard
              type="warning"
              message={
                <>
                  {t(
                    'subscription.billing.freePlanNote',
                    'Estás en el plan gratuito. Para acceder al portal de facturación, necesitas suscribirte a un plan de pago.',
                  )}{' '}
                  <Button
                    className="ml-2 h-auto p-0 text-yellow-800 underline dark:text-yellow-300"
                    onClick={() => router.visit('/pricing')}
                  >
                    {t('subscription.billing.viewPlans', 'Ver planes disponibles')}
                  </Button>
                </>
              }
              className="mb-6"
            />
          )}

          {/* Current Plan */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
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
                  <Badge
                    variant={getStatusBadgeVariant(subscription.stripe_status)}
                    className="text-xs"
                  >
                    {t(
                      `subscription.status.${subscription.stripe_status}`,
                      subscription.stripe_status,
                    )}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-neutral-800">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-neutral-400">
                      {t('subscription.billing.plan', 'Plan')}
                    </p>
                    <p className="text-lg font-semibold text-gray-900 capitalize dark:text-white">
                      {subscription.plan}
                    </p>
                  </div>
                  {subscription.ends_at && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-neutral-400">
                        {t('subscription.billing.renewsOn', 'Se renueva el')}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatDate(subscription.ends_at)}
                      </p>
                    </div>
                  )}
                </div>

                {subscription.plan !== 'free' && subscription.plan !== 'demo' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                      <Button
                        className="flex-1"
                        icon={CreditCard}
                        size="md"
                        onClick={handleUpdatePayment}
                      >
                        {t('subscription.billing.updatePayment', 'Actualizar Método de Pago')}
                      </Button>
                      <Button
                        variant="ghost"
                        buttonStyle="outline"
                        className="flex-1"
                        icon={TrendingUp}
                        size="md"
                        onClick={() => router.visit('/pricing')}
                      >
                        {t('subscription.billing.changePlan', 'Cambiar Plan')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Usage */}
          {usage && usage.length > 0 && <PlanUsageCard usage={usage} className="mb-8" />}

          {/* Upcoming Invoice */}
          {upcomingInvoice && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('subscription.billing.upcomingInvoice', 'Próxima Factura')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {t('subscription.billing.invoiceHistory', 'Historial de Facturas')}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      'subscription.billing.invoiceHistoryDescription',
                      'Todas tus facturas anteriores',
                    )}
                  </CardDescription>
                </div>
                {invoicesList.length > 0 && (
                  <Button
                    size="md"
                    icon={FileSpreadsheet}
                    variant="secondary"
                    buttonStyle="outline"
                    onClick={handleExportInvoices}
                  >
                    {t('subscription.billing.exportToExcel', 'Exportar a Excel')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {invoicesList.length === 0 ? (
                <div className="py-12 text-center">
                  <DollarSign className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="mb-2 text-gray-600 dark:text-neutral-400">
                    {t('subscription.billing.noInvoices', 'No hay facturas disponibles')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-neutral-500">
                    {t(
                      'subscription.billing.noInvoicesDescription',
                      'Las facturas de Stripe aparecerán aquí una vez que tengas una suscripción activa',
                    )}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {invoicesList.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-gray-800"
                      >
                        <div className="flex flex-1 items-center gap-4">
                          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-3 dark:from-blue-900/30 dark:to-blue-800/30">
                            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-3">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {formatDate(invoice.date)}
                              </p>
                              {invoice.plan_name && invoice.plan_name !== 'N/A' && (
                                <Badge className="border-primary-200 bg-primary-100 text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                                  {invoice.plan_name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-neutral-400">
                              {invoice.description || 'Suscripción'}
                            </p>
                            <div className="mt-2 flex items-center gap-4">
                              <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {invoice.currency || 'USD'} ${formatAmount(invoice.total)}
                              </span>
                              <Badge
                                variant={invoice.status === 'paid' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {t(`subscription.status.${invoice.status}`, invoice.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {(invoice.hosted_invoice_url || invoice.invoice_pdf) && (
                            <Button
                              size="md"
                              icon={Download}
                              variant="secondary"
                              buttonStyle="outline"
                              onClick={() => {
                                // Priorizar hosted_invoice_url de Stripe (página web), luego invoice_pdf (PDF directo)
                                const url = invoice.hosted_invoice_url || invoice.invoice_pdf;
                                if (url) {
                                  window.open(url, '_blank');
                                }
                              }}
                              title={t(
                                'subscription.billing.downloadInvoice',
                                'Descargar factura de Stripe',
                              )}
                            >
                              {t('subscription.billing.download', 'Descargar')}
                            </Button>
                          )}
                          {!invoice.hosted_invoice_url && !invoice.invoice_pdf && (
                            <span className="text-xs text-gray-400 dark:text-neutral-500">
                              {t('subscription.billing.noDownload', 'No disponible')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Paginación Avanzada */}
                  {pagination && (
                    <AdvancedPagination
                      currentPage={pagination.current_page}
                      lastPage={pagination.last_page}
                      total={pagination.total}
                      perPage={perPage}
                      onPageChange={handlePageChange}
                      onPerPageChange={handlePerPageChange}
                      t={t}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Confirmación de Cancelación */}
      <DynamicModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title={t('subscription.billing.cancelSubscription', 'Cancelar Suscripción')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="mb-1 text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {t('subscription.billing.cancelWarningTitle', 'Importante')}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {t(
                  'subscription.billing.cancelConfirm',
                  '¿Estás seguro de que deseas cancelar tu suscripción? Tendrás acceso hasta el final del período de facturación actual.',
                )}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              {t('subscription.billing.cancelDetails', 'Al cancelar tu suscripción:')}
            </p>
            <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-neutral-400">
              <li>
                {t(
                  'subscription.billing.cancelPoint1',
                  'Mantendrás acceso hasta el final del período pagado',
                )}
              </li>
              <li>
                {t('subscription.billing.cancelPoint2', 'No se realizarán más cobros automáticos')}
              </li>
              <li>
                {t(
                  'subscription.billing.cancelPoint3',
                  'Podrás reactivar tu suscripción en cualquier momento',
                )}
              </li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              buttonStyle="outline"
              size="lg"
              onClick={() => setShowCancelModal(false)}
              disabled={isCancelling}
            >
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              icon={isCancelling ? undefined : AlertCircle}
            >
              {isCancelling
                ? t('subscription.billing.cancelling', 'Cancelando...')
                : t('subscription.billing.confirmCancel', 'Sí, cancelar suscripción')}
            </Button>
          </div>
        </div>
      </DynamicModal>
    </AuthenticatedLayout>
  );
}
