import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PublicationActionService from '@/Services/Publications/PublicationActionService';

vi.mock('axios');

describe('PublicationActionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('getPublicationAction', () => {
    it('returns the action payload on success', async () => {
      (axios.get as any).mockResolvedValue({
        data: {
          data: {
            action: 'publish',
            can_bypass_workflow: true,
            workflow_enabled: false,
            button_text: 'Publicar',
            button_text_en: 'Publish',
          },
        },
      });

      const result = await PublicationActionService.getPublicationAction();

      expect(axios.get).toHaveBeenCalledWith('/api/v1/publications/action');
      expect(result).toEqual({
        action: 'publish',
        can_bypass_workflow: true,
        workflow_enabled: false,
        button_text: 'Publicar',
        button_text_en: 'Publish',
      });
    });

    it('falls back to a safe "review" default when the request fails', async () => {
      (axios.get as any).mockRejectedValue(new Error('network error'));

      const result = await PublicationActionService.getPublicationAction();

      expect(result).toEqual({
        action: 'review',
        can_bypass_workflow: false,
        workflow_enabled: true,
        button_text: 'Enviar a revisión',
        button_text_en: 'Send to Review',
      });
    });
  });

  describe('canPublishDirectly', () => {
    it('returns true when action is "publish"', async () => {
      (axios.get as any).mockResolvedValue({
        data: { data: { action: 'publish', can_bypass_workflow: true, workflow_enabled: false } },
      });

      await expect(PublicationActionService.canPublishDirectly()).resolves.toBe(true);
    });

    it('returns false when action is "review"', async () => {
      (axios.get as any).mockResolvedValue({
        data: { data: { action: 'review', can_bypass_workflow: false, workflow_enabled: true } },
      });

      await expect(PublicationActionService.canPublishDirectly()).resolves.toBe(false);
    });

    it('returns false when the request fails (safe default is review)', async () => {
      (axios.get as any).mockRejectedValue(new Error('network error'));

      await expect(PublicationActionService.canPublishDirectly()).resolves.toBe(false);
    });
  });

  describe('mustSendToReview', () => {
    it('returns true when action is "review"', async () => {
      (axios.get as any).mockResolvedValue({
        data: { data: { action: 'review', can_bypass_workflow: false, workflow_enabled: true } },
      });

      await expect(PublicationActionService.mustSendToReview()).resolves.toBe(true);
    });

    it('returns false when action is "publish"', async () => {
      (axios.get as any).mockResolvedValue({
        data: { data: { action: 'publish', can_bypass_workflow: true, workflow_enabled: false } },
      });

      await expect(PublicationActionService.mustSendToReview()).resolves.toBe(false);
    });
  });
});
