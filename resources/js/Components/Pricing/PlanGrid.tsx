import PlanCard from '@/Components/Pricing/PlanCard';
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

interface PlanGridProps {
  plans: Plan[];
  currentPlan?: string;
  isLoading?: string | boolean;
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

export default function PlanGrid({
  plans,
  currentPlan,
  isLoading,
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
}: PlanGridProps) {
  const { t } = useTranslation();

  const isPlanCurrent = (planId: string) => {
    return currentPlan === planId;
  };

  const isPlanLoading = (planId: string) => {
    return isLoading === planId;
  };

  return (
    <div className="relative grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
      {plans
        .filter((plan) => plan.enabled !== false)
        .map((plan) => {
          const isCurrentPlan = isPlanCurrent(plan.id);
          const planIsLoading = isPlanLoading(plan.id);

          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={isCurrentPlan}
              isLoading={planIsLoading}
              onSelectPlan={onSelectPlan}
              billingCycle={billingCycle}
              showCurrentBadge={showCurrentBadge}
              variant={variant}
              hasActiveSubscription={hasActiveSubscription}
              activePlans={activePlans}
              activeSubscriptions={activeSubscriptions}
              expiredPlans={expiredPlans}
              isOwner={isOwner}
              systemFeatures={systemFeatures}
            />
          );
        })}
    </div>
  );
}
