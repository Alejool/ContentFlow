import PlanGrid from "@/Components/Pricing/PlanGrid";
import { Badge } from "@/Components/ui/badge";
import { usePricing } from "@/Hooks/usePricing";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

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
  variant?: "default" | "compact";
  onPlanSelected?: (planId: string) => void;
  isOwner?: boolean;
  hasActiveSubscription?: boolean;
  activePlans?: string[];
}

export default function PricingPlansSection({
  plans,
  currentPlan,
  isAuthenticated = false,
  showBillingToggle = true,
  showHeader = true,
  variant = "default",
  onPlanSelected,
  isOwner = true,
  hasActiveSubscription: propHasActiveSubscription,
  activePlans: propActivePlans,
  workspaceId,
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
  } = usePricing({
    isAuthenticated,
    currentPlan,
    workspaceId,
  });

  const [hasActiveSubscription, setHasActiveSubscription] = React.useState(
    propHasActiveSubscription || false,
  );

  React.useEffect(() => {
    console.log("PricingPlansSection - Initial state:", {
      isAuthenticated,
      currentPlan,
      propHasActiveSubscription,
      hasActiveSubscription,
    });

    if (isAuthenticated && propHasActiveSubscription === undefined) {
      checkActiveSubscription().then((result) => {
        console.log(
          "PricingPlansSection - checkActiveSubscription result:",
          result,
        );
        setHasActiveSubscription(result);
      });
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
            {t("pricing.flexiblePlans", "Planes flexibles para cada necesidad")}
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 font-heading">
            {t("pricing.title")}
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            {t("pricing.subtitle")}
          </p>

          {/* Mensaje para owner con suscripción activa */}
          {/* Mensaje para owner con suscripción activa */}
          {isOwner &&
            (hasActiveSubscription || activeSubscriptions.length > 0) && (
              <div className="mb-8 max-w-3xl mx-auto">
                <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center shadow-inner">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                        {t(
                          "pricing.activeSubscription.title",
                          "Suscripciones Activas",
                        )}
                      </h3>
                      <div className="space-y-2 mb-4">
                        {activeSubscriptions.length > 0 ? (
                          activeSubscriptions.map((sub, index) => (
                            <div
                              key={index}
                              className="bg-white dark:bg-neutral-900 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 flex justify-between items-center"
                            >
                              <div>
                                <p className="font-semibold text-neutral-900 dark:text-white">
                                  {sub.name}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-500">
                                  {sub.cancel_at_period_end
                                    ? `Finaliza el ${new Date(sub.ends_at).toLocaleDateString()}`
                                    : "Renovación automática"}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  sub.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                                className={cn(
                                  sub.status === "active"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                                )}
                              >
                                {sub.status === "active"
                                  ? "Activa"
                                  : sub.status}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {t(
                              "pricing.activeSubscription.currentPlan",
                              "Plan actual:",
                            )}{" "}
                            <span className="font-bold text-primary-600 lowercase capitalize">
                              {currentPlan}
                            </span>
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                        {t(
                          "pricing.activeSubscription.changeDescription",
                          "Puedes cambiar a cualquier plan a continuación. El cambio se aplicará inmediatamente y se ajustará tu facturación de forma prorrateada.",
                        )}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={route("subscription.billing")}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                        >
                          {t(
                            "pricing.activeSubscription.manageBilling",
                            "Gestionar Facturación",
                          )}
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
                onClick={() => setBillingCycle("monthly")}
                className={cn(
                  "px-6 py-2.5 rounded-lg font-medium transition-all duration-200",
                  billingCycle === "monthly"
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white",
                )}
              >
                {t("pricing.monthly")}
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
        currentPlan={currentPlan || undefined}
        isLoading={isLoading ?? undefined}
        onSelectPlan={handlePlanSelect}
        billingCycle={billingCycle}
        showCurrentBadge={isAuthenticated}
        variant={variant}
        hasActiveSubscription={hasActiveSubscription}
        activePlans={
          activePlans.length > 0 ? activePlans : propActivePlans || []
        }
        activeSubscriptions={activeSubscriptions}
        expiredPlans={expiredPlans}
        isOwner={isOwner}
      />
    </div>
  );
}
