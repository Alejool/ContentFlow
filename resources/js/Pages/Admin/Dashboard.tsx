import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import AdminNavigation from "@/Components/Admin/AdminNavigation";
import SystemStatusCard from "@/Components/Admin/SystemStatusCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import Button from "@/Components/common/Modern/Button";
import {
  Settings,
  Bell,
  Users,
  TrendingUp,
  Activity,
  Database,
  Zap,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface SystemStatus {
  plans: Record<string, boolean>;
  addons: Record<string, boolean>;
  features: Record<string, boolean>;
  integrations: Record<string, boolean>;
  general: {
    maintenance_mode: boolean;
    new_registrations: boolean;
  };
}

interface Stats {
  total_users: number;
  active_subscriptions: number;
  total_publications: number;
  system_health: "healthy" | "warning" | "critical";
}

interface Props {
  systemStatus: SystemStatus;
  stats?: Stats;
}

export default function AdminDashboard({ systemStatus, stats }: Props) {
  const { t } = useTranslation();

  const quickActions = [
    {
      title: t("admin.navigation.system_settings"),
      description: t("admin.system_settings.page_description"),
      icon: Settings,
      href: "/admin/system-settings",
      gradient: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: t("admin.navigation.system_notifications"),
      description: t("admin.system_notifications.page_subtitle"),
      icon: Bell,
      href: "/admin/system-notifications",
      gradient: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  ];

  const systemMetrics = [
    {
      title: t("admin.dashboard.metrics.total_users"),
      value: stats?.total_users || 0,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      title: t("admin.dashboard.metrics.active_subscriptions"),
      value: stats?.active_subscriptions || 0,
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      borderColor: "border-green-200 dark:border-green-800",
    },
    {
      title: t("admin.dashboard.metrics.publications"),
      value: stats?.total_publications || 0,
      icon: Database,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      borderColor: "border-purple-200 dark:border-purple-800",
    },
    {
      title: t("admin.dashboard.metrics.system_health"),
      value:
        stats?.system_health === "healthy"
          ? t("admin.dashboard.metrics.healthy")
          : t("admin.dashboard.metrics.review"),
      icon: Activity,
      color:
        stats?.system_health === "healthy"
          ? "text-green-600 dark:text-green-400"
          : "text-yellow-600 dark:text-yellow-400",
      bgColor:
        stats?.system_health === "healthy"
          ? "bg-green-100 dark:bg-green-900/30"
          : "bg-yellow-100 dark:bg-yellow-900/30",
      borderColor:
        stats?.system_health === "healthy"
          ? "border-green-200 dark:border-green-800"
          : "border-yellow-200 dark:border-yellow-800",
    },
  ];

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-center text-gray-900 dark:text-gray-100 text-3xl mt-2">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">
              {t("admin.dashboard.title")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("admin.dashboard.subtitle")}
            </p>
          </div>
        </div>
      }
    >
      <Head title={t("admin.dashboard.title")} />

      <AdminNavigation currentRoute="/admin/dashboard" />

      <div className="py-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* System Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {systemMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card
                  key={metric.title}
                  className={`bg-white dark:bg-gray-800 border ${metric.borderColor} hover:shadow-lg transition-shadow`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {metric.title}
                        </p>
                        <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                          {metric.value}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                        <Icon className={`h-6 w-6 ${metric.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t("admin.dashboard.quick_actions")}
              </h3>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Card
                    key={action.title}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 group"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-xl ${action.iconBg} group-hover:scale-110 transition-transform`}
                          >
                            <Icon className={`h-6 w-6 ${action.iconColor}`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              {action.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {action.description}
                            </p>
                          </div>
                        </div>
                        <Link href={action.href}>
                          <Button
                            className="group-hover:translate-x-1 transition-transform"
                            icon={ArrowRight}
                            iconPosition="right"
                          >
                            {t("admin.dashboard.access")}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Recent Activity */}
              <Card className="mt-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">
                    {t("admin.dashboard.recent_activity")}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Últimos cambios en la configuración del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {t("admin.dashboard.activity.system_started")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {t("admin.dashboard.activity.config_loaded")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-purple-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {t("admin.dashboard.activity.cache_optimized")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                {t("admin.dashboard.system_status")}
              </h3>
              <SystemStatusCard status={systemStatus} />

              {/* Quick Info */}
              <Card className="">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    {t("admin.dashboard.quick_info")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {t("admin.dashboard.info.exclusive_access")}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {t("admin.dashboard.info.exclusive_description")}
                    </p>
                  </div>
                  <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {t("admin.dashboard.info.realtime_changes")}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {t("admin.dashboard.info.realtime_description")}
                    </p>
                  </div>
                  <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {t("admin.dashboard.info.full_audit")}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {t("admin.dashboard.info.audit_description")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
