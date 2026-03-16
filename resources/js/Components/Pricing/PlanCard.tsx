import Button from '@/Components/common/Modern/Button';
import { Badge } from '@/Components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/Components/ui/card';
import { PLAN_FEATURES, type PlanId } from '@/Constants/plans';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Award,
  Check,
  ChevronDown,
  ChevronUp,
  Lock,
  Shield,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
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

interface PlanCardProps {
  plan: Plan;
  isCurrentPlan?: boolean;
  isLoading?: boolean;
  onSelectPlan: (planId: string) => void;
  billingCycle?: 'monthly' | 'yearly';
  showCurrentBadge?: boolean;
  variant?: 'default' | 'compact';
  hasActiveSubscription?: boolean;
  activePlans?: string[];
  activeSubscriptions?: any[];
  expiredPlans?: string[];
  isOwner?: boolean;
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

export default function PlanCard({
  plan,
  isCurrentPlan = false,
  isLoading = false,
  onSelectPlan,
  billingCycle = 'monthly',
  showCurrentBadge = true,
  variant = 'default',
  hasActiveSubscription = false,
  activePlans = [],
  activeSubscriptions = [],
  expiredPlans = [],
  isOwner = true,
  systemFeatures = {},
}: PlanCardProps) {
  const { t } = useTranslation();
  const [showAllMissing, setShowAllMissing] = useState(false);

  const getPlanIcon = (planId: string) => {
    const iconClass = variant === 'compact' ? 'w-8 h-8' : 'w-8 h-8';
    switch (planId) {
      case 'demo':
        return <Sparkles className={cn(iconClass, 'text-white')} />;
      case 'free':
        return <Zap className={cn(iconClass, '')} />;
      case 'starter':
        return <Star className={cn(iconClass, '')} />;
      case 'professional':
        return <Award className={cn(iconClass, '')} />;
      case 'enterprise':
        return <Shield className={cn(iconClass, '')} />;
      default:
        return null;
    }
  };

  const getFeaturesList = (planId: string): string[] => {
    const features = PLAN_FEATURES[planId as PlanId];
    if (!features) return [];

    return features.map((featureKey) => t(`pricing.features.${featureKey}`));
  };

  const getMissingFeatures = (planId: string): string[] => {
    const currentFeatures = new Set(PLAN_FEATURES[planId as PlanId] || []);

    // Tiers de los planes — demo y enterprise son los más completos
    const planTiers: Record<string, number> = {
      free: 1,
      starter: 2,
      professional: 3,
      enterprise: 4,
      demo: 4, // Demo = acceso total temporal, igual que enterprise
    };

    const currentTier = planTiers[planId] || 0;

    // Jerarquías de features para no mostrar versiones inferiores si ya tienes la superior
    const featureHierarchies: Record<string, string[]> = {
      analytics: ['basicAnalytics', 'advancedAnalytics'],
      support: ['emailSupport', 'prioritySupport', 'dedicatedSupport'],
    };

    // Todas las features de planes SUPERIORES
    const superiorFeatures = new Set<string>();
    Object.entries(PLAN_FEATURES).forEach(([pid, features]) => {
      if ((planTiers[pid] || 0) > currentTier) {
        features.forEach((f) => {
          // Excluir límites numéricos
          if (
            !/^(publications|socialAccounts|storage|aiRequests)\d/.test(f) &&
            !/^(publications|socialAccounts|storage|aiRequests)Unlimited/.test(f) &&
            !/^(storage)1TB/.test(f) &&
            f !== 'fullAccessDays'
          ) {
            superiorFeatures.add(f);
          }
        });
      }
    });

    // Filtrar lo que ya tiene el plan actual
    let missing = Array.from(superiorFeatures).filter((f) => !currentFeatures.has(f));

    // Aplicar lógica de jerarquías: si el plan tiene una versión superior de algo, no mostrar la inferior como "missing"
    Object.values(featureHierarchies).forEach((tierList) => {
      const highestHeldIndex = tierList.reduce((maxIdx, feature, idx) => {
        return currentFeatures.has(feature) ? Math.max(maxIdx, idx) : maxIdx;
      }, -1);

      if (highestHeldIndex !== -1) {
        // El plan ya tiene una versión de esta feature. Quitar de 'missing' cualquier versión igual o inferior.
        missing = missing.filter((f) => {
          const idxInTier = tierList.indexOf(f);
          return idxInTier === -1 || idxInTier > highestHeldIndex;
        });
      }
    });

    return missing.map((f) => t(`pricing.features.${f}`));
  };

  const features = getFeaturesList(plan.id);
  const missingFeatures = getMissingFeatures(plan.id);
  const isPopular = plan.popular || plan.id === 'professional';
  const displayPrice = plan.price;

  // Tagline — one-liner benefit per plan
  const getPlanTagline = (planId: string): string => {
    const taglines: Record<string, string> = {
      demo: t('pricing.taglines.demo', 'Explora todo sin compromisos'),
      free: t('pricing.taglines.free', 'Empieza gratis, sin tarjeta'),
      starter: t('pricing.taglines.starter', 'Para creadores individuales'),
      professional: t('pricing.taglines.professional', 'Escala tu contenido con tu equipo'),
      enterprise: t('pricing.taglines.enterprise', 'Control total de tu marca'),
    };
    return taglines[planId] || '';
  };

  // Annual savings (20% off)
  const annualMonthlyPrice = plan.price > 0 ? Math.round(plan.price * 0.8) : 0;
  const annualSavings = plan.price > 0 ? Math.round(plan.price * 0.2 * 12) : 0;

  // Social proof — chosen by X users
  const getUserCount = (planId: string): string => {
    const counts: Record<string, string> = {
      starter: '2,400+',
      professional: '8,100+',
      enterprise: '340+',
    };
    return counts[planId] || '';
  };
  const userCount = getUserCount(plan.id);

  // Determinar si este plan es un downgrade no permitido
  const isPaidPlan = plan.requires_stripe && plan.price > 0;
  const isFreePlan = plan.id === 'free';
  const isDemoPlan = plan.id === 'demo';
  // Bloquear cambio a Free o Demo si hay suscripción activa de pago
  const isPlanActive = activePlans.includes(plan.id) || isCurrentPlan;
  const isPlanExpired = (expiredPlans || []).includes(plan.id);
  const isDowngradeBlocked = hasActiveSubscription && (isFreePlan || isDemoPlan) && !isCurrentPlan;

  // Determinar si el usuario puede cambiar gratis a este plan
  const canSwitchFree = isPlanActive && !isCurrentPlan;

  // NUEVO: Función para determinar configuración del botón según estado del plan
  const getButtonConfig = () => {
    if (isCurrentPlan) {
      return {
        label: t('pricing.currentPlan', 'Plan Actual'),
        disabled: true,
        variant: 'current' as const,
      };
    }

    // IMPORTANTE: Las tarjetas de planes SIEMPRE redirigen a comprar/renovar
    // Solo la tabla de "Planes comprados" permite usar sin pagar

    if (isDowngradeBlocked) {
      return {
        label: t(
          'pricing.cancelRequired',
          'Debes cancelar tu suscripción actual para cambiar a este plan.',
        ),
        disabled: true,
        variant: 'blocked' as const,
      };
    }

    if (!plan.enabled && plan.requires_stripe) {
      return {
        label: t('pricing.comingSoon', 'Próximamente'),
        disabled: true,
        variant: 'disabled' as const,
      };
    }

    if (isFreePlan || isDemoPlan) {
      return {
        label: t('pricing.selectPlan', 'Seleccionar plan'),
        disabled: false,
        variant: 'free' as const,
      };
    }

    // Para planes de pago, siempre mostrar "Seleccionar plan" (comprar/renovar)
    return {
      label: t('pricing.selectPlan', 'Seleccionar plan'),
      disabled: false,
      variant: 'paid' as const,
    };
  };

  const buttonConfig = getButtonConfig();

  // Determinar el texto del botón (mantener compatibilidad)
  const getButtonText = () => {
    return buttonConfig.label;
  };

  const getPlanStatus = () => {
    if (isCurrentPlan) {
      return {
        label: t('pricing.status.active', 'Activo'),
        variant: 'default' as const,
        className:
          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      };
    }
    if (isPlanActive && !isCurrentPlan) {
      return {
        label: t('pricing.status.purchased', 'Comprado'),
        variant: 'default' as const,
        className:
          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      };
    }
    if (isPlanExpired) {
      return {
        label: t('pricing.status.expired', 'Expirado'),
        variant: 'secondary' as const,
        className:
          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      };
    }
    if (activePlans.length > 0 && !isPlanActive && isPaidPlan) {
      return {
        label: t('pricing.status.available', 'Disponible'),
        variant: 'outline' as const,
        className: 'border-primary-200 dark:border-primary-800 text-primary-600',
      };
    }
    return null;
  };

  const status = getPlanStatus();

  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'relative flex h-full flex-col transition-all duration-300 hover:shadow-lg',
          isPopular
            ? 'border-2 border-primary-600 bg-white shadow-xl dark:bg-neutral-900'
            : 'border border-neutral-200 bg-white hover:border-primary-400 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-800',
          isCurrentPlan && 'ring-2 ring-primary-200 dark:ring-primary-900/50',
        )}
      >
        {/* Badge superior */}
        {isPopular && (
          <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2">
            <div className="flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1 text-xs font-bold text-white shadow-md">
              <Star className="h-3 w-3 fill-current" />
              {t('pricing.mostPopular')}
            </div>
          </div>
        )}

        {plan.id === 'demo' && !isPopular && (
          <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2">
            <Badge className="border-0 bg-purple-500 text-xs text-white shadow-md">
              {t('pricing.demoTemporal', 'Demo Temporal')}
            </Badge>
          </div>
        )}

        {isCurrentPlan && showCurrentBadge && (
          <div className="absolute -top-3 right-4 z-20">
            <Badge className="border-0 bg-green-500 text-xs text-white shadow-md">
              {t('pricing.currentPlan', 'Plan Actual')}
            </Badge>
          </div>
        )}

        {!isCurrentPlan && status && (
          <div className="absolute -top-3 right-4 z-20">
            <Badge
              variant={status.variant}
              className={cn('border text-xs shadow-md', status.className)}
            >
              {status.label}
            </Badge>
          </div>
        )}

        <CardHeader className="pb-4">
          {/* Icono y nombre */}
          <div className="mb-3 flex items-center gap-3">
            <div
              className={cn(
                'rounded-lg p-2.5 transition-all',
                isPopular
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                  : plan.id === 'demo'
                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
              )}
            >
              {getPlanIcon(plan.id)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                {plan.name}
              </CardTitle>
              {/* Tagline compacto */}
              <p className="mt-0.5 text-xs font-medium text-primary-600 dark:text-primary-400">
                {getPlanTagline(plan.id)}
              </p>
            </div>
          </div>

          {/* Precio */}
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                'text-3xl font-extrabold',
                isPopular
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-neutral-900 dark:text-white',
              )}
            >
              ${displayPrice}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              /
              {plan.price === 0
                ? t('planSelection.intervals.forever')
                : billingCycle === 'monthly'
                  ? t('planSelection.intervals.month')
                  : t('planSelection.intervals.year')}
            </span>
          </div>

          {/* Ahorro anual compacto */}
          {plan.price > 0 && billingCycle === 'monthly' && (
            <div className="mt-2">
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                ${annualMonthlyPrice}/mes anual (ahorra ${annualSavings}/año)
              </span>
            </div>
          )}

          {/* User count */}
          {userCount && (
            <p className="mt-2 text-xs text-gray-400 dark:text-neutral-500">
              👥 {userCount} equipos
            </p>
          )}

          {/* Trial days */}
          {plan.trial_days && (
            <p className="mt-2 flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
              <Sparkles className="h-3.5 w-3.5" />
              {plan.trial_days} {t('pricing.plans.demo.trialDays')}
            </p>
          )}
        </CardHeader>

        <CardContent className="flex-1 pt-0">
          {/* Features principales */}
          <ul className="space-y-2.5">
            {features.slice(0, 6).map((feature, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <div
                  className={cn(
                    'mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full',
                    isPopular
                      ? 'bg-primary-100 dark:bg-primary-900/30'
                      : 'bg-green-100 dark:bg-green-900/30',
                  )}
                >
                  <Check
                    className={cn(
                      'h-2.5 w-2.5',
                      isPopular
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-green-600 dark:text-green-400',
                    )}
                  />
                </div>
                <span className="text-sm leading-tight text-gray-700 dark:text-gray-300">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {/* Missing features compacto */}
          {missingFeatures.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-neutral-800/50">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                {t('pricing.missingFeatures', 'Te estás perdiendo')}
              </p>
              <ul className="space-y-2">
                {(showAllMissing ? missingFeatures : missingFeatures.slice(0, 3)).map(
                  (feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-300 dark:text-neutral-600" />
                      <span className="text-xs italic leading-tight text-gray-400 dark:text-neutral-500">
                        {feature}
                      </span>
                    </li>
                  ),
                )}
              </ul>
              {missingFeatures.length > 3 && (
                <button
                  onClick={() => setShowAllMissing(!showAllMissing)}
                  className="mt-2 flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
                >
                  {showAllMissing ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" />
                      {t('pricing.showLess', 'Ver menos')}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
                      {t('pricing.showMore', `Ver ${missingFeatures.length - 3} más`)}
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-4">
          {isDowngradeBlocked && (
            <p className="mb-1 text-center text-xs text-amber-600 dark:text-amber-400">
              {t('pricing.cancelSubscriptionFirst', 'Cancela tu suscripción actual primero')}
            </p>
          )}
          {!plan.enabled && plan.requires_stripe && (
            <p className="mb-1 text-center text-xs text-gray-500 dark:text-gray-400">
              {t('pricing.paymentSetup', 'Configuración en proceso')}
            </p>
          )}

          <Button
            onClick={() => onSelectPlan(plan.id)}
            disabled={buttonConfig.disabled || isLoading || (!plan.enabled && plan.requires_stripe)}
            variant={isPopular ? 'primary' : 'ghost'}
            buttonStyle={
              buttonConfig.variant === 'current' || buttonConfig.variant === 'blocked'
                ? 'outline'
                : isPopular
                  ? 'solid'
                  : 'outline'
            }
            fullWidth
            size="md"
            loading={isLoading}
            loadingText={t('pricing.processing')}
            icon={
              !buttonConfig.disabled &&
              buttonConfig.variant !== 'current' &&
              buttonConfig.variant !== 'blocked'
                ? ArrowRight
                : undefined
            }
            iconPosition="right"
            className={cn(
              'group transition-all',
              buttonConfig.variant === 'current' && 'cursor-not-allowed opacity-60',
              buttonConfig.variant === 'blocked' && 'cursor-not-allowed opacity-60',
            )}
          >
            {getButtonText()}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="relative">
      <Card
        className={cn(
          'relative flex h-full flex-col transition-all duration-300',
          isPopular
            ? 'border-2 border-primary-600 bg-white shadow-xl dark:bg-neutral-900'
            : 'border border-neutral-200 bg-white hover:border-primary-400 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-800',
          isCurrentPlan && 'border-green-500',
        )}
      >
        {/* Badge superior */}
        {isPopular && (
          <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2 transform">
            <div className="flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-1 text-xs font-bold text-white shadow-md">
              <Star className="h-3.5 w-3.5 fill-current" />
              {t('pricing.mostPopular')}
            </div>
          </div>
        )}

        {plan.id === 'demo' && !isPopular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
            <Badge className="border-0 bg-purple-500 text-white shadow-md">
              {t('pricing.demoTemporal', 'Demo Temporal')}
            </Badge>
          </div>
        )}

        {isCurrentPlan && showCurrentBadge && (
          <div className="absolute -top-4 right-4 z-20">
            <Badge className="border-0 bg-green-500 text-white shadow-md">
              {t('pricing.currentPlan', 'Plan Actual')}
            </Badge>
          </div>
        )}

        {!isCurrentPlan && status && (
          <div className="absolute -top-4 right-4 z-20">
            <Badge variant={status.variant} className={cn('border shadow-md', status.className)}>
              {status.label}
            </Badge>
          </div>
        )}

        <CardHeader className="relative">
          <div className="my-4 flex items-center justify-center">
            <div
              className={cn(
                'mr-2 rounded-lg p-3.5 transition-all duration-300',
                isPopular
                  ? 'text-primary-500'
                  : plan.id === 'demo'
                    ? 'bg-neutral-900 text-white'
                    : '',
              )}
            >
              {getPlanIcon(plan.id)}
            </div>

            <div>
              <CardTitle className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
                {plan.name}
              </CardTitle>

              {/* Tagline */}
              <p className="mb-1 text-sm font-medium text-primary-600 dark:text-primary-400">
                {getPlanTagline(plan.id)}
              </p>

              <CardDescription className="min-h-[2rem] text-xs text-gray-600 dark:text-gray-400">
                {plan.description}
              </CardDescription>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6 dark:border-neutral-800">
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  'text-4xl font-extrabold',
                  isPopular ? 'text-primary-600' : 'text-neutral-900 dark:text-white',
                )}
              >
                ${displayPrice}
              </span>
              {plan.price > 0 && (
                <span className="text-lg text-gray-600 dark:text-gray-400">
                  /{billingCycle === 'monthly' ? 'mes' : 'año'}
                </span>
              )}
            </div>

            {/* Annual savings callout */}
            {plan.price > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                  {t('pricing.annualPricing', {
                    price: annualMonthlyPrice,
                    savings: annualSavings,
                  })}
                </span>
              </div>
            )}

            {/* User count badge */}
            {userCount && (
              <p className="mt-2 text-xs text-gray-400 dark:text-neutral-500">
                👥 Elegido por {userCount} equipos
              </p>
            )}

            {plan.trial_days && (
              <p className="mt-3 flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400">
                <Sparkles className="h-4 w-4" />
                {plan.trial_days} {t('pricing.plans.demo.trialDays')}
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative flex-1">
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div
                  className={cn(
                    'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full',
                    isPopular
                      ? 'bg-primary-100 dark:bg-primary-900/30'
                      : 'bg-green-100 dark:bg-green-900/30',
                  )}
                >
                  <Check
                    className={cn(
                      'h-3 w-3',
                      isPopular
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-green-600 dark:text-green-400',
                    )}
                  />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>

          {missingFeatures.length > 0 && (
            <div className="mt-8 border-t border-gray-100 pt-6 dark:border-neutral-800/50">
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                {t('pricing.missingFeatures', 'Lo que te estás perdiendo')}
              </p>
              <ul className="space-y-3">
                {(showAllMissing ? missingFeatures : missingFeatures.slice(0, 4)).map(
                  (feature, index) => (
                    <li key={index} className="group/item flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-gray-100 bg-gray-50 dark:border-neutral-700/50 dark:bg-neutral-800/50">
                        <Lock className="h-2.5 w-2.5 text-gray-400 dark:text-neutral-500" />
                      </div>
                      <span className="text-sm italic text-gray-400 dark:text-neutral-500">
                        {feature}
                      </span>
                    </li>
                  ),
                )}
              </ul>
              {missingFeatures.length > 4 && (
                <button
                  onClick={() => setShowAllMissing(!showAllMissing)}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-primary-600 transition-all hover:border-primary-300 hover:bg-primary-50 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-primary-400 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
                >
                  {showAllMissing ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      {t('pricing.showLess', 'Ver menos')}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      {t(
                        'pricing.showMore',
                        `Ver ${missingFeatures.length - 4} más características`,
                      )}
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-6">
          <div>
            {isDowngradeBlocked && (
              <p className="mt-2 text-center text-xs text-amber-600 dark:text-amber-400">
                {t(
                  'pricing.cancelSubscriptionFirst',
                  'Para cambiar a un plan gratuito, cancela tu suscripción de pago actual y espera a que termine el período de facturación.',
                )}
              </p>
            )}
            {!plan.enabled && plan.requires_stripe && (
              <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                {t('pricing.paymentSetup', 'Configuración de pagos en proceso')}
              </p>
            )}
          </div>
          <Button
            onClick={() => onSelectPlan(plan.id)}
            disabled={buttonConfig.disabled || isLoading || (!plan.enabled && plan.requires_stripe)}
            variant={isPopular ? 'primary' : 'ghost'}
            buttonStyle={
              buttonConfig.variant === 'current' || buttonConfig.variant === 'blocked'
                ? 'gradient'
                : isPopular
                  ? 'solid'
                  : 'outline'
            }
            size="lg"
            fullWidth
            loading={isLoading}
            loadingText={t('pricing.processing')}
            icon={
              !buttonConfig.disabled &&
              buttonConfig.variant !== 'current' &&
              buttonConfig.variant !== 'blocked'
                ? ArrowRight
                : undefined
            }
            iconPosition="right"
            className={cn(
              'group transition-all',
              buttonConfig.variant === 'current' && 'cursor-not-allowed opacity-60',
              buttonConfig.variant === 'blocked' && 'cursor-not-allowed opacity-60',
            )}
          >
            {getButtonText()}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
