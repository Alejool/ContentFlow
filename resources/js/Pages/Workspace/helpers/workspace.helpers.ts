import {
  CheckCircle,
  Key,
  Palette,
  Settings as SettingsIcon,
  Share2,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { SettingsAuth, SettingsTab, SettingsWorkspace, TabDefinition, WorkspaceUser } from './workspace.types';

// ── Role / permission resolution ──────────────────────────────────

/** Resolves the current user's role slug inside a workspace. */
export function resolveUserRole(workspace: SettingsWorkspace, auth: SettingsAuth): string {
  if (!workspace.users) return 'member';

  // The backend can return users as a keyed object instead of an array — handle both.
  const rawUsers = workspace.users as WorkspaceUser[] | Record<string, WorkspaceUser>;
  const users = Array.isArray(rawUsers) ? rawUsers : Object.values(rawUsers);

  const me = users.find((u) => Number(u.id) === Number(auth.user.id));
  return me?.pivot?.role?.slug ?? me?.role?.slug ?? 'member';
}

export function resolveIsOwner(
  workspace: SettingsWorkspace,
  auth: SettingsAuth,
  userRole: string,
): boolean {
  return Number(workspace.created_by) === Number(auth.user.id) || userRole === 'owner';
}

// ── Plan resolution ───────────────────────────────────────────────

/** Returns the lowercased plan id with sensible fallbacks. */
export function resolvePlanId(workspace: SettingsWorkspace): string {
  return (workspace.subscription?.plan ?? workspace.plan ?? 'demo').toLowerCase();
}

/** Returns true only when the workspace qualifies for approval workflows. */
export function resolveApprovalAccess(workspace: SettingsWorkspace, planId: string): boolean {
  const feature = workspace.features?.approval_workflows;
  if (feature !== undefined) {
    return feature === 'advanced';
  }
  return planId === 'enterprise';
}

// ── Tab builder ───────────────────────────────────────────────────

interface BuildTabsOptions {
  t: (key: string) => string;
  canManageWorkspace: boolean;
  hasApprovalAccess: boolean;
  isEnterprise: boolean;
  isOwner: boolean;
}

/** Returns the ordered tab list based on the current user's access. */
export function buildTabs(opts: BuildTabsOptions): TabDefinition[] {
  const { t, canManageWorkspace, hasApprovalAccess, isEnterprise, isOwner } = opts;

  const tabs: TabDefinition[] = [
    { id: 'overview', label: t('workspace.tabs.overview'), icon: Sparkles, locked: true },
    { id: 'usage', label: t('workspace.tabs.usage'), icon: TrendingUp },
    { id: 'general', label: t('workspace.tabs.general'), icon: SettingsIcon },
    { id: 'members', label: t('workspace.tabs.members'), icon: Users },
    { id: 'roles', label: t('workspace.tabs.roles'), icon: Shield },
    { id: 'integrations', label: t('workspace.tabs.integrations'), icon: Share2 },
  ];

  if (canManageWorkspace && hasApprovalAccess) {
    tabs.splice(4, 0, {
      id: 'approvals',
      label: t('workspace.tabs.approvals'),
      icon: CheckCircle,
      planRequired: ['enterprise'],
    });
  }

  if (canManageWorkspace) {
    tabs.push(
      {
        id: 'white-label',
        label: t('workspace.tabs.white_label'),
        icon: Palette,
        planRequired: ['enterprise'],
      },
      {
        id: 'api',
        label: t('workspace.tabs.api'),
        icon: Key,
        planRequired: ['enterprise'],
      },
    );
  }

  return tabs;
}

// ── Tab order persistence ─────────────────────────────────────────

const storageKey = (workspaceId: number | string) => `workspace_${workspaceId}_tab_order`;

export function loadTabOrder(workspaceId: number | string): SettingsTab[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(storageKey(workspaceId));
    return saved ? (JSON.parse(saved) as SettingsTab[]) : [];
  } catch {
    return [];
  }
}

export function saveTabOrder(workspaceId: number | string, order: SettingsTab[]): void {
  localStorage.setItem(storageKey(workspaceId), JSON.stringify(order));
}