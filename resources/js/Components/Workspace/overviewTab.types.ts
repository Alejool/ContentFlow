import type { LucideIcon } from 'lucide-react';

export interface OverviewWorkspaceUser {
  id: number | string;
}

export interface OverviewWorkspace {
  id: number | string;
  created_at: string;
  slack_webhook_url?: string | null;
  discord_webhook_url?: string | null;
  users?: OverviewWorkspaceUser[];
}

export type WorkspaceTab =
  | 'overview'
  | 'members'
  | 'general'
  | 'integrations'
  | 'roles'
  | 'usage';

export interface OverviewTabProps {
  workspace: OverviewWorkspace;
  onTabChange: (tab: WorkspaceTab) => void;
}

export interface QuickAction {
  key: string;
  icon: LucideIcon;
  label: string;
  description: string;
  action: () => void;
  gradient: string;
  /** Tailwind bg class for the flat icon wrapper */
  iconBg: string;
  /** Tailwind text class for the icon */
  iconColor: string;
}

export interface StatItem {
  key: string;
  icon: LucideIcon;
  label: string;
  value: number | string;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'primary';
}
