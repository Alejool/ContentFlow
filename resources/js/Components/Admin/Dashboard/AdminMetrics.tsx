import StatCard from '@/Components/common/Modern/StatCard';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  LayoutDashboard,
  Share2,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface Stats {
  total_users: number;
  new_users_30d: number;
  new_users_7d: number;
  verified_users: number;
  unverified_users: number;
  total_workspaces: number;
  active_workspaces_30d: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  subscriptions_by_plan: Record<string, number>;
  total_publications: number;
  published_publications: number;
  failed_publications: number;
  pending_review: number;
  new_publications_30d: number;
  total_social_accounts: number;
  social_accounts_by_platform: Record<string, number>;
  system_health: 'healthy' | 'warning' | 'critical';
  system_health_issues: string[];
}

interface AdminMetricsProps {
  stats?: Stats | undefined;
}

const healthConfig = {
  healthy: {
    icon: CheckCircle,
    color: 'green',
  },
  warning: {
    icon: AlertTriangle,
    color: 'yellow',
  },
  critical: {
    icon: XCircle,
    color: 'red',
  },
} as const;

export default function AdminMetrics({ stats }: AdminMetricsProps) {
  const { t } = useTranslation();

  const health = stats?.system_health ?? 'healthy';
  const healthCfg = healthConfig[health];
  const HealthIcon = healthCfg.icon;

  const primaryMetrics = [
    {
      label: t('admin.dashboard.metrics.total_users'),
      value: stats?.total_users ?? 0,
      sub: `+${stats?.new_users_30d ?? 0} ${t('admin.dashboard.time_periods.last_30d')} · +${stats?.new_users_7d ?? 0} ${t('admin.dashboard.time_periods.last_7d')}`,
      icon: Users,
      color: 'blue' as const,
    },
    {
      label: t('admin.dashboard.metrics.active_subscriptions'),
      value: stats?.active_subscriptions ?? 0,
      ...(stats?.trial_subscriptions && {
        sub: `${stats.trial_subscriptions} ${t('admin.dashboard.status.on_trial')}`,
      }),
      icon: TrendingUp,
      color: 'green' as const,
    },
    {
      label: t('admin.dashboard.metrics.publications'),
      value: stats?.total_publications ?? 0,
      sub: `${stats?.published_publications ?? 0} ${t('admin.dashboard.status.published')} · ${stats?.new_publications_30d ?? 0} ${t('admin.dashboard.time_periods.new_30d')}`,
      icon: FileText,
      color: 'purple' as const,
    },
    // {
    //   label: t('admin.dashboard.metrics.system_health'),
    //   value: t(`admin.dashboard.health_status.${health}`),
    //   ...(stats?.system_health_issues?.length
    //     ? { sub: stats.system_health_issues[0] }
    //     : { sub: t('admin.dashboard.status.all_systems_operational') }),
    //   icon: HealthIcon,
    //   color: healthCfg.color,
    // },
  ];

  const secondaryMetrics = [
    {
      label: t('admin.dashboard.metrics.workspaces'),
      value: stats?.total_workspaces ?? 0,
      sub: `${stats?.active_workspaces_30d ?? 0} ${t('admin.dashboard.time_periods.active_last_30d')}`,
      icon: LayoutDashboard,
      color: 'indigo' as const,
    },
    {
      label: t('admin.dashboard.metrics.verified_users'),
      value: stats?.verified_users ?? 0,
      sub: `${stats?.unverified_users ?? 0} ${t('admin.dashboard.status.unverified')}`,
      icon: UserCheck,
      color: 'teal' as const,
    },
    {
      label: t('admin.dashboard.metrics.social_accounts'),
      value: stats?.total_social_accounts ?? 0,
      ...(Object.entries(stats?.social_accounts_by_platform ?? {}).length > 0 && {
        sub: Object.entries(stats!.social_accounts_by_platform)
          .map(([p, n]) => `${p}: ${n}`)
          .join(' · '),
      }),
      icon: Share2,
      color: 'pink' as const,
    },
    {
      label: t('admin.dashboard.metrics.pending_review'),
      value: stats?.pending_review ?? 0,
      sub: stats?.failed_publications
        ? `${stats.failed_publications} ${t('admin.dashboard.status.failed')}`
        : t('admin.dashboard.status.no_failures'),
      icon: Clock,
      color: ((stats?.pending_review ?? 0) > 0 ? 'yellow' : 'gray') as any,
    },
  ];

  return (
    <>
      {/* Primary KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {primaryMetrics.map((m) => (
          <StatCard key={m.label} {...m} />
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {secondaryMetrics.map((m) => (
          <StatCard key={m.label} {...m} />
        ))}
      </div>
    </>
  );
}
