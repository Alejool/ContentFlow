import type { LucideIcon } from 'lucide-react';

// ── Tab identifier ────────────────────────────────────────────────
export type SettingsTab =
  | 'overview'
  | 'usage'
  | 'general'
  | 'members'
  | 'roles'
  | 'integrations'
  | 'approvals'
  | 'white-label'
  | 'api'
  | 'support';

// ── Tab definition (used by SettingsTabs component) ───────────────
export interface TabDefinition {
  id: SettingsTab;
  label: string;
  icon: LucideIcon;
  locked?: boolean;
  planRequired?: string[];
}

// ── Workspace shapes ──────────────────────────────────────────────
export interface WorkspaceUser {
  id: number | string;
  pivot?: {
    role?: { slug?: string };
    role_id?: number;
  };
  role?: { slug?: string };
}

export interface WorkspaceFeatures {
  white_label?: boolean;
  approval_workflows?: string;
  [key: string]: unknown;
}

export interface WorkspaceSubscription {
  plan?: string;
}

export interface SettingsWorkspace {
  id: number | string;
  name: string;
  created_by: number | string;
  created_at: string;
  description: string | null;
  public: boolean;
  allow_public_invites: boolean;
  users?: WorkspaceUser[];
  features?: WorkspaceFeatures;
  workspace?: number;
  subscription?: WorkspaceSubscription;
  /** Legacy plan field (fallback) */
  plan?: string;
}

// ── Auth shape ────────────────────────────────────────────────────
export interface SettingsAuthUser {
  id: number | string;
  name: string;
  email: string;
}

export interface SettingsAuth {
  user: SettingsAuthUser;
}

// ── Role / Permission shapes ──────────────────────────────────────
export interface SettingsRole {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  is_system_role?: boolean | null;
  permissions?: SettingsPermission[];
}

export interface SettingsPermission {
  id: number;
  name: string;
  display_name?: string | null;
  description?: string | null;
}

// ── Page props (from Inertia) ─────────────────────────────────────
export interface WorkspaceSettingsProps {
  workspace: SettingsWorkspace;
  roles?: SettingsRole[];
  permissions?: SettingsPermission[];
  auth: SettingsAuth;
  /** Alias passed by some routes */
  current_workspace?: SettingsWorkspace;
}
