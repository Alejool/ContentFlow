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
}

export default function PricingPlansSection({
  plans,
  currentPlan,
  isAuthenticated = false,
  showBillingToggle = true,
  showHeader = true,
  variant = 'default',
  onPlanSelected,
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

  const [hasActiveSubscription, setHasActiveSubscription] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      checkActiveSubscription().then(setHasActiveSubscription);
    }
  }, [isAuthenticated]);

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
              <button
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
              </button>
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
      />
    </div>
  );
}
