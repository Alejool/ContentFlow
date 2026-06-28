import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { publicationService } from '@/Services/Publications/publicationService';

vi.mock('axios');
vi.mock('ziggy-js', () => ({
  route: (name: string, params?: unknown) => `/mocked/${name}/${JSON.stringify(params ?? '')}`,
}));

const mockedAxios = vi.mocked(axios);

beforeEach(() => vi.clearAllMocks());

describe('publicationService.list', () => {
  it('GET publications index with params', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { data: [], meta: {} } });
    const result = await publicationService.list({ page: 1, per_page: 12 });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('publications.index'),
      expect.objectContaining({ params: expect.any(Object) }),
    );
    expect(result).toEqual({ data: [], meta: {} });
  });
});

describe('publicationService.listPendingApprovals', () => {
  it('GET pending-approvals route', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { data: [] } });
    await publicationService.listPendingApprovals({ page: 1 });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('pending-approvals'),
      expect.any(Object),
    );
  });
});

describe('publicationService.get', () => {
  it('GET single publication by id', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { data: { id: 1 } } });
    const result = await publicationService.get(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('publications.show'));
    expect(result).toEqual({ id: 1 });
  });
});

describe('publicationService.create', () => {
  it('POST to store with FormData', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { data: { id: 2 } } });
    const fd = new FormData();
    const result = await publicationService.create(fd);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('publications.store'),
      fd,
      expect.any(Object),
    );
    expect(result).toEqual({ id: 2 });
  });
});

describe('publicationService.update', () => {
  it('POST to update route with FormData', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { data: { id: 3 } } });
    const fd = new FormData();
    await publicationService.update(3, fd);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('publications.update'),
      fd,
      expect.any(Object),
    );
  });
});

describe('publicationService.destroy', () => {
  it('DELETE publication by id', async () => {
    mockedAxios.delete = vi.fn().mockResolvedValue({ data: {} });
    await publicationService.destroy(4);
    expect(mockedAxios.delete).toHaveBeenCalledWith(expect.stringContaining('publications.destroy'));
  });
});

describe('publicationService.duplicate', () => {
  it('POST to duplicate route', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { data: { id: 5 } } });
    const result = await publicationService.duplicate(4);
    expect(mockedAxios.post).toHaveBeenCalledWith(expect.stringContaining('publications.duplicate'));
    expect(result).toEqual({ id: 5 });
  });
});

describe('publicationService.publish', () => {
  it('POST to publish with formData', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { data: { id: 1 } } });
    const fd = new FormData();
    await publicationService.publish(1, fd);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('publications.publish'),
      fd,
      expect.any(Object),
    );
  });
});

describe('publicationService.unpublish', () => {
  it('POST to unpublish with platform', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: {} });
    await publicationService.unpublish(1, { platform_id: 2 });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('publications.unpublish'),
      { platform_id: 2 },
    );
  });
});

describe('publicationService.cancel', () => {
  it('POST to cancel route', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: {} });
    await publicationService.cancel(1);
    expect(mockedAxios.post).toHaveBeenCalledWith(expect.stringContaining('publications.cancel'));
  });
});

describe('publicationService.lock', () => {
  it('POST to lock with reason', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { data: { id: 1 } } });
    await publicationService.lock(1, 'editing');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('publications.lock'),
      { reason: 'editing' },
    );
  });
});

describe('publicationService.unlock', () => {
  it('POST to unlock route', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: {} });
    await publicationService.unlock(1);
    expect(mockedAxios.post).toHaveBeenCalledWith(expect.stringContaining('publications.unlock'));
  });
});

describe('publicationService.getPublishedPlatforms', () => {
  it('GET published-platforms route and returns full response', async () => {
    const mockData = { published_platforms: [1, 2], failed_platforms: [] };
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });
    const result = await publicationService.getPublishedPlatforms(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('published-platforms'));
    expect(result).toEqual(mockData);
  });
});

describe('publicationService.getComments', () => {
  it('GET comments index', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { comments: [] } });
    const result = await publicationService.getComments(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('comments.index'));
    expect(result).toEqual([]);
  });
});

describe('publicationService.addComment', () => {
  it('POST comment to store', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { comment: { id: 1 } } });
    const result = await publicationService.addComment(1, 'Nice post');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('comments.store'),
      { content: 'Nice post' },
    );
    expect(result).toEqual({ id: 1 });
  });
});

describe('publicationService.deleteComment', () => {
  it('DELETE comment by id', async () => {
    mockedAxios.delete = vi.fn().mockResolvedValue({ data: {} });
    await publicationService.deleteComment(1, 99);
    expect(mockedAxios.delete).toHaveBeenCalledWith(expect.stringContaining('comments.destroy'));
  });
});

describe('publicationService.createCampaign', () => {
  it('POST to campaigns store', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { data: { id: 1 } } });
    const result = await publicationService.createCampaign({ name: 'Test' });
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/v1/campaigns', { name: 'Test' });
    expect(result).toEqual({ id: 1 });
  });
});

describe('publicationService.deleteCampaign', () => {
  it('DELETE campaign by id', async () => {
    mockedAxios.delete = vi.fn().mockResolvedValue({ data: {} });
    await publicationService.deleteCampaign(1);
    expect(mockedAxios.delete).toHaveBeenCalledWith(expect.stringContaining('campaigns.destroy'));
  });
});

describe('publicationService.duplicateCampaign', () => {
  it('POST to duplicate campaign', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { data: { id: 2 } } });
    const result = await publicationService.duplicateCampaign(1);
    expect(mockedAxios.post).toHaveBeenCalledWith(expect.stringContaining('campaigns.duplicate'));
    expect(result).toEqual({ id: 2 });
  });
});

describe('publicationService.submitForApproval', () => {
  it('POST to content submit-for-approval', async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { data: {} } });
    await publicationService.submitContentForApproval(5);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/api/v1/content/5/submit-for-approval',
      {},
      expect.any(Object),
    );
  });
});

describe('publicationService.getWorkspaceMembers', () => {
  it('GET workspace members', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { members: [] } });
    const result = await publicationService.getWorkspaceMembers(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('workspaces.members'));
    expect(result).toEqual([]);
  });
});
