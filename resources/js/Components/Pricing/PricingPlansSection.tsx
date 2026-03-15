import PlanGrid from '@/Components/Pricing/PlanGrid';
import { DynamicModal } from '@/Components/common/Modern/DynamicModal';
import { Badge } from '@/Components/ui/badge';
import { usePricing } from '@/Hooks/usePricing';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Info, RefreshCw, Sparkles, XCircle, Zap } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  limits: {
    publications_per_month: number;
    storage_gb: number;
    social_accounts: number;
    team_members: number;
  };
  popular?: boolean;
  enabled?: boolean;
  trial_days?: number;
  requires_stripe?: boolean;
}

interface PricingPlansSectionProps {
  plans: Plan[];
  currentPlan?: string;
  isAuthenticated?: boolean;
  showBillingToggle?: boolean;
  showHeader?: boolean;
  variant?: 'default' | 'compact';
  onPlanSelected?: (planId: string) => void;
  isOwner?: boolean;
  hasActiveSubscription?: boolean;
  activePlans?: string[];
  systemFeatures?: {
    ai?: boolean;
    analytics?: boolean;
    reels?: boolean;
    approval_workflows?: boolean;
    calendar_sync?: boolean;
    bulk_operations?: boolean;
    white_label?: boolean;
  };
}

const MODAL_META = {
  error: {
    icon: XCircle,
    iconClass: 'text-red-500',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    actionClass: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    actionClass: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-500',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    actionClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  confirm: {
    icon: Info,
    iconClass: 'text-primary-500',
    bgClass: 'bg-primary-100 dark:bg-primary-900/30',
    actionClass: 'bg-primary-600 hover:bg-primary-700 text-white',
  },
} as const;

const getPlanName = (id: string, plans: Plan[]) =>
  plans.find((p) => p.id === id)?.name ?? id.charAt(0).toUpperCase() + id.slice(1);

const getPlanPrice = (id: string, plans: Plan[]) => plans.find((p) => p.id === id)?.price ?? 0;

export default function PricingPlansSection({
  plans,
  currentPlan,
  isAuthenticated = false,
  showBillingToggle = true,
  showHeader = true,
  variant = 'default',
  onPlanSelected,
  isOwner = true,
  hasActiveSubscription: propHasActiveSubscription,
  activePlans: propActivePlans,
  workspaceId,
  systemFeatures = {},
}: PricingPlansSectionProps & { workspaceId?: number }) {
  const { t } = useTranslation();
  const {
    isLoading,
    activePlans,
    activeSubscriptions,
    expiredPlans,
    billingCycle,
    setBillingCycle,
    handleSelectPlan,
    checkActiveSubscription,
    modal,
    closeModal,
  } = usePricing({ isAuthenticated, currentPlan, workspaceId });

  const [hasActiveSubscription, setHasActiveSubscription] = React.useState(
    propHasActiveSubscription || false,
  );

  // Definir effectiveActivePlans PRIMERO antes de usarlo
  const effectiveActivePlans = activePlans.length > 0 ? activePlans : propActivePlans || [];

  React.useEffect(() => {
    if (isAuthenticated && propHasActiveSubscription === undefined) {
      checkActiveSubscription().then(setHasActiveSubscription);
    } else if (propHasActiveSubscription !== undefined) {
      setHasActiveSubscription(propHasActiveSubscription);
    }
  }, [isAuthenticated, propHasActiveSubscription]);

  const handlePlanSelect = async (planId: string) => {
    await handleSelectPlan(planId);
    if (onPlanSelected) onPlanSelected(planId);
  };

  // Función para las tarjetas de planes: SIEMPRE ir a checkout de Stripe
  const handlePlanCardSelect = async (planId: string) => {
    await handleSelectPlan(planId, true); // forceCheckout = true
    if (onPlanSelected) onPlanSelected(planId);
  };

  // CRITICAL: Determinar si tiene plan de pago activo
  // Esto bloquea Free/Demo cuando tienes Starter, Growth, Professional o Enterprise activo
  const hasPaidPlanActive = React.useMemo(() => {
    const paidPlans = ['starter', 'growth', 'professional', 'enterprise'];

    // Verificar si el plan actual es de pago
    const currentIsPaid = currentPlan && paidPlans.includes(currentPlan);

    // Verificar si tiene planes de pago en activePlans
    const hasActivePaidPlan = effectiveActivePlans.some((id) => paidPlans.includes(id));

    // Verificar si tiene suscripciones activas de pago
    const hasActivePaidSubscription = activeSubscriptions.some(
      (sub) => paidPlans.includes(sub.plan) && sub.status === 'active',
    );

    return currentIsPaid || hasActivePaidPlan || hasActivePaidSubscription;
  }, [currentPlan, effectiveActivePlans, activeSubscriptions]);

  // DEBUG: Ver qué datos llegan
  React.useEffect(() => {}, [currentPlan, effectiveActivePlans, expiredPlans, activeSubscriptions]);

  // Plans purchased + still active (not current) → can switch for free
  const switchablePlans = effectiveActivePlans.filter(
    (id) => id !== currentPlan && ['starter', 'growth', 'professional', 'enterprise'].includes(id),
  );
  // Plans purchased but now expired → need Stripe renewal
  const renewablePlans = expiredPlans.filter((id) =>
    ['starter', 'growth', 'professional', 'enterprise'].includes(id),
  );

  const meta = MODAL_META[modal.type as keyof typeof MODAL_META] ?? MODAL_META.info;
  const ModalIcon = meta.icon;

  return (
    <div className="space-y-12">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      {showHeader && (
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-medium text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
            <Sparkles className="h-4 w-4" />
            {t('pricing.flexiblePlans', 'Planes flexibles para cada necesidad')}
          </div>

          <h1 className="mb-6 font-heading text-5xl font-bold text-gray-900 dark:text-white md:text-6xl">
            {t('pricing.title')}
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-600 dark:text-gray-400">
            {t('pricing.subtitle')}
          </p>

          {/* ── Active subscription banner ─────────────────────────────────── */}
          {isOwner && (hasActiveSubscription || activeSubscriptions.length > 0) && (
            <div className="mx-auto mb-8 max-w-3xl">
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6 shadow-sm dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shadow-inner">
                      <Info className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="mb-2 text-lg font-bold text-blue-900 dark:text-blue-100">
                      {t('pricing.activeSubscription.title', 'Ya tienes una suscripción activa')}
                    </h3>
                    <div className="mb-3 space-y-2">
                      {activeSubscriptions.length > 0 ? (
                        activeSubscriptions.map((sub, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-3 dark:border-blue-800 dark:bg-blue-950/50"
                          >
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100">
                                {t('pricing.currentPlanLabel')}: {sub.name}
                              </p>
                              <p className="text-xs text-blue-700 dark:text-blue-300">
                                {sub.cancel_at_period_end
                                  ? t('pricing.endsOn', {
                                      date: new Date(sub.ends_at).toLocaleDateString(),
                                    })
                                  : t('pricing.autoRenewal')}
                              </p>
                            </div>
                            <Badge
                              className={cn(
                                sub.status === 'active'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                              )}
                            >
                              {sub.status === 'active' ? t('pricing.statusActive') : sub.status}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <span className="font-bold">{t('pricing.currentPlanLabel')}: </span>
                          <span className="font-bold capitalize text-blue-600 dark:text-blue-400">
                            {currentPlan}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-100 p-4 dark:border-blue-800 dark:bg-blue-900/40">
                      <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
                        {t(
                          'pricing.activeSubscription.prorationExplanation',
                          'Puedes cambiar a cualquier plan disponible. El cambio se aplicará inmediatamente y la facturación se ajustará automáticamente de forma prorrateada según el tiempo restante de tu suscripción.',
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={route('subscription.billing')}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                      >
                        {t('pricing.activeSubscription.manageBilling', 'Gestionar Facturación')}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Billing toggle ──────────────────────────────────────────────── */}
          {showBillingToggle && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'rounded-lg px-6 py-2.5 font-medium transition-all duration-200',
                  billingCycle === 'monthly'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white',
                )}
              >
                {t('pricing.monthly')}
              </button>
            </div>
          )}

          {/* ── My Plans Panel ──────────────────────────────────────────────── */}
          {isAuthenticated && isOwner && currentPlan && (
            <div className="mx-auto mt-6 max-w-2xl text-left">
              <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                {/* Header row */}
                <div className="flex items-center gap-3 bg-primary-600 px-5 py-4">
                  <Zap className="h-5 w-5 flex-shrink-0 text-white" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">
                      {t('pricing.activePlanNow')}
                    </p>
                    <p className="text-lg font-bold capitalize leading-tight text-white">
                      {getPlanName(currentPlan, plans)}
                      <span className="ml-2 text-sm font-normal text-primary-200">
                        ${getPlanPrice(currentPlan, plans)}/{t('pricing.billing.month')}
                      </span>
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-primary-200" />
                </div>

                {/* Switchable plans (purchased + time available, use for free) */}
                {switchablePlans.length > 0 && (
                  <div className="border-t border-neutral-100 px-5 py-4 dark:border-neutral-800">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      {t('pricing.purchasedPlansAvailable', 'Planes comprados — cambiar sin pago')}
                    </p>
                    <div className="flex flex-col gap-2">
                      {switchablePlans.map((id) => (
                        <div
                          key={id}
                          className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                            <div>
                              <p className="text-sm font-semibold capitalize text-green-800 dark:text-green-300">
                                {getPlanName(id, plans)}
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-500">
                                {t('pricing.timeAvailable', 'Tiempo disponible')} · $
                                {getPlanPrice(id, plans)}/{t('pricing.billing.month')}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handlePlanSelect(id)}
                            disabled={!!isLoading}
                            className="flex-shrink-0 rounded-lg bg-green-600 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                          >
                            {isLoading === id ? t('pricing.changing') : t('pricing.use')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Renewable plans (expired, need Stripe) */}
                {renewablePlans.length > 0 && (
                  <div className="border-t border-neutral-100 px-5 py-4 dark:border-neutral-800">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      {t('pricing.expiredPlans')}
                    </p>
                    <div className="flex flex-col gap-2">
                      {renewablePlans.map((id) => (
                        <div
                          key={id}
                          className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20"
                        >
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                            <div>
                              <p className="text-sm font-semibold capitalize text-amber-800 dark:text-amber-300">
                                {getPlanName(id, plans)}
                              </p>
                              <p className="text-xs text-amber-600 dark:text-amber-500">
                                {t('pricing.expired')} · ${getPlanPrice(id, plans)}/
                                {t('pricing.billing.month')}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handlePlanSelect(id)}
                            disabled={!!isLoading}
                            className="flex-shrink-0 rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                          >
                            {isLoading === id ? '...' : t('pricing.renew')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Plan cards ─────────────────────────────────────────────────────── */}
      <PlanGrid
        plans={plans}
        currentPlan={currentPlan || undefined}
        isLoading={isLoading ?? undefined}
        onSelectPlan={handlePlanCardSelect}
        billingCycle={billingCycle}
        showCurrentBadge={isAuthenticated}
        variant={variant}
        hasActiveSubscription={hasPaidPlanActive}
        activePlans={effectiveActivePlans}
        activeSubscriptions={activeSubscriptions}
        expiredPlans={expiredPlans}
        isOwner={isOwner}
        systemFeatures={systemFeatures}
      />

      {/* ── Error / Warning Modal (no success modal — redirect is used instead) */}
      <DynamicModal isOpen={modal.open} onClose={closeModal} title={modal.title} size="md">
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className={cn('flex h-14 w-14 items-center justify-center rounded-full', meta.bgClass)}
          >
            <ModalIcon className={cn('h-7 w-7', meta.iconClass)} />
          </div>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {modal.message}
          </p>
          <div className="mt-2 flex w-full justify-center gap-3">
            {modal.actionLabel && modal.onAction && (
              <button
                onClick={() => {
                  closeModal();
                  modal.onAction?.();
                }}
                className={cn(
                  'flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors',
                  meta.actionClass,
                )}
              >
                {modal.actionLabel}
              </button>
            )}
            <button
              onClick={closeModal}
              className={cn(
                'rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors',
                'bg-white text-gray-700 dark:bg-neutral-800 dark:text-gray-200',
                'border-gray-200 hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-700',
                !modal.actionLabel && 'flex-1',
              )}
            >
              {modal.closeLabel ?? t('pricing.close')}
            </button>
          </div>
        </div>
      </DynamicModal>
    </div>
  );
}
