import Button from "@/Components/common/Modern/Button";
import { Badge } from "@/Components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { router, usePage } from "@inertiajs/react";
import {
  AlertCircle,
  ArrowUpCircle,
  Calendar,
  CheckCircle,
  CreditCard,
  Crown,
  HardDrive,
  Key,
  Palette,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface Invoice {
  id: string;
  date: string;
  total: number;
  status: string;
  description: string;
  invoice_pdf: string | null;
}

interface SubscriptionSectionProps {
  subscription: {
    plan_name: string;
    plan_id: string;
    status: string;
    current_period_end?: string;
    trial_ends_at: string | null;
    is_trial?: boolean;
    features?: Record<string, any>;
  } | null;
  usage?: {
    publications_used: number;
    publications_limit: number;
    storage_used: number;
    storage_limit: number;
    ai_requests_used: number;
    ai_requests_limit: number;
    social_accounts_used?: number;
    social_accounts_limit?: number;
    team_members_used?: number;
    team_members_limit?: number;
    external_integrations_used?: number;
    external_integrations_limit?: number;
  };
  billingHistory?: Invoice[];
  currentWorkspace?: any;
}

export default function SubscriptionSection({
  subscription,
  usage,
  billingHistory = [],
  currentWorkspace,
}: SubscriptionSectionProps) {
  const { t } = useTranslation();
  // Read global shared props to get the active workspace and its features.
  const { auth } = usePage<any>().props;
  const globalWorkspace = currentWorkspace ?? auth?.current_workspace;

  // Enterprise check: subscription features OR global workspace features OR plan_id
  const hasWhiteLabel =
    subscription?.features?.white_label ||
    globalWorkspace?.features?.white_label ||
    subscription?.plan_id?.toLowerCase() === "enterprise" ||
    globalWorkspace?.plan?.toLowerCase() === "enterprise";

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "free":
      case "demo":
        return <Zap className="w-5 h-5" />;
      case "starter":
        return <TrendingUp className="w-5 h-5" />;
      case "professional":
      case "enterprise":
        return <Crown className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case "free":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      case "demo":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "starter":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "professional":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "enterprise":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t("subscription.status.active")}
          </Badge>
        );
      case "trialing":
        return (
          <Badge variant="default" className="bg-blue-500">
            <Calendar className="w-3 h-3 mr-1" />
            {t("subscription.status.trialing")}
          </Badge>
        );
      case "canceled":
      case "past_due":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            {t("subscription.status.canceled")}
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculatePercentage = (used: number, limit: number) => {
    if (!limit || limit === 0 || limit === -1) return 0;
    const usedVal = used || 0;
    return Math.min((usedVal / limit) * 100, 100);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const formatDisplayValue = (value: number, type: string) => {
    if (value === undefined || value === null || isNaN(value)) return "0";
    if (type === "storage_gb") {
      if (value === -1) return "∞";
      return value.toLocaleString() + " GB";
    }
    if (value === -1) return "∞";
    return value.toString();
  };

  const metricsData = usage
    ? [
        {
          type: "publications_per_month",
          current: usage.publications_used || 0,
          limit: usage.publications_limit || 0,
          icon: <Zap className="w-4 h-4" />,
          name: t("subscription.usage.publications"),
        },
        {
          type: "storage_gb",
          current: usage.storage_used || 0,
          limit: usage.storage_limit || 0,
          icon: <HardDrive className="w-4 h-4" />,
          name: t("subscription.usage.storage"),
        },
        {
          type: "social_accounts",
          current: usage.social_accounts_used || 0,
          limit: usage.social_accounts_limit || 0,
          icon: <TrendingUp className="w-4 h-4" />,
          name: t("subscription.usage.social_accounts"),
        },
        {
          type: "team_members",
          current: usage.team_members_used || 0,
          limit: usage.team_members_limit || 0,
          icon: <Crown className="w-4 h-4" />,
          name: t("subscription.usage.team_members"),
        },
        {
          type: "external_integrations",
          current: usage.external_integrations_used || 0,
          limit: usage.external_integrations_limit || 0,
          icon: <Zap className="w-4 h-4" />,
          name: t("subscription.usage.external_integrations"),
        },
      ].filter((metric) => metric.limit !== 0 || metric.current > 0)
    : [];

  const handleUpgrade = () => {
    router.visit("/pricing");
  };

  const handleManageBilling = () => {
    router.visit(route("subscription.billing"));
  };

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {t("subscription.billing.title")}
          </CardTitle>
          <CardDescription>
            {t(
              "subscription.billing.noSubscription",
              "No tienes una suscripción activa",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleUpgrade} className="w-full">
            {t("subscription.billing.choosePlan", "Elegir un Plan")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 text-black dark:text-white">
      {/* Plan Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-lg ${getPlanColor(subscription.plan_id)}`}
              >
                {getPlanIcon(subscription.plan_id)}
              </div>
              <div>
                <CardTitle className="text-xl">
                  {subscription.plan_name}
                </CardTitle>
                <CardDescription>
                  {subscription.is_trial
                    ? t("subscription.usage.trialEndsOn", "Plan de prueba")
                    : t("subscription.billing.currentPlan")}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(subscription.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Trial or Renewal Date */}
          {subscription.trial_ends_at && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {t("subscription.usage.trialEndsOn")}:{" "}
                {formatDate(subscription.trial_ends_at)}
              </span>
            </div>
          )}

          {subscription.current_period_end && !subscription.is_trial && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t("subscription.billing.renewsOn")}:{" "}
                {formatDate(subscription.current_period_end)}
              </span>
            </div>
          )}

          {/* Billing period progress bar */}
          {subscription.current_period_end &&
            !subscription.is_trial &&
            (() => {
              const now = new Date();
              const periodEnd = new Date(subscription.current_period_end);
              // Assume monthly period (30 days)
              const periodStart = new Date(periodEnd);
              periodStart.setDate(periodStart.getDate() - 30);
              const totalMs = periodEnd.getTime() - periodStart.getTime();
              const elapsedMs = now.getTime() - periodStart.getTime();
              const elapsedPct = Math.min(
                100,
                Math.max(0, (elapsedMs / totalMs) * 100),
              );
              const daysLeft = Math.max(
                0,
                Math.ceil(
                  (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                ),
              );
              return (
                <div className="p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-lg border border-gray-100 dark:border-neutral-700/50 space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Periodo de facturación</span>
                    <span className="font-semibold">
                      {daysLeft} {daysLeft === 1 ? "día" : "días"} restantes
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-500 dark:bg-primary-400 transition-all duration-500"
                      style={{ width: `${elapsedPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Inicio</span>
                    <span>
                      Renovación: {formatDate(subscription.current_period_end)}
                    </span>
                  </div>
                </div>
              );
            })()}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {(subscription.plan_id === "free" ||
              subscription.plan_id === "demo") && (
              <Button
                onClick={handleUpgrade}
                variant="primary"
                size="md"
                icon={ArrowUpCircle}
                className="shadow-md"
              >
                {t("subscription.actions.upgrade", "Actualizar Plan")}
              </Button>
            )}

            {subscription.plan_id !== "free" &&
              subscription.plan_id !== "demo" && (
                <Button
                  onClick={handleManageBilling}
                  variant="primary"
                  size="md"
                  icon={CreditCard}
                  className="shadow-md"
                >
                  {t(
                    "subscription.actions.manageBilling",
                    "Gestionar Facturación",
                  )}
                </Button>
              )}

            <Button
              onClick={handleUpgrade}
              variant="ghost"
              buttonStyle="outline"
              size="md"
              icon={TrendingUp}
              className="shadow-md"
            >
              {t("subscription.actions.viewPlans", "Ver Todos los Planes")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics Card */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-500" />
              {t("subscription.usage.planUsage", "Uso del Plan")}
            </CardTitle>
            <CardDescription>
              {t(
                "subscription.usage.monitorConsumption",
                "Monitorea tu consumo mensual",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {metricsData.map((metric) => {
                const percentage = calculatePercentage(
                  metric.current,
                  metric.limit,
                );
                const displayCurrent = formatDisplayValue(
                  metric.current,
                  metric.type,
                );
                const displayLimit = formatDisplayValue(
                  metric.limit,
                  metric.type,
                );

                const remaining =
                  metric.limit === -1
                    ? -1
                    : Math.max(0, metric.limit - metric.current);
                const displayRemaining = formatDisplayValue(
                  remaining,
                  metric.type,
                );

                return (
                  <div
                    key={metric.type}
                    className={`p-4 rounded-lg border space-y-3 ${
                      percentage >= 80
                        ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30"
                        : "bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/10 dark:to-primary-800/5 border-primary-200/50 dark:border-primary-800/20"
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                        <div className=" rounded-md ">{metric.icon}</div>
                        <span>{metric.name}</span>
                        {percentage >= 80 && percentage < 100 && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" /> 80% usado
                          </span>
                        )}
                        {percentage >= 100 && (
                          <span className="text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" /> Límite
                            alcanzado
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-gray-900 text-xs dark:text-white">
                        {displayCurrent} / {displayLimit}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percentage >= 90
                              ? "bg-red-500"
                              : percentage >= 70
                                ? "bg-yellow-500"
                                : "bg-primary-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400">
                        <span>
                          {metric.limit === -1
                            ? t("subscription.usage.unlimited", "Ilimitado")
                            : `${displayRemaining} ${t("subscription.usage.remaining", "restante")}`}
                        </span>
                        <span className="font-semibold">
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enterprise Features (API & White-label) - Checks subscription, global workspace, and plan ID */}
      {hasWhiteLabel && (
        <Card className="border-primary-500/30 bg-primary-50/10 dark:bg-primary-900/10 overflow-hidden">
          <CardHeader className="bg-primary-500/5 border-b border-primary-500/10">
            <CardTitle className="text-lg flex items-center gap-2 text-primary-700 dark:text-primary-400">
              <Sparkles className="w-5 h-5" />
              {t("subscription.enterprise.title", "Características Enterprise")}
            </CardTitle>
            <CardDescription className="text-primary-600/70 dark:text-primary-400/60">
              {t(
                "subscription.enterprise.description",
                "Gestiona las funciones exclusivas de tu plan corporativo",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() =>
                  router.get(
                    route("workspaces.settings", {
                      workspace: currentWorkspace?.slug,
                      tab: "white-label",
                    }),
                  )
                }
                className="group cursor-pointer p-4 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-white dark:bg-neutral-900 hover:border-primary-500 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">
                    <Palette className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {t("workspace.tabs.white_label", "Marca Blanca")}
                  </h4>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t(
                    "workspace.white_label.description",
                    "Personaliza los reportes y correos con tu propio logotipo y colores corporativos.",
                  )}
                </p>
              </div>

              <div
                onClick={() =>
                  router.get(
                    route("workspaces.settings", {
                      workspace: currentWorkspace?.slug,
                      tab: "api",
                    }),
                  )
                }
                className="group cursor-pointer p-4 rounded-xl border border-primary-200/50 dark:border-primary-800/30 bg-white dark:bg-neutral-900 hover:border-primary-500 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {t("workspace.tabs.api", "Acceso API")}
                  </h4>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t(
                    "workspace.api.description",
                    "Conecta tus aplicaciones externas y automatiza publicaciones mediante nuestra API segura.",
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing History Card */}
      {billingHistory && billingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-500" />
              {t(
                "subscription.usage.billingHistory",
                "Historial de Facturación",
              )}
            </CardTitle>
            <CardDescription>
              {t(
                "subscription.usage.billingHistoryDescription",
                "Tus últimas facturas y pagos",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {billingHistory.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 border border-gray-100 dark:border-neutral-800 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-gray-100 dark:bg-neutral-800 text-gray-500">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {invoice.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(invoice.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      ${invoice.total.toFixed(2)}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 h-4 border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                    >
                      {t(
                        `subscription.status.${invoice.status}`,
                        invoice.status,
                      )}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
