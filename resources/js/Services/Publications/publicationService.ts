import axios from 'axios';
import { route } from 'ziggy-js';

export interface ListPublicationsParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  platform_id?: number;
  campaign_id?: number;
  [key: string]: unknown;
}

const publicationsParamsSerializer = {
  indexes: null as null,
  serialize: (params: Record<string, unknown>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(`${key}[]`, String(v)));
      } else if (value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return searchParams.toString();
  },
};

export const publicationService = {
  list: (params: ListPublicationsParams) =>
    axios
      .get(route('api.v1.publications.index'), { params, paramsSerializer: publicationsParamsSerializer })
      .then((r) => r.data),

  listPendingApprovals: (params: ListPublicationsParams) =>
    axios
      .get(route('api.v1.publications.pending-approvals'), { params, paramsSerializer: publicationsParamsSerializer })
      .then((r) => r.data),

  get: (id: number) =>
    axios
      .get(route('api.v1.publications.show', id))
      .then((r) => r.data.data),

  getPublishedPlatforms: (publicationId: number) =>
    axios
      .get(route('api.v1.publications.published-platforms', publicationId))
      .then((r) => r.data),

  getPublishTimeline: (publicationId: number) =>
    axios
      .get(route('api.v1.publications.publish-timeline', publicationId))
      .then((r) => r.data),

  create: (formData: FormData) =>
    axios
      .post(route('api.v1.publications.store'), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data ?? r.data.publication),

  update: (id: number, formData: FormData) =>
    axios
      .post(route('api.v1.publications.update', id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data ?? r.data.publication),

  destroy: (id: number): Promise<void> =>
    axios.delete(route('api.v1.publications.destroy', id)).then(() => undefined),

  duplicate: (id: number) =>
    axios
      .post(route('api.v1.publications.duplicate', id))
      .then((r) => r.data.data),

  publish: (id: number, formData: FormData, idempotencyKey?: string) =>
    axios
      .post(route('api.v1.publications.publish', id), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        },
      })
      .then((r) => r.data),

  unpublish: (id: number, payload: Record<string, unknown>) =>
    axios
      .post(route('api.v1.publications.unpublish', id), payload)
      .then((r) => r.data),

  cancel: (id: number, platformIds?: number[]): Promise<void> =>
    axios
      .post(route('api.v1.publications.cancel', id), platformIds ? { platform_ids: platformIds } : {})
      .then(() => undefined),

  lock: (id: number, reason: string) =>
    axios
      .post(route('api.v1.publications.lock', id), { reason })
      .then((r) => r.data.data),

  unlock: (id: number): Promise<void> =>
    axios.post(route('api.v1.publications.unlock', id)).then(() => undefined),

  // Comments
  getComments: (publicationId: number) =>
    axios
      .get(route('api.v1.publications.comments.index', publicationId))
      .then((r) => r.data.comments ?? []),

  addComment: (publicationId: number, content: string) =>
    axios
      .post(route('api.v1.publications.comments.store', publicationId), { content })
      .then((r) => r.data.comment),

  deleteComment: (publicationId: number, commentId: number): Promise<void> =>
    axios
      .delete(route('api.v1.publications.comments.destroy', { publication: publicationId, comment: commentId }))
      .then(() => undefined),

  // Workspace members (used by CommentsSection)
  getWorkspaceMembers: (workspaceId: number) =>
    axios
      .get(route('api.v1.workspaces.members', workspaceId))
      .then((r) => r.data.members ?? []),

  // Campaigns
  createCampaign: (payload: Record<string, unknown>) =>
    axios
      .post('/api/v1/campaigns', payload)
      .then((r) => r.data.data),

  deleteCampaign: (id: number): Promise<void> =>
    axios.delete(route('api.v1.campaigns.destroy', id)).then(() => undefined),

  duplicateCampaign: (id: number) =>
    axios
      .post(route('api.v1.campaigns.duplicate', id))
      .then((r) => r.data.data),

  listCampaigns: (params: Record<string, unknown>) =>
    axios
      .get(route('api.v1.campaigns.index'), { params })
      .then((r) => r.data),

  // Content approval (different route pattern)
  submitContentForApproval: (contentId: number) =>
    axios
      .post(`/api/v1/content/${contentId}/submit-for-approval`, {}, { skipErrorHandler: true } as object)
      .then((r) => r.data),

  deleteMedia: (mediaId: number): Promise<void> =>
    axios.delete(`/api/v1/media/${mediaId}`).then(() => undefined),

  getPreview: <T = Record<string, unknown>>(
    id: number,
    payload: { platform_ids: number[]; simple_mode: boolean },
  ): Promise<T> => axios.post(`/api/v1/publications/${id}/preview`, payload).then((r) => r.data),

  autoOptimize: <T = Record<string, unknown>>(id: number, platformIds: number[]): Promise<T> =>
    axios
      .post(`/api/v1/publications/${id}/auto-optimize`, { platform_ids: platformIds })
      .then((r) => r.data),

  updatePlatformConfig: <T = Record<string, unknown>>(
    id: number,
    payload: Record<string, unknown>,
  ): Promise<T> =>
    axios.post(`/api/v1/publications/${id}/update-platform-config`, payload).then((r) => r.data),

  publishWithConfigs: <T = Record<string, unknown>>(
    id: number,
    payload: Record<string, unknown>,
  ): Promise<T> => axios.post(`/api/v1/publications/${id}/publish`, payload).then((r) => r.data),

  getPortalToken: (publicationId: number): Promise<string> =>
    axios
      .post(route('api.v1.publications.portal-token', { publication: publicationId }))
      .then((r) => r.data.data?.portal_url || r.data.portal_url),
};
