import { act, renderHook } from '@testing-library/react';
import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePublicationPlatformValidation } from '@/Hooks/Publications/usePublicationPlatformValidation';

vi.mock('axios');

describe('usePublicationPlatformValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not call the API when there are no selected accounts', async () => {
    renderHook(() =>
      usePublicationPlatformValidation({ selectedAccountIds: [] }),
    );

    await vi.advanceTimersByTimeAsync(300);

    expect(axios.get).not.toHaveBeenCalled();
  });

  it('does not call the API when autoValidate is false', async () => {
    renderHook(() =>
      usePublicationPlatformValidation({
        selectedAccountIds: [1, 2],
        autoValidate: false,
      }),
    );

    await vi.advanceTimersByTimeAsync(300);

    expect(axios.get).not.toHaveBeenCalled();
  });

  it('debounces the validation call by 300ms', async () => {
    (axios.get as any).mockResolvedValue({
      data: { success: true, data: { can_publish_to_any: true, compatible_platforms: [], incompatible_platforms: [] } },
    });

    renderHook(() =>
      usePublicationPlatformValidation({ selectedAccountIds: [1] }),
    );

    await vi.advanceTimersByTimeAsync(299);
    expect(axios.get).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('builds the query string with content type, account ids and publication id', async () => {
    (axios.get as any).mockResolvedValue({
      data: { success: true, data: { can_publish_to_any: true, compatible_platforms: [], incompatible_platforms: [] } },
    });

    renderHook(() =>
      usePublicationPlatformValidation({
        contentType: 'reel',
        selectedAccountIds: [1, 2, 3],
        publicationId: 42,
      }),
    );

    await vi.advanceTimersByTimeAsync(300);

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\/api\/publications\/validate-platforms\?.*content_type=reel.*/,
      ),
    );
    const calledUrl = (axios.get as any).mock.calls[0][0] as string;
    expect(calledUrl).toContain('social_account_ids=1%2C2%2C3');
    expect(calledUrl).toContain('publication_id=42');
  });

  it('exposes canPublish/compatiblePlatforms/incompatiblePlatforms from a successful response', async () => {
    (axios.get as any).mockResolvedValue({
      data: {
        success: true,
        data: {
          can_publish_to_any: true,
          compatible_platforms: ['instagram', 'facebook'],
          incompatible_platforms: ['youtube'],
        },
      },
    });

    const { result } = renderHook(() =>
      usePublicationPlatformValidation({ selectedAccountIds: [1] }),
    );

    await vi.advanceTimersByTimeAsync(300);
    await act(async () => {});

    expect(result.current.canPublish).toBe(true);
    expect(result.current.compatiblePlatforms).toEqual(['instagram', 'facebook']);
    expect(result.current.incompatiblePlatforms).toEqual(['youtube']);
    expect(result.current.error).toBeNull();
  });

  it('sets an error message when the API responds success=false', async () => {
    (axios.get as any).mockResolvedValue({
      data: { success: false, message: 'No compatible platforms' },
    });

    const { result } = renderHook(() =>
      usePublicationPlatformValidation({ selectedAccountIds: [1] }),
    );

    await vi.advanceTimersByTimeAsync(300);
    await act(async () => {});

    expect(result.current.error).toBe('No compatible platforms');
    expect(result.current.canPublish).toBe(false);
  });

  it('sets a generic error message when the request throws', async () => {
    (axios.get as any).mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() =>
      usePublicationPlatformValidation({ selectedAccountIds: [1] }),
    );

    await vi.advanceTimersByTimeAsync(300);
    await act(async () => {});

    expect(result.current.error).toBe('Error al validar plataformas');
  });

  it('re-validates when selectedAccountIds changes', async () => {
    (axios.get as any).mockResolvedValue({
      data: { success: true, data: { can_publish_to_any: true, compatible_platforms: [], incompatible_platforms: [] } },
    });

    const { rerender } = renderHook(
      ({ ids }) => usePublicationPlatformValidation({ selectedAccountIds: ids }),
      { initialProps: { ids: [1] } },
    );

    await vi.advanceTimersByTimeAsync(300);
    expect(axios.get).toHaveBeenCalledTimes(1);

    rerender({ ids: [1, 2] });
    await vi.advanceTimersByTimeAsync(300);

    expect(axios.get).toHaveBeenCalledTimes(2);
  });
});
