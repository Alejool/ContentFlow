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
  description?: string | null;
  is_system_role?: boolean | null;
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
