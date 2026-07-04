import axios from 'axios';
import { route } from 'ziggy-js';

export interface ApprovalStats {
  success?: boolean;
  pending_requests: number;
  pending_for_me: number;
  approved_today: number;
  rejected_today: number;
  avg_approval_time_hours: number;
}

export interface AnalyticsData {
  average_approval_times: Record<number, number>;
  approval_rates_by_role: Array<{
    role: string;
    approval_rate: number;
    rejection_rate: number;
    total_actions: number;
  }>;
  pending_content_by_level: Record<number, number>;
  stale_pending_content: Array<{
    id: number;
    title: string;
    submitted_at: string;
    days_pending: number;
    current_level: number;
  }>;
  approver_workload: Array<{
    user_id: number;
    user_name: string;
    role: string;
    pending_count: number;
  }>;
  average_publication_time: number;
}

export interface ApprovalLevel {
  id?: number;
  level_number: number;
  level_name: string;
  role_id: number;
}

export interface ApprovalWorkflow {
  id?: number;
  workspace_id: number;
  is_enabled: boolean;
  is_multi_level: boolean;
  levels: ApprovalLevel[];
}

export interface ApproveRequestPayload {
  comment?: string;
}

export const approvalService = {
  getStats: (): Promise<ApprovalStats> =>
    axios.get('/api/v1/approvals/stats').then((r) => r.data),

  getAnalytics: (workspaceId: string | number): Promise<AnalyticsData> =>
    axios
      .get(route('api.v1.workspaces.approval-analytics.index', { idOrSlug: workspaceId }))
      .then((r) => r.data.data),

  exportAnalytics: (workspaceId: string | number, format: 'csv' | 'json'): Promise<Blob> =>
    axios
      .get(route('api.v1.workspaces.approval-analytics.export', { idOrSlug: workspaceId }), {
        params: { format },
        responseType: 'blob',
      })
      .then((r) => r.data),

  getWorkflow: (workspaceId: string | number): Promise<ApprovalWorkflow> =>
    axios
      .get(route('api.v1.workspaces.approval-workflow.show', { idOrSlug: workspaceId }))
      .then((r) => r.data.data),

  enableWorkflow: (workspaceId: string | number): Promise<void> =>
    axios
      .post(route('api.v1.workspaces.approval-workflow.enable', { idOrSlug: workspaceId }))
      .then(() => undefined),

  disableWorkflow: (workspaceId: string | number): Promise<void> =>
    axios
      .post(route('api.v1.workspaces.approval-workflow.disable', { idOrSlug: workspaceId }))
      .then(() => undefined),

  configureWorkflow: (
    workspaceId: string | number,
    data: Partial<ApprovalWorkflow>,
  ): Promise<ApprovalWorkflow> =>
    axios
      .put(route('api.v1.workspaces.approval-workflow.configure', { idOrSlug: workspaceId }), data)
      .then((r) => r.data.data),

  listWorkflows: <T = unknown>(workspaceId: number | string): Promise<T[]> =>
    axios
      .get(route('api.v1.workspaces.approval-workflows.index', workspaceId))
      .then((r) => r.data.data || []),

  createWorkflow: (workspaceId: number | string, data: Record<string, unknown>): Promise<void> =>
    axios
      .post(route('api.v1.workspaces.approval-workflows.store', workspaceId), data)
      .then(() => undefined),

  updateWorkflowById: (
    workspaceId: number | string,
    workflowId: number,
    data: Record<string, unknown>,
  ): Promise<void> =>
    axios
      .put(
        route('api.v1.workspaces.approval-workflows.update', {
          idOrSlug: workspaceId,
          workflow: workflowId,
        }),
        data,
      )
      .then(() => undefined),

  deleteWorkflow: (workspaceId: number | string, workflowId: number): Promise<void> =>
    axios
      .delete(
        route('api.v1.workspaces.approval-workflows.destroy', {
          idOrSlug: workspaceId,
          workflow: workflowId,
        }),
      )
      .then(() => undefined),

  submitPublication: (publicationId: number): Promise<Record<string, unknown>> =>
    axios
      .post(
        route('api.v1.approvals.submit'),
        { publication_id: publicationId },
        { skipErrorHandler: true } as object,
      )
      .then((r) => r.data),

  submitForApproval: (contentId: number): Promise<{ data: unknown }> =>
    axios
      .post(route('api.content.submit-for-approval', contentId), {}, { skipErrorHandler: true } as object)
      .then((r) => r.data),

  approveContent: (contentId: number, comment?: string): Promise<void> =>
    axios
      .post(route('api.content.approve', contentId), { comment })
      .then(() => undefined),

  rejectContent: (contentId: number, reason: string): Promise<void> =>
    axios
      .post(route('api.content.reject', contentId), { reason })
      .then(() => undefined),

  getPublicationHistory: (publicationId: number): Promise<unknown[]> =>
    axios
      .get(route('api.v1.approvals.publication.history', publicationId))
      .then((r) => r.data.data ?? []),

  approveRequest: (requestId: number, payload: ApproveRequestPayload = {}): Promise<unknown> =>
    axios
      .post(route('api.v1.approvals.approve', requestId), payload)
      .then((r) => r.data.data),

  rejectRequest: (requestId: number, reason: string): Promise<void> =>
    axios
      .post(route('api.v1.approvals.reject', requestId), { reason })
      .then(() => undefined),

  getPendingApprovals: (type = 'to_approve'): Promise<unknown[]> =>
    axios
      .get(route('api.v1.approvals.pending'), { params: { type } })
      .then((r) => r.data.requests ?? []),
};
