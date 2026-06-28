import type { QuickAction, StatItem, WorkspaceTab } from '@/types/Workspace/overviewTab';
import type { OverviewWorkspace } from '@/types/Workspace/overviewTab';
import { Activity, SettingsIcon, Share2, UserPlus, Users, Zap } from 'lucide-react';

// ── Quick actions ─────────────────────────────────────────────────
// All icons use primary color variations — no extra palette colors.
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
    gradient: 'from-primary-500 to-primary-600',
    iconBg: 'bg-primary-50 dark:bg-primary-500/10',
    iconColor: 'text-primary-600 dark:text-primary-400',
  },
  {
    key: 'share',
    icon: Share2,
    label: t('workspace.quick_actions.share_workspace'),
    description: t('workspace.quick_actions.share_workspace_description'),
    action: () => onTabChange('general'),
    gradient: 'from-primary-500 to-primary-600',
    iconBg: 'bg-primary-100 dark:bg-primary-500/15',
    iconColor: 'text-primary-700 dark:text-primary-300',
  },
  {
    key: 'settings',
    icon: SettingsIcon,
    label: t('workspace.quick_actions.settings'),
    description: t('workspace.quick_actions.settings_description'),
    action: () => onTabChange('general'),
    gradient: 'from-primary-500 to-primary-600',
    iconBg: 'bg-primary-50 dark:bg-primary-500/10',
    iconColor: 'text-primary-600 dark:text-primary-400',
  },
  {
    key: 'integrations',
    icon: Zap,
    label: t('workspace.quick_actions.integrations'),
    description: t('workspace.quick_actions.integrations_description'),
    action: () => onTabChange('integrations'),
    gradient: 'from-primary-500 to-primary-600',
    iconBg: 'bg-primary-100 dark:bg-primary-500/15',
    iconColor: 'text-primary-700 dark:text-primary-300',
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
      color: 'primary',
    },
    {
      key: 'integrations',
      icon: Activity,
      label: t('workspace.stats.active_integrations'),
      value: activeIntegrations,
      color: 'primary',
    },
  ];
};
