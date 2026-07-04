import axios from 'axios';
import { route } from 'ziggy-js';

export const workspaceService = {
  inviteMember: (
    workspaceId: number | string,
    data: Record<string, unknown>,
  ): Promise<{ message?: string }> =>
    axios.post(route('api.v1.workspaces.invite', workspaceId), data).then((r) => r.data),

  getActivity: (
    workspaceId: number | string,
    params: Record<string, unknown>,
  ): Promise<PaginatedActivity> =>
    axios.get(route('api.v1.workspaces.activity', workspaceId), { params }).then((r) => r.data),
};

export const workspaceWebhookService = {
  test: (workspaceId: number | string, payload: { type: string; url: string }): Promise<void> =>
    axios
      .post(route('api.v1.workspaces.webhooks.test', { workspace: workspaceId }), payload)
      .then(() => undefined),
};

export interface PaginatedActivity {
  data?: Record<string, unknown>[];
  current_page?: number;
  last_page?: number;
  total?: number;
  per_page?: number;
}
