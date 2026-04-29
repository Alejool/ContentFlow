/**
 * useLayoutEffects
 *
 * Aggregates all side-effects required by AuthenticatedLayout:
 *  1. Upload store initialisation (restore persisted uploads).
 *  2. Realtime channels: notification + progress.
 *  3. Branding (primary colour + favicon).
 *  4. Keyboard shortcut: Ctrl+/ → toggle shortcuts modal.
 *
 * Accepts only strictly-typed parameters — no `any`.
 */

import { applyBrandingColor, applyFavicon } from '@/Layouts/helpers/brandingHelpers';
import { initNotificationRealtime } from '@/Services/notificationRealtime';
import { cleanupProgressRealtime, initProgressRealtime } from '@/Services/progressRealtime';
import type { ResolvedAuth } from '@/types/layout';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUploadQueue } from '@/stores/uploadQueueStore';
import { useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseLayoutEffectsParams {
  auth: ResolvedAuth;
  setShowShortcutsModal: React.Dispatch<React.SetStateAction<boolean>>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLayoutEffects({
  auth,
  setShowShortcutsModal,
}: UseLayoutEffectsParams): void {
  const user = auth.user;
  const userId = user?.id;
  const workspace = auth.current_workspace;

  // ── 1. Upload store init ─────────────────────────────────────────────────
  const initializeStore = useUploadQueue((state) => state.initializeStore);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  // ── 2. Realtime channels ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    initNotificationRealtime(userId);
    initProgressRealtime(userId);
    useNotificationStore.getState().fetchNotifications();

    return () => {
      cleanupProgressRealtime(userId);
    };
  }, [userId]);

  // ── 3. Branding: primary colour + favicon ────────────────────────────────
  useEffect(() => {
    applyBrandingColor(user?.theme_color, workspace?.white_label_primary_color ?? undefined);
    applyFavicon(workspace?.white_label_favicon_url ?? undefined);
  }, [
    user?.theme_color,
    workspace?.white_label_primary_color,
    workspace?.white_label_favicon_url,
  ]);

  // ── 4. Keyboard shortcut: Ctrl+/ (or ⌘+/) ───────────────────────────────
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowShortcutsModal]);
}
