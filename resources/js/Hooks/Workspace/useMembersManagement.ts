/**
 * useMembersManagement
 *
 * Encapsulates all data-fetching and mutation logic for the workspace
 * members management UI. The component stays as pure JSX composition.
 *
 * `canManageMembers` must be passed in from the parent page (Settings.tsx),
 * which is the single source of truth for permission logic.
 */

import {
  useRemoveWorkspaceMember,
  useUpdateMemberRole,
  useWorkspaceMembers,
} from '@/Hooks/Workspace/useWorkspaceMembers';
import type {
  MemberRole,
  MembersManagementProps,
  MembersStats,
  RoleOption,
} from '@/types/Workspace/MembersManagement';
import type { WorkspaceMember } from '@/Hooks/Workspace/useWorkspaceMembers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildStats(members: WorkspaceMember[]): MembersStats {
  const byRole: Record<string, number> = {};
  for (const m of members) {
    const slug = m.pivot?.role?.slug ?? m.role?.slug ?? 'unknown';
    byRole[slug] = (byRole[slug] ?? 0) + 1;
  }
  return { total: members.length, byRole };
}

function buildRoleOptions(roles: MemberRole[]): RoleOption[] {
  return roles.map((r) => ({
    value: String(r.id),
    label: r.name,
    roleId: r.id,
    slug: r.slug,
  }));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMembersManagement(
  workspace: MembersManagementProps['workspace'],
  roles: MemberRole[] = [],
  /** Passed from parent (Settings page) which owns the permission logic */
  canManageMembers = false,
) {
  const workspaceId = Number(workspace.id);

  // ── Queries & mutations ────────────────────────────────────────
  const { data: members = [], isLoading } = useWorkspaceMembers(workspaceId);

  const updateRoleMutation = useUpdateMemberRole(workspaceId, roles);
  const removeMemberMutation = useRemoveWorkspaceMember(workspaceId);

  // ── Derived values ─────────────────────────────────────────────
  const stats = buildStats(members);
  const roleOptions = buildRoleOptions(roles);

  // ── Handlers ──────────────────────────────────────────────────

  const handleRoleChange = (userId: number, roleId: number) => {
    updateRoleMutation.mutate({ userId, roleId });
  };

  return {
    members,
    isLoading,
    stats,
    roleOptions,
    canManageMembers,
    currentWorkspace: workspace,
    /** Id of the workspace creator — used to detect owner independently of role slug */
    ownerId: workspace.created_by,
    handleRoleChange,
    removeMemberMutation,
  };
}

