import type { QuickAction, StatItem, WorkspaceTab } from './overviewTab.types';
import type { OverviewWorkspace } from './overviewTab.types';
import { Activity, SettingsIcon, Share2, UserPlus, Users, Zap } from 'lucide-react';

// ── Quick actions ─────────────────────────────────────────────────
export const buildQuickActions = (
  onTabChange: (tab: WorkspaceTab) => void,
  t: (key: string) => string,
): QuickAction[] => [
  {
    key: 'invite',
    icon: UserPlus,
    label: t('workspace.quick_actions.invite_members'),
    description: t('workspace.quick_actions.invite_members_description'),
    action: () => onTabChange('members'),
    gradient: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'share',
    icon: Share2,
    label: t('workspace.quick_actions.share_workspace'),
    description: t('workspace.quick_actions.share_workspace_description'),
    action: () => onTabChange('general'),
    gradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-50 dark:bg-violet-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    key: 'settings',
    icon: SettingsIcon,
    label: t('workspace.quick_actions.settings'),
    description: t('workspace.quick_actions.settings_description'),
    action: () => onTabChange('general'),
    gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'integrations',
    icon: Zap,
    label: t('workspace.quick_actions.integrations'),
    description: t('workspace.quick_actions.integrations_description'),
    action: () => onTabChange('integrations'),
    gradient: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
];

// ── Stats ─────────────────────────────────────────────────────────
export const buildStats = (
  workspace: OverviewWorkspace,
  t: (key: string) => string,
): StatItem[] => {
  const activeIntegrations = [
    workspace.slack_webhook_url,
    workspace.discord_webhook_url,
  ].filter(Boolean).length;

  return [
    {
      key: 'members',
      icon: Users,
      label: t('workspace.stats.total_members'),
      value: workspace.users?.length ?? 0,
      color: 'blue',
    },
    {
      key: 'integrations',
      icon: Activity,
      label: t('workspace.stats.active_integrations'),
      value: activeIntegrations,
      color: 'green',
    },
  ];
};
