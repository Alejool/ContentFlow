import { useTranslation } from 'react-i18next';
import React from 'react';
import { Badge } from '@/Components/ui/badge';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePricing } from '@/Hooks/usePricing';
import PlanGrid from '@/Components/Pricing/PlanGrid';

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
}

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
}: PricingPlansSectionProps) {
  const { t } = useTranslation();
  const {
    isLoading,
    billingCycle,
    setBillingCycle,
    handleSelectPlan,
    checkActiveSubscription,
  } = usePricing({
    isAuthenticated,
    currentPlan,
  });

  const [hasActiveSubscription, setHasActiveSubscription] = React.useState(propHasActiveSubscription || false);

  React.useEffect(() => {
    if (isAuthenticated && propHasActiveSubscription === undefined) {
      checkActiveSubscription().then(setHasActiveSubscription);
    } else if (propHasActiveSubscription !== undefined) {
      setHasActiveSubscription(propHasActiveSubscription);
    }
  }, [isAuthenticated, propHasActiveSubscription]);

  const handlePlanSelect = async (planId: string) => {
    await handleSelectPlan(planId);
    if (onPlanSelected) {
      onPlanSelected(planId);
    }
  };

  return (
    <div className="space-y-16">
      {/* Header */}
      {showHeader && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            {t('pricing.flexiblePlans', 'Planes flexibles para cada necesidad')}
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 font-heading">
            {t('pricing.title')}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>

          {/* Mensaje para owner con suscripción activa */}
          {isOwner && hasActiveSubscription && (
            <div className="mb-8 max-w-3xl mx-auto">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t('pricing.activeSubscription.title', 'Ya tienes una suscripción activa')}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {t('pricing.activeSubscription.changeDescription', 'Puedes cambiar a cualquier plan a continuación. El cambio se aplicará inmediatamente y se ajustará tu facturación de forma prorrateada.')}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={route('subscription.billing')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-700 rounded-lg font-medium transition-colors"
                      >
                        {t('pricing.activeSubscription.manageBilling', 'Gestionar Facturación')}
                      </a>
                      <a
                        href={route('subscription.usage')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-700 rounded-lg font-medium transition-colors"
                      >
                        {t('pricing.activeSubscription.viewUsage', 'Ver Uso del Plan')}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billing Toggle */}
          {showBillingToggle && (
            <div className="inline-flex items-center gap-2 bg-white dark:bg-neutral-800 p-1.5 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-700">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'px-6 py-2.5 rounded-lg font-medium transition-all duration-200',
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                {t('pricing.monthly')}
              </button>
              {/* <button
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  'px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2',
                  billingCycle === 'yearly'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                {t('pricing.yearly')}
                <Badge className="bg-green-500 text-white border-0 text-xs">
                  {t('pricing.yearlyDiscount')}
                </Badge>
              </button> */}
            </div>
          )}
        </div>
      )}

      {/* Plans Grid */}
      <PlanGrid
        plans={plans}
        currentPlan={currentPlan}
        isLoading={isLoading}
        onSelectPlan={handlePlanSelect}
        billingCycle={billingCycle}
        showCurrentBadge={isAuthenticated}
        variant={variant}
        hasActiveSubscription={hasActiveSubscription}
        isOwner={isOwner}
      />
    </div>
  );
}
