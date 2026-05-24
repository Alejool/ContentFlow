// ── Domain types ────────────────────────────────────────────────

export interface MemberRole {
  id: number;
  name: string;
  slug: string;
}

export interface WorkspaceMember {
  id: number;
  name: string;
  email: string;
  photo_url?: string;
  pivot?: {
    role_id: number;
    role?: { slug: string; name: string };
  };
  role?: { slug: string; name: string };
}

export interface MembersWorkspace {
  id: number | string;
  users?: WorkspaceMember[];
}

// ── Component props ─────────────────────────────────────────────

export interface MembersManagementProps {
  workspace: MembersWorkspace;
  roles?: MemberRole[];
  canManageMembers?: boolean;
}

// ── Stats ───────────────────────────────────────────────────────

export interface MembersStats {
  total: number;
  byRole: Record<string, number>;
}

// ── Hook return type ─────────────────────────────────────────────

export interface RoleOption {
  value: string;
  label: string;
  roleId: number;
}
