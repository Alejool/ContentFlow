import { usePublishPublication } from '@/Hooks/publication/usePublishPublication';
import { usePublicationStore } from '@/stores/publicationStore';
import type { Publication } from '@/types/Publication';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@inertiajs/react', () => ({
  usePage: vi.fn().mockReturnValue({ props: { auth: { user: { id: 1 } } } }),
  router: { reload: vi.fn() },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/Hooks/useSocialAccounts', () => ({
  useSocialAccounts: vi.fn().mockReturnValue({
    data: [
      { id: 1, platform: 'instagram', account_name: 'my_ig', is_active: true },
      { id: 2, platform: 'tiktok', account_name: 'my_tiktok', is_active: true },
      { id: 3, platform: 'facebook', account_name: 'my_fb', is_active: true },
      { id: 4, platform: 'twitter', account_name: 'my_tw', is_active: true },
      { id: 5, platform: 'youtube', account_name: 'my_yt', is_active: true },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/stores/campaignStore', () => ({
  useCampaignStore: vi.fn().mockImplementation((selector: any) =>
    selector({
      campaigns: [],
      isLoading: false,
      fetchCampaigns: vi.fn(),
    }),
  ),
}));

vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
    get: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

// Mock window.Echo
global.window.Echo = {
  private: vi.fn().mockReturnValue({
    listen: vi.fn().mockReturnThis(),
    stopListening: vi.fn().mockReturnThis(),
  }),
} as any;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makePublication = (overrides: Partial<Publication> = {}): Publication => ({
  id: 1,
  user_id: 1,
  title: 'Test Publication',
  description: 'Test description',
  status: 'draft',
  content_type: 'post',
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('usePublishPublication — platform selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePublicationStore.getState().clearPageData?.();
  });

  it('starts with no platforms selected', () => {
    const { result } = renderHook(() => usePublishPublication());
    expect(result.current.selectedPlatforms).toHaveLength(0);
  });

  it('toggles a platform on and off', () => {
    const { result } = renderHook(() => usePublishPublication());

    act(() => result.current.togglePlatform(1));
    expect(result.current.selectedPlatforms).toContain(1);

    act(() => result.current.togglePlatform(1));
    expect(result.current.selectedPlatforms).not.toContain(1);
  });

  it('selectAll adds all active accounts', () => {
    const { result } = renderHook(() => usePublishPublication());

    act(() => result.current.selectAll());
    expect(result.current.selectedPlatforms).toEqual(
      expect.arrayContaining([1, 2, 3, 4, 5]),
    );
  });

  it('deselectAll clears selection', () => {
    const { result } = renderHook(() => usePublishPublication());

    act(() => result.current.selectAll());
    act(() => result.current.deselectAll());
    expect(result.current.selectedPlatforms).toHaveLength(0);
  });

  it('detects youtube in selection', () => {
    const { result } = renderHook(() => usePublishPublication());

    act(() => result.current.togglePlatform(5)); // youtube id=5
    expect(result.current.isYoutubeSelected()).toBe(true);
  });

  it('returns false for youtube when not selected', () => {
    const { result } = renderHook(() => usePublishPublication());
    expect(result.current.isYoutubeSelected()).toBe(false);
  });
});

describe('usePublishPublication — publish by content type', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePublicationStore.getState().clearPageData?.();
  });

  it('fails to publish when no platforms are selected', async () => {
    const { result } = renderHook(() => usePublishPublication());
    const pub = makePublication({ content_type: 'post' });

    let success: boolean;
    await act(async () => {
      success = await result.current.handlePublish(pub);
    });

    expect(success!).toBe(false);
  });

  it('publishes a POST with selected platforms', async () => {
    const publishMock = vi.fn().mockResolvedValue({ success: true, data: {} });
    usePublicationStore.setState({ publishPublication: publishMock } as any);

    const { result } = renderHook(() => usePublishPublication());
    const pub = makePublication({ content_type: 'post' });

    act(() => result.current.togglePlatform(1)); // instagram

    let success: boolean;
    await act(async () => {
      success = await result.current.handlePublish(pub);
    });

    expect(success!).toBe(true);
    expect(publishMock).toHaveBeenCalledWith(pub.id, expect.any(FormData));
  });

  it('publishes a REEL with selected platforms', async () => {
    const publishMock = vi.fn().mockResolvedValue({ success: true, data: {} });
    usePublicationStore.setState({ publishPublication: publishMock } as any);

    const { result } = renderHook(() => usePublishPublication());
    const pub = makePublication({ content_type: 'reel' });

    act(() => {
      result.current.togglePlatform(1); // instagram
      result.current.togglePlatform(2); // tiktok
    });

    let success: boolean;
    await act(async () => {
      success = await result.current.handlePublish(pub);
    });

    expect(success!).toBe(true);
    expect(publishMock).toHaveBeenCalledWith(pub.id, expect.any(FormData));
  });

  it('publishes a STORY with selected platforms', async () => {
    const publishMock = vi.fn().mockResolvedValue({ success: true, data: {} });
    usePublicationStore.setState({ publishPublication: publishMock } as any);

    const { result } = renderHook(() => usePublishPublication());
    const pub = makePublication({ content_type: 'story' });

    act(() => result.current.togglePlatform(1)); // instagram

    let success: boolean;
    await act(async () => {
      success = await result.current.handlePublish(pub);
    });

    expect(success!).toBe(true);
  });

  it('publishes a POLL with selected platforms', async () => {
    const publishMock = vi.fn().mockResolvedValue({ success: true, data: {} });
    usePublicationStore.setState({ publishPublication: publishMock } as any);

    const { result } = renderHook(() => usePublishPublication());
    const pub = makePublication({
      content_type: 'poll',
      poll_options: ['Option A', 'Option B'],
      poll_duration_hours: 24,
    });

    act(() => result.current.togglePlatform(4)); // twitter

    let success: boolean;
    await act(async () => {
      success = await result.current.handlePublish(pub);
    });

    expect(success!).toBe(true);
  });

  it('publishes a CAROUSEL with selected platforms', async () => {
    const publishMock = vi.fn().mockResolvedValue({ success: true, data: {} });
    usePublicationStore.setState({ publishPublication: publishMock } as any);

    const { result } = renderHook(() => usePublishPublication());
    const pub = makePublication({ content_type: 'carousel' });

    act(() => result.current.togglePlatform(1)); // instagram

    let success: boolean;
    await act(async () => {
      success = await result.current.handlePublish(pub);
    });

    expect(success!).toBe(true);
  });

  it('rolls back optimistic state on publish failure', async () => {
    const publishMock = vi.fn().mockResolvedValue({ success: false, data: 'Error' });
    usePublicationStore.setState({ publishPublication: publishMock } as any);

    const { result } = renderHook(() => usePublishPublication());
    const pub = makePublication({ content_type: 'post' });

    act(() => result.current.togglePlatform(1));

    await act(async () => {
      await result.current.handlePublish(pub);
    });

    // After failure, optimistic platforms should be cleared
    expect(result.current.optimisticPublishingPlatforms).not.toContain(1);
  });

  it('clears selected platforms after successful publish', async () => {
    const publishMock = vi.fn().mockResolvedValue({ success: true, data: {} });
    usePublicationStore.setState({ publishPublication: publishMock } as any);

    const { result } = renderHook(() => usePublishPublication());
    const pub = makePublication({ content_type: 'post' });

    act(() => {
      result.current.togglePlatform(1);
      result.current.togglePlatform(3);
    });

    await act(async () => {
      await result.current.handlePublish(pub);
    });

    expect(result.current.selectedPlatforms).toHaveLength(0);
  });
});

describe('usePublishPublication — platform settings per content type', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePublicationStore.getState().clearPageData?.();
  });

  it('includes platform_settings in FormData when provided', async () => {
    const publishMock = vi.fn().mockResolvedValue({ success: true, data: {} });
    usePublicationStore.setState({ publishPublication: publishMock } as any);

    const { result } = renderHook(() => usePublishPublication());
    const pub = makePublication({ content_type: 'reel' });

    act(() => result.current.togglePlatform(1)); // instagram

    const platformSettings = {
      instagram: { reel_type: 'reel', aspect_ratio: '9:16' },
    };

    await act(async () => {
      await result.current.handlePublish(pub, platformSettings);
    });

    const formData: FormData = publishMock.mock.calls[0][1];
    expect(formData.get('platform_settings')).toBeTruthy();
  });

  it('filters platform_settings to only selected platforms', async () => {
    const publishMock = vi.fn().mockResolvedValue({ success: true, data: {} });
    usePublicationStore.setState({ publishPublication: publishMock } as any);

    const { result } = renderHook(() => usePublishPublication());
    const pub = makePublication({ content_type: 'post' });

    act(() => result.current.togglePlatform(1)); // only instagram selected

    const platformSettings = {
      instagram: { caption: 'IG caption' },
      tiktok: { caption: 'TikTok caption' }, // not selected — should be filtered
    };

    await act(async () => {
      await result.current.handlePublish(pub, platformSettings);
    });

    const formData: FormData = publishMock.mock.calls[0][1];
    const settingsStr = formData.get('platform_settings') as string;
    const settings = JSON.parse(settingsStr);

    expect(settings).toHaveProperty('instagram');
    expect(settings).not.toHaveProperty('tiktok');
  });
});

describe('usePublishPublication — reset state', () => {
  it('resets all state on resetState()', () => {
    const { result } = renderHook(() => usePublishPublication());

    act(() => {
      result.current.togglePlatform(1);
      result.current.togglePlatform(2);
    });

    act(() => result.current.resetState());

    expect(result.current.selectedPlatforms).toHaveLength(0);
    expect(result.current.optimisticPublishingPlatforms).toHaveLength(0);
  });
});
