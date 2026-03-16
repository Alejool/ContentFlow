import { Card, CardContent } from '@/Components/ui/card';
import {
    AlertTriangle,
    CheckCircle,
    XCircle
} from 'lucide-react';

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
  // Users
  total_users: number;
  new_users_30d: number;
  new_users_7d: number;
  verified_users: number;
  unverified_users: number;
  // Workspaces
  total_workspaces: number;
  active_workspaces_30d: number;
  // Subscriptions
  active_subscriptions: number;
  trial_subscriptions: number;
  subscriptions_by_plan: Record<string, number>;
  // Publications
  total_publications: number;
  published_publications: number;
  failed_publications: number;
  pending_review: number;
  new_publications_30d: number;
  // Social
  total_social_accounts: number;
  social_accounts_by_platform: Record<string, number>;
  // Health
  system_health: 'healthy' | 'warning' | 'critical';
  system_health_issues: string[];
}

interface RecentActivity {
  key: string;
  label: string;
  category: string;
  value: boolean | string | number;
  updated_at: string;
  updated_by: string;
}

interface Props {
  systemStatus: SystemStatus;
  stats?: Stats;
  recentActivity?: RecentActivity[];
}

const healthConfig = {
  healthy: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    label: 'Healthy',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    label: 'Warning',
  },
  critical: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    label: 'Critical',
  },
};

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
  bg,
  border,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <Card className={`border bg-white dark:bg-gray-800 ${border} transition-shadow hover:shadow-lg`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">{sub}</p>}
          </div>
          <div className={`ml-3 shrink-0 rounded-lg p-3 ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function categoryDot(category: string) {
  const map: Record<string, string> = {
    plans: 'bg-blue-500',
    addons: 'bg-purple-500',
    features: 'bg-green-500',
    integrations: 'bg-orange-500',
    payment_methods: 'bg-pink-500',
    general: 'bg-gray-500',
  };
  return map[category] ?? 'bg-gray-400';
}

export default function AdminDashboard({ systemStatus, stats, recentActivity = [] }: Props) {
  const { t } = useTranslation();

  const health = stats?.system_health ?? 'healthy';
  const healthCfg = healthConfig[health];
  const HealthIcon = healthCfg.icon;

  const quickActions = [
    {
      title: t('admin.navigation.system_settings'),
      description: t('admin.system_settings.page_description'),
      icon: Settings,
      href: '/admin/system-settings',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: t('admin.navigation.system_notifications'),
      description: t('admin.system_notifications.page_subtitle'),
      icon: Bell,
      href: '/admin/system-notifications',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ];

  // Top row: 4 primary KPIs
  const primaryMetrics = [
    {
      title: t('admin.dashboard.metrics.total_users'),
      value: stats?.total_users ?? 0,
      sub: `+${stats?.new_users_30d ?? 0} last 30d · +${stats?.new_users_7d ?? 0} last 7d`,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-800',
    },
    {
      title: t('admin.dashboard.metrics.active_subscriptions'),
      value: stats?.active_subscriptions ?? 0,
      sub: stats?.trial_subscriptions ? `${stats.trial_subscriptions} on trial` : undefined,
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
      border: 'border-green-200 dark:border-green-800',
    },
    {
      title: t('admin.dashboard.metrics.publications'),
      value: stats?.total_publications ?? 0,
      sub: `${stats?.published_publications ?? 0} published · ${stats?.new_publications_30d ?? 0} new 30d`,
      icon: FileText,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      border: 'border-purple-200 dark:border-purple-800',
    },
    {
      title: t('admin.dashboard.metrics.system_health'),
      value: healthCfg.label,
      sub: stats?.system_health_issues?.length
        ? stats.system_health_issues[0]
        : 'All systems operational',
      icon: HealthIcon,
      color: healthCfg.color,
      bg: healthCfg.bg,
      border: healthCfg.border,
    },
  ];

  // Second row: secondary metrics
  const secondaryMetrics = [
    {
      title: 'Workspaces',
      value: stats?.total_workspaces ?? 0,
      sub: `${stats?.active_workspaces_30d ?? 0} active last 30d`,
      icon: LayoutDashboard,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      border: 'border-indigo-200 dark:border-indigo-800',
    },
    {
      title: 'Verified Users',
      value: stats?.verified_users ?? 0,
      sub: `${stats?.unverified_users ?? 0} unverified`,
      icon: UserCheck,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-100 dark:bg-teal-900/30',
      border: 'border-teal-200 dark:border-teal-800',
    },
    {
      title: 'Social Accounts',
      value: stats?.total_social_accounts ?? 0,
      sub: Object.entries(stats?.social_accounts_by_platform ?? {})
        .map(([p, n]) => `${p}: ${n}`)
        .join(' · ') || undefined,
      icon: Share2,
      color: 'text-pink-600 dark:text-pink-400',
      bg: 'bg-pink-100 dark:bg-pink-900/30',
      border: 'border-pink-200 dark:border-pink-800',
    },
    {
      title: 'Pending Review',
      value: stats?.pending_review ?? 0,
      sub: stats?.failed_publications ? `${stats.failed_publications} failed` : 'No failures',
      icon: Clock,
      color:
        (stats?.pending_review ?? 0) > 0
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-gray-500 dark:text-gray-400',
      bg:
        (stats?.pending_review ?? 0) > 0
          ? 'bg-yellow-100 dark:bg-yellow-900/30'
          : 'bg-gray-100 dark:bg-gray-800',
      border:
        (stats?.pending_review ?? 0) > 0
          ? 'border-yellow-200 dark:border-yellow-800'
          : 'border-gray-200 dark:border-gray-700',
    },
  ];

  return (
    <AuthenticatedLayout
      header={
        <div className="mt-2 flex items-center justify-center text-3xl text-gray-900 dark:text-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">
              {t('admin.dashboard.title')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('admin.dashboard.subtitle')}
            </p>
          </div>
        </div>
      }
    >
      <Head title={t('admin.dashboard.title')} />
      <AdminNavigation currentRoute="/admin/dashboard" />

      <div className="min-h-screen bg-gray-50 py-6 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Primary KPIs */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {primaryMetrics.map((m) => (
              <StatCard key={m.title} {...m} />
            ))}
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {secondaryMetrics.map((m) => (
              <StatCard key={m.title} {...m} />
            ))}
          </div>

          {/* Health issues banner */}
          {(stats?.system_health_issues?.length ?? 0) > 0 && (
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                      System issues detected
                    </p>
                    <ul className="mt-1 space-y-0.5 text-sm text-yellow-700 dark:text-yellow-400">
                      {stats!.system_health_issues.map((issue, i) => (
                        <li key={i}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscriptions by plan */}
          {Object.keys(stats?.subscriptions_by_plan ?? {}).length > 0 && (
            <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-gray-100">
                  <Database className="h-4 w-4 text-green-500" />
                  Active subscriptions by plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(stats!.subscriptions_by_plan).map(([plan, count]) => (
                    <div
                      key={plan}
                      className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 dark:bg-gray-700"
                    >
                      <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                        {plan}
                      </span>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Quick Actions + Recent Activity */}
            <div className="space-y-4 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('admin.dashboard.quick_actions')}
              </h3>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Card
                    key={action.title}
                    className="group border-gray-200 bg-white transition-all duration-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`rounded-xl p-3 ${action.iconBg} transition-transform group-hover:scale-110`}
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
                            className="transition-transform group-hover:translate-x-1"
                            icon={ArrowRight}
                            iconPosition="right"
                          >
                            {t('admin.dashboard.access')}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Recent Activity — real data */}
              <Card className="mt-2 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">
                    {t('admin.dashboard.recent_activity')}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Latest system settings changes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                      No settings have been modified yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <div
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${categoryDot(item.category)}`}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {item.label || item.key}
                            </span>
                            <span className="mx-1 text-gray-400">→</span>
                            <span
                              className={
                                item.value === true
                                  ? 'font-semibold text-green-600 dark:text-green-400'
                                  : item.value === false
                                    ? 'font-semibold text-red-500 dark:text-red-400'
                                    : 'text-gray-600 dark:text-gray-400'
                              }
                            >
                              {String(item.value)}
                            </span>
                          </div>
                          <div className="shrink-0 text-right text-xs text-gray-400 dark:text-gray-500">
                            <div>{item.updated_by}</div>
                            <div>
                              {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* System Status + Quick Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                {t('admin.dashboard.system_status')}
              </h3>
              <SystemStatusCard status={systemStatus} />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    {t('admin.dashboard.quick_info')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {t('admin.dashboard.info.exclusive_access')}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {t('admin.dashboard.info.exclusive_description')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {t('admin.dashboard.info.realtime_changes')}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {t('admin.dashboard.info.realtime_description')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {t('admin.dashboard.info.full_audit')}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {t('admin.dashboard.info.audit_description')}
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
