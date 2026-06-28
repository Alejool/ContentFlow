// ── Domain types ──────────────────────────────────────────────────
export interface WorkspaceUser {
  id: number | string;
  pivot?: {
    role_id?: number;
    role?: { slug?: string };
  };
}

export interface Permission {
  id: number;
  name: string;
  display_name?: string | null;
  description?: string | null;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  display_name?: string | null;
  description?: string | null;
  color_hex?: string | null;
  icon_slug?: string | null;
  is_system_role?: boolean | null;
  approval_participant?: boolean | null;
  permissions?: Permission[];
}

export interface RolesWorkspace {
  id: number | string;
  users?: WorkspaceUser[];
}

// ── Component props ───────────────────────────────────────────────
export interface RolesManagementTabProps {
  roles: Role[];
  permissions: Permission[];
  workspace: RolesWorkspace;
  userRole: string;
  canManageWorkspace: boolean;
}
