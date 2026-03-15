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
  FileText,
  HardDrive,
  Key,
  Palette,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDateString } from "@/Utils/dateHelpers";
import { useSubscriptionUsage } from "@/Hooks/useSubscriptionUsage";

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

function UsageStatsWithAddons({ usage: legacyUsage }: { usage?: any }) {
  const { t } = useTranslation();
  const { usage, loading } = useSubscriptionUsage();

  if (loading || !usage) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-primary-500";
  };

  const metrics = [
    {
      key: "publications",
      label: t("subscription.usage.publications", "Publicaciones"),
      icon: FileText,
      used: usage.publications.used,
      limit: usage.publications.limit,
      total_available: usage.publications.total_available,
      percentage: usage.publications.percentage,
      addon_info: usage.publications.addon_info,
      show: true,
    },
    {
      key: "storage",
      label: t("subscription.usage.storage", "Almacenamiento"),
      icon: HardDrive,
      used: formatBytes(usage.storage.used_bytes),
      limit: `${usage.storage.limit_gb} GB`,
      total_available: `${usage.storage.total_available_gb} GB`,
      percentage: usage.storage.percentage,
      addon_info: usage.storage.addon_info,
      show: true,
    },
    {
      key: "ai_requests",
      label: t("subscription.addons.aiCredits", "Créditos IA"),
      icon: Sparkles,
      used: usage.ai_requests.used,
      limit:
        usage.ai_requests.limit === -1 || usage.ai_requests.limit === null
          ? "∞"
          : usage.ai_requests.limit,
      total_available:
        usage.ai_requests.total_available === -1 ||
        usage.ai_requests.total_available === null
          ? "∞"
          : usage.ai_requests.total_available,
      percentage: usage.ai_requests.percentage || 0,
      addon_info: usage.ai_requests.addon_info,
      show: usage.ai_requests.limit !== null && usage.ai_requests.limit !== -1,
    },
    {
      key: "social_accounts",
      label: t("subscription.addons.socialAccounts", "Cuentas Sociales"),
      icon: Share2,
      used: usage.social_accounts.used,
      limit:
        usage.social_accounts.limit === -1 ? "∞" : usage.social_accounts.limit,
      total_available:
        usage.social_accounts.total_available === -1
          ? "∞"
          : usage.social_accounts.total_available,
      percentage: usage.social_accounts.percentage,
      show: true,
    },
    {
      key: "team_members",
      label: t("subscription.addons.teamMembers", "Miembros del Equipo"),
      icon: Users,
      used: usage.team_members?.used || 0,
      limit:
        usage.team_members?.limit === -1 || !usage.team_members?.limit
          ? "∞"
          : usage.team_members.limit,
      total_available:
        usage.team_members?.total_available === -1 ||
        !usage.team_members?.total_available
          ? "∞"
          : usage.team_members.total_available,
      percentage: usage.team_members?.percentage || 0,
      show: usage.team_members?.limit !== undefined,
    },
  ].filter((metric) => metric.show);

  return (
    <div className="space-y-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div key={metric.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {metric.label}
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {metric.limit === "∞" || metric.limit === -1
                  ? `${metric.used} / ∞`
                  : `${metric.used} / ${metric.total_available || metric.limit}`}
              </span>
            </div>

            {metric.limit !== "∞" && metric.limit !== -1 && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressBarColor(metric.percentage)}`}
                  style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                />
              </div>
            )}

            {/* Mostrar desglose de addons si existen */}
            {metric.addon_info && metric.addon_info.total > 0 && (
              <div className="text-xs text-primary-600 dark:text-primary-400">
                <span className="font-medium">Plan:</span> {metric.limit} +
                <span className="font-medium"> Addons:</span>{" "}
                {metric.addon_info.remaining}/{metric.addon_info.total}
                {metric.key === "storage" && " GB"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
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
          <Badge variant="default" className="bg-green-500 text-white">
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
    return formatDateString(dateString, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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
          <UsageStatsWithAddons usage={usage} />
        </CardContent>
      </Card>

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
