import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePublicationAction } from '@/Hooks/Publications/usePublicationAction';
import PublicationActionService from '@/Services/Publications/PublicationActionService';

vi.mock('@/Services/Publications/PublicationActionService', () => ({
  default: {
    getPublicationAction: vi.fn(),
  },
}));

describe('usePublicationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('starts in a loading state with no action data', () => {
    (PublicationActionService.getPublicationAction as any).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => usePublicationAction());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.actionData).toBeNull();
  });

  it('exposes canPublishDirectly=true when the service returns "publish"', async () => {
    (PublicationActionService.getPublicationAction as any).mockResolvedValue({
      action: 'publish',
      can_bypass_workflow: true,
      workflow_enabled: false,
      button_text: 'Publicar',
      button_text_en: 'Publish',
    });

    const { result } = renderHook(() => usePublicationAction());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.canPublishDirectly).toBe(true);
    expect(result.current.mustSendToReview).toBe(false);
    expect(result.current.isOwner).toBe(true);
    expect(result.current.buttonText).toBe('Publicar');
  });

  it('exposes mustSendToReview=true when the service returns "review"', async () => {
    (PublicationActionService.getPublicationAction as any).mockResolvedValue({
      action: 'review',
      can_bypass_workflow: false,
      workflow_enabled: true,
      button_text: 'Enviar a revisión',
      button_text_en: 'Send to Review',
    });

    const { result } = renderHook(() => usePublicationAction());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.mustSendToReview).toBe(true);
    expect(result.current.canPublishDirectly).toBe(false);
    expect(result.current.workflowEnabled).toBe(true);
  });

  it('falls back to sane defaults before any data has loaded', () => {
    (PublicationActionService.getPublicationAction as any).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => usePublicationAction());

    expect(result.current.buttonText).toBe('Publicar');
    expect(result.current.buttonTextEn).toBe('Publish');
    expect(result.current.workflowEnabled).toBe(false);
  });

  it('sets an error when the underlying call rejects', async () => {
    (PublicationActionService.getPublicationAction as any).mockRejectedValue(
      new Error('boom'),
    );

    const { result } = renderHook(() => usePublicationAction());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('Failed to fetch publication action');
    expect(result.current.actionData).toBeNull();
  });

  it('refetch() re-triggers the fetch and updates the data', async () => {
    (PublicationActionService.getPublicationAction as any)
      .mockResolvedValueOnce({
        action: 'review',
        can_bypass_workflow: false,
        workflow_enabled: true,
        button_text: 'Enviar a revisión',
        button_text_en: 'Send to Review',
      })
      .mockResolvedValueOnce({
        action: 'publish',
        can_bypass_workflow: true,
        workflow_enabled: false,
        button_text: 'Publicar',
        button_text_en: 'Publish',
      });

    const { result } = renderHook(() => usePublicationAction());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.mustSendToReview).toBe(true);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.canPublishDirectly).toBe(true);
    expect(PublicationActionService.getPublicationAction).toHaveBeenCalledTimes(2);
  });
});
