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
  Lock,
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
  activePlans?: string[];
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
  activePlans = [],
  isOwner = true,
}: PlanCardProps) {
  const { t } = useTranslation();

  const getPlanIcon = (planId: string) => {
    const iconClass = variant === "compact" ? "w-8 h-8" : "w-8 h-8";
    switch (planId) {
      case "demo":
        return <Sparkles className={cn(iconClass, "text-white")} />;
      case "free":
        return <Zap className={cn(iconClass, "")} />;
      case "starter":
        return <Star className={cn(iconClass, "")} />;
      case "professional":
        return <Award className={cn(iconClass, "")} />;
      case "enterprise":
        return <Shield className={cn(iconClass, "")} />;
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
      analytics: ["basicAnalytics", "advancedAnalytics"],
      support: ["emailSupport", "prioritySupport", "dedicatedSupport"],
    };

    // Todas las features de planes SUPERIORES
    const superiorFeatures = new Set<string>();
    Object.entries(PLAN_FEATURES).forEach(([pid, features]) => {
      if ((planTiers[pid] || 0) > currentTier) {
        features.forEach((f) => {
          // Excluir límites numéricos
          if (
            !/^(publications|socialAccounts|storage|aiRequests)\d/.test(f) &&
            !/^(publications|socialAccounts|storage|aiRequests)Unlimited/.test(
              f,
            ) &&
            !/^(storage)1TB/.test(f) &&
            f !== "fullAccessDays"
          ) {
            superiorFeatures.add(f);
          }
        });
      }
    });

    // Filtrar lo que ya tiene el plan actual
    let missing = Array.from(superiorFeatures).filter(
      (f) => !currentFeatures.has(f),
    );

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
  const isPopular = plan.popular || plan.id === "professional";
  const displayPrice = plan.price;

  // Tagline — one-liner benefit per plan
  const getPlanTagline = (planId: string): string => {
    const taglines: Record<string, string> = {
      demo: t("pricing.taglines.demo", "Explora todo sin compromisos"),
      free: t("pricing.taglines.free", "Empieza gratis, sin tarjeta"),
      starter: t("pricing.taglines.starter", "Para creadores individuales"),
      professional: t(
        "pricing.taglines.professional",
        "Escala tu contenido con tu equipo",
      ),
      enterprise: t("pricing.taglines.enterprise", "Control total de tu marca"),
    };
    return taglines[planId] || "";
  };

  // Annual savings (20% off)
  const annualMonthlyPrice = plan.price > 0 ? Math.round(plan.price * 0.8) : 0;
  const annualSavings = plan.price > 0 ? Math.round(plan.price * 0.2 * 12) : 0;

  // Social proof — chosen by X users
  const getUserCount = (planId: string): string => {
    const counts: Record<string, string> = {
      starter: "2,400+",
      professional: "8,100+",
      enterprise: "340+",
    };
    return counts[planId] || "";
  };
  const userCount = getUserCount(plan.id);

  // Determinar si este plan es un downgrade no permitido
  const isPaidPlan = plan.requires_stripe && plan.price > 0;
  const isFreePlan = plan.id === "free";
  const isDemoPlan = plan.id === "demo";
  // Bloquear cambio a Free o Demo si hay suscripción activa de pago
  const isPlanActive = activePlans.includes(plan.id) || isCurrentPlan;
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

    // Si es un plan activo pero no el actual
    if (isPlanActive && !isCurrentPlan) {
      return t("pricing.changeToPlan", "Cambiar a este plan");
    }

    // Si tiene suscripción activa pero este plan NO es activo, es un upgrade/downgrade (cambiar en Stripe)
    if (hasActiveSubscription && (plan.requires_stripe || plan.price > 0)) {
      return t("pricing.changeToPlan", "Cambiar a este plan");
    }

    // Si el plan ya expiró o no es activo, es una compra/selección
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
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
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
          variant={isPopular ? "primary" : "ghost"}
          buttonStyle={isPopular ? "solid" : "outline"}
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
          <div className="flex items-center justify-center my-4 ">
            <div
              className={cn(
                "p-3.5 rounded-lg mr-2 transition-all duration-300",
                isPopular
                  ? "text-primary-500"
                  : plan.id === "demo"
                    ? "bg-neutral-900 text-white"
                    : "",
              )}
            >
              {getPlanIcon(plan.id)}
            </div>

            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {plan.name}
              </CardTitle>

              {/* Tagline */}
              <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">
                {getPlanTagline(plan.id)}
              </p>

              <CardDescription className="text-gray-600 dark:text-gray-400 min-h-[2rem] text-xs">
                {plan.description}
              </CardDescription>
            </div>
          </div>

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

            {/* Annual savings callout */}
            {plan.price > 0 && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full font-semibold">
                  Anual: ${annualMonthlyPrice}/mes — ahorras ${annualSavings}
                  /año
                </span>
              </div>
            )}

            {/* User count badge */}
            {userCount && (
              <p className="text-xs text-gray-400 dark:text-neutral-500 mt-2">
                👥 Elegido por {userCount} equipos
              </p>
            )}

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

          {missingFeatures.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-neutral-800/50">
              <p className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-4">
                {t("pricing.missingFeatures", "Lo que te estás perdiendo")}
              </p>
              <ul className="space-y-3">
                {missingFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 group/item">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-50 dark:bg-neutral-800/50 flex items-center justify-center mt-0.5 border border-gray-100 dark:border-neutral-700/50">
                      <Lock className="h-2.5 w-2.5 text-gray-400 dark:text-neutral-500" />
                    </div>
                    <span className="text-sm text-gray-400 dark:text-neutral-500 italic">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-6">
          <div>
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
          </div>
          <Button
            onClick={() => onSelectPlan(plan.id)}
            disabled={
              isCurrentPlan ||
              isLoading ||
              (!plan.enabled && plan.requires_stripe) ||
              isDowngradeBlocked
            }
            variant={isPopular ? "primary" : "ghost"}
            buttonStyle={isPopular ? "solid" : "outline"}
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
        </CardFooter>
      </Card>
    </div>
  );
}
