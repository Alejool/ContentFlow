import axios from 'axios';
import route from 'ziggy-js';

export const workspaceService = {
  inviteMember: (
    workspaceId: number | string,
    data: Record<string, unknown>,
  ): Promise<{ message?: string }> =>
    axios.post(route('api.v1.workspaces.invite', workspaceId), data).then((r) => r.data),
};
