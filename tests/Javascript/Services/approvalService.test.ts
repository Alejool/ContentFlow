import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { approvalService } from '@/Services/Approval/approvalService';

vi.mock('axios');
vi.mock('ziggy-js', () => {
  const route = (name: string, params?: unknown) =>
    `/mocked/${name}/${JSON.stringify(params ?? '')}`;
  return { default: route, route };
});

const mockedAxios = vi.mocked(axios);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('approvalService.getStats', () => {
  it('GET /api/v1/approvals/stats and returns data', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { success: true, pending_requests: 3 } });
    const result = await approvalService.getStats();
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/approvals/stats');
    expect(result).toEqual({ success: true, pending_requests: 3 });
  });
});

describe('approvalService.getAnalytics', () => {
  it('GET analytics route with workspaceId', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { data: { approval_rates_by_role: [] } } });
    const result = await approvalService.getAnalytics('ws-1');
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('approval-analytics.index'));
    expect(result).toEqual({ approval_rates_by_role: [] });
  });
});

describe('approvalService.getWorkflow', () => {
  it('GET workflow route with workspaceId', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { data: { is_enabled: true, levels: [] } } });
    const result = await approvalService.getWorkflow('ws-1');
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('approval-workflow.show'));
    expect(result).toEqual({ is_enabled: true, levels: [] });
  });
});

describe('approvalService.enableWorkflow', () => {
  it('POST to enable route', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: {} });
    await approvalService.enableWorkflow('ws-1');
    expect(mockedAxios.post).toHaveBeenCalledWith(expect.stringContaining('approval-workflow.enable'));
  });
});

describe('approvalService.disableWorkflow', () => {
  it('POST to disable route', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: {} });
    await approvalService.disableWorkflow('ws-1');
    expect(mockedAxios.post).toHaveBeenCalledWith(expect.stringContaining('approval-workflow.disable'));
  });
});

describe('approvalService.configureWorkflow', () => {
  it('PUT to configure route with data', async () => {
    mockedAxios.put = vi.fn().mockResolvedValue({ data: { data: { is_enabled: true } } });
    const data = { is_multi_level: true, levels: [] };
    const result = await approvalService.configureWorkflow('ws-1', data);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      expect.stringContaining('approval-workflow.configure'),
      data,
    );
    expect(result).toEqual({ is_enabled: true });
  });
});

describe('approvalService.submitForApproval', () => {
  it('POST to submit-for-approval route', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { data: { content: { id: 1 } } } });
    const result = await approvalService.submitForApproval(42);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('content.submit-for-approval'),
      {},
      expect.any(Object),
    );
    expect(result).toEqual({ data: { content: { id: 1 } } });
  });
});

describe('approvalService.approveRequest', () => {
  it('POST to approve route with comment', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { data: { id: 1 } } });
    const result = await approvalService.approveRequest(5, { comment: 'LGTM' });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('approvals.approve'),
      { comment: 'LGTM' },
    );
    expect(result).toEqual({ id: 1 });
  });
});

describe('approvalService.rejectRequest', () => {
  it('POST to reject route with reason', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { data: { id: 1 } } });
    await approvalService.rejectRequest(5, 'Needs revision');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('approvals.reject'),
      { reason: 'Needs revision' },
    );
  });
});

describe('approvalService.getPublicationHistory', () => {
  it('GET publication history route', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { data: [] } });
    const result = await approvalService.getPublicationHistory(10);
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('approvals.publication.history'));
    expect(result).toEqual([]);
  });
});

describe('approvalService.getPendingApprovals', () => {
  it('GET pending approvals with type param', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { requests: [{ id: 1 }] } });
    const result = await approvalService.getPendingApprovals('to_approve');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('approvals.pending'),
      { params: { type: 'to_approve' } },
    );
    expect(result).toEqual([{ id: 1 }]);
  });
});
