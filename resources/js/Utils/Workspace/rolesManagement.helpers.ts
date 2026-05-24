import type { Role, RolesWorkspace } from '@/types/Workspace/rolesManagement';

// Slugs that can never be edited
const PROTECTED_EDIT_SLUGS = ['owner', 'admin', 'editor'] as const;

// Slugs that can never be deleted
const PROTECTED_DELETE_SLUGS = ['owner', 'admin', 'editor'] as const;

// Slugs that show the "Protected" badge
const PROTECTED_BADGE_SLUGS = ['owner', 'admin', 'editor'] as const;

export const canEditRole = (role: Role): boolean =>
  !(PROTECTED_EDIT_SLUGS as readonly string[]).includes(role.slug);

export const canDeleteRole = (role: Role): boolean => {
  if (role.is_system_role) return false;
  return !(PROTECTED_DELETE_SLUGS as readonly string[]).includes(role.slug);
};

export const isProtectedRole = (role: Role): boolean =>
  !!role.is_system_role ||
  (PROTECTED_BADGE_SLUGS as readonly string[]).includes(role.slug);

export const getMemberCount = (workspace: RolesWorkspace, roleId: number): number =>
  workspace.users?.filter((u) => u.pivot?.role_id === roleId).length ?? 0;
