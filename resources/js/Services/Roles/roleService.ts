import axios from 'axios';
import { route } from 'ziggy-js';

export interface UpdateRolePayload {
  permission_ids: number[];
  color_hex?: string;
}

export const roleService = {
  assign: (workspaceId: number | string, userId: number, roleId: number): Promise<void> =>
    axios
      .post(route('api.v1.workspaces.roles.assign', { idOrSlug: workspaceId }), {
        user_id: userId,
        role_id: roleId,
      })
      .then(() => undefined),

  update: (
    workspaceId: number | string,
    roleId: number,
    payload: UpdateRolePayload,
  ): Promise<{ data?: { color_saved?: boolean } }> =>
    axios
      .put(route('api.v1.workspaces.roles.update', { idOrSlug: workspaceId, role: roleId }), payload)
      .then((r) => r.data),

  destroy: (workspaceId: number | string, roleId: number): Promise<void> =>
    axios
      .delete(route('api.v1.workspaces.roles.destroy', { idOrSlug: workspaceId, role: roleId }))
      .then(() => undefined),

  create: <TRole = unknown>(
    workspaceId: number | string,
    data: Record<string, unknown>,
  ): Promise<{ role: TRole }> =>
    axios.post(route('api.v1.workspaces.roles.store', workspaceId), data).then((r) => r.data),

  listPermissions: <TPermission = unknown>(
    workspaceId: number | string,
  ): Promise<TPermission[]> =>
    axios
      .get(route('api.v1.workspaces.permissions', workspaceId))
      .then((r) => r.data.data || []),
};
