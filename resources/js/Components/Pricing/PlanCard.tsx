import Button from "@/Components/common/Modern/Button";
import { Badge } from "@/Components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { PLAN_FEATURES, type PlanId } from "@/Constants/plans";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Award,
  Check,
  Shield,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
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

interface PlanCardProps {
  plan: Plan;
  isCurrentPlan?: boolean;
  isLoading?: boolean;
  onSelectPlan: (planId: string) => void;
  billingCycle?: "monthly" | "yearly";
  showCurrentBadge?: boolean;
  variant?: "default" | "compact";
  hasActiveSubscription?: boolean;
  isOwner?: boolean;
}

export default function PlanCard({
  plan,
  isCurrentPlan = false,
  isLoading = false,
  onSelectPlan,
  billingCycle = "monthly",
  showCurrentBadge = true,
  variant = "default",
  hasActiveSubscription = false,
  isOwner = true,
}: PlanCardProps) {
  const { t } = useTranslation();

  // Debug log
  if (process.env.NODE_ENV === "development") {
    console.log(`PlanCard ${plan.id}:`, {
      isCurrentPlan,
      hasActiveSubscription,
      price: plan.price,
      requires_stripe: plan.requires_stripe,
    });
  }

  const getPlanIcon = (planId: string) => {
    const iconClass = variant === "compact" ? "w-6 h-6" : "w-6 h-6";
    switch (planId) {
      case "demo":
        return <Sparkles className={cn(iconClass, "text-white")} />;
      case "free":
        return (
          <Zap
            className={cn(iconClass, "text-primary-600 dark:text-primary-400")}
          />
        );
      case "starter":
        return (
          <Star
            className={cn(iconClass, "text-primary-600 dark:text-primary-400")}
          />
        );
      case "professional":
        return <Award className={cn(iconClass, "text-white")} />;
      case "enterprise":
        return (
          <Shield
            className={cn(iconClass, "text-primary-600 dark:text-primary-400")}
          />
        );
      default:
        return null;
    }
  };

  const getFeaturesList = (planId: string): string[] => {
    const features = PLAN_FEATURES[planId as PlanId];
    if (!features) return [];

    return features.map((featureKey) => t(`pricing.features.${featureKey}`));
  };

  const features = getFeaturesList(plan.id);
  const isPopular = plan.popular || plan.id === "professional";
  const displayPrice = plan.price;

  // Determinar si este plan es un downgrade no permitido
  const isPaidPlan = plan.requires_stripe && plan.price > 0;
  const isFreePlan = plan.id === "free";
  const isDemoPlan = plan.id === "demo";
  // Bloquear cambio a Free o Demo si hay suscripción activa de pago
  const isDowngradeBlocked =
    hasActiveSubscription && (isFreePlan || isDemoPlan) && !isCurrentPlan;

  // Determinar el texto del botón
  const getButtonText = () => {
    if (isCurrentPlan) {
      return t("pricing.currentPlan", "Plan Actual");
    }

    if (isDowngradeBlocked) {
      return t(
        "pricing.cancelRequired",
        "Cancela tu suscripción de pago primero",
      );
    }

    if (!plan.enabled && plan.requires_stripe) {
      return t("pricing.comingSoon", "Próximamente");
    }

    if (plan.price === 0) {
      return t("pricing.startFree", "Comenzar Gratis");
    }

    // Si tiene suscripción activa y es un plan de pago, es un cambio de plan
    if (hasActiveSubscription && plan.requires_stripe) {
      return t("pricing.changeToPlan", "Cambiar a este plan");
    }

    // Si no tiene suscripción activa, es una compra nueva
    return t("pricing.selectPlan", "Seleccionar Plan");
  };

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "relative p-6 border-2 rounded-xl transition-all",
          isPopular
            ? "border-primary-600 shadow-lg"
            : "border-gray-200 dark:border-neutral-700",
          isCurrentPlan && "ring-4 ring-primary-200 dark:ring-primary-900/50",
        )}
      >
        {isPopular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full">
              {t("pricing.mostPopular")}
            </span>
          </div>
        )}

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
            {getPlanIcon(plan.id)}
          </div>
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {plan.name}
          </h4>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              ${displayPrice}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              /
              {plan.price === 0
                ? t("planSelection.intervals.forever")
                : t("planSelection.intervals.month")}
            </span>
          </div>
        </div>

        <ul className="space-y-3 mb-6">
          {features.slice(0, 6).map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        <Button
          onClick={() => onSelectPlan(plan.id)}
          disabled={
            isCurrentPlan ||
            isLoading ||
            (!plan.enabled && plan.requires_stripe) ||
            isDowngradeBlocked
          }
          variant={isPopular ? "primary" : "secondary"}
          fullWidth
          size="md"
          loading={isLoading}
        >
          {getButtonText()}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Card
        className={cn(
          "relative flex flex-col h-full transition-all duration-300",
          isPopular
            ? "border-2 border-primary-600 shadow-xl bg-white dark:bg-neutral-900"
            : "border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-primary-400 dark:hover:border-primary-800",
          isCurrentPlan && "border-green-500",
        )}
      >
        {/* Badge superior */}
        {isPopular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-current" />
              {t("pricing.mostPopular")}
            </div>
          </div>
        )}

        {plan.id === "demo" && !isPopular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-purple-500 text-white border-0 shadow-md">
              {t("pricing.demoTemporal", "Demo Temporal")}
            </Badge>
          </div>
        )}

        {isCurrentPlan && showCurrentBadge && (
          <div className="absolute -top-4 right-4">
            <Badge className="bg-green-500 text-white border-0 shadow-md">
              {t("pricing.currentPlan", "Plan Actual")}
            </Badge>
          </div>
        )}

        <CardHeader className="relative">
          <div className="flex items-center justify-between mb-4">
            <div
              className={cn(
                "p-3.5 rounded-lg transition-all duration-300",
                isPopular
                  ? "bg-primary-600 text-white"
                  : plan.id === "demo"
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 dark:bg-neutral-800 text-primary-600 dark:text-primary-400",
              )}
            >
              {getPlanIcon(plan.id)}
            </div>
          </div>

          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {plan.name}
          </CardTitle>

          <CardDescription className="text-gray-600 dark:text-gray-400 min-h-[3rem]">
            {plan.description}
          </CardDescription>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-neutral-800">
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "text-4xl font-extrabold",
                  isPopular
                    ? "text-primary-600"
                    : "text-neutral-900 dark:text-white",
                )}
              >
                ${displayPrice}
              </span>
              {plan.price > 0 && (
                <span className="text-gray-600 dark:text-gray-400 text-lg">
                  /{billingCycle === "monthly" ? "mes" : "año"}
                </span>
              )}
            </div>
            {plan.trial_days && (
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-3 flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                {plan.trial_days} {t("pricing.plans.demo.trialDays")}
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 relative">
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5",
                    isPopular
                      ? "bg-primary-100 dark:bg-primary-900/30"
                      : "bg-green-100 dark:bg-green-900/30",
                  )}
                >
                  <Check
                    className={cn(
                      "h-3 w-3",
                      isPopular
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-green-600 dark:text-green-400",
                    )}
                  />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="relative pt-6">
          <Button
            onClick={() => onSelectPlan(plan.id)}
            disabled={
              isCurrentPlan ||
              isLoading ||
              (!plan.enabled && plan.requires_stripe) ||
              isDowngradeBlocked
            }
            variant={isPopular ? "primary" : "secondary"}
            size="lg"
            fullWidth
            loading={isLoading}
            loadingText={t("pricing.processing")}
            icon={
              !isCurrentPlan &&
              !plan.enabled &&
              plan.requires_stripe &&
              !isDowngradeBlocked
                ? undefined
                : ArrowRight
            }
            iconPosition="right"
            className={cn(
              "group transition-all",
              ((!plan.enabled && plan.requires_stripe) || isDowngradeBlocked) &&
                "opacity-60 grayscale cursor-not-allowed",
            )}
          >
            {getButtonText()}
          </Button>

          {isDowngradeBlocked && (
            <p className="text-xs text-center text-amber-600 dark:text-amber-400 mt-2">
              {t(
                "pricing.cancelSubscriptionFirst",
                "Para cambiar a un plan gratuito, cancela tu suscripción de pago actual y espera a que termine el período de facturación.",
              )}
            </p>
          )}

          {!plan.enabled && plan.requires_stripe && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
              {t("pricing.paymentSetup", "Configuración de pagos en proceso")}
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
