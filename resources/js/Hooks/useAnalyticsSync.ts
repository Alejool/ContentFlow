import { queryKeys } from '@/lib/queryKeys';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

type SyncPhase = 'idle' | 'dispatching' | 'waiting' | 'done' | 'locked';

interface SyncState {
  phase: SyncPhase;
  retryAfter: number;   // seconds until next manual sync allowed
  lastSyncedAt: Date | null;
}

const POLL_INTERVAL_MS  = 4000;   // check for new data every 4s
const POLL_TIMEOUT_MS   = 90000;  // give up after 90s
const COOLDOWN_SECONDS  = 900;    // 15 min — must match backend

export function useAnalyticsSync(workspaceId: number | undefined) {
  const queryClient = useQueryClient();
  const pollTimer   = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStart   = useRef<number>(0);
  const toastId     = useRef<string | undefined>(undefined);

  const [state, setState] = useState<SyncState>({
    phase:        'idle',
    retryAfter:   0,
    lastSyncedAt: null,
  });

  // ── Countdown while locked ──────────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'locked' || state.retryAfter <= 0) return;
    const id = setInterval(() => {
      setState((prev) => {
        const next = prev.retryAfter - 1;
        if (next <= 0) {
          clearInterval(id);
          return { ...prev, phase: 'idle', retryAfter: 0 };
        }
        return { ...prev, retryAfter: next };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state.phase, state.retryAfter]);

  // ── Check lock status on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!workspaceId) return;
    axios
      .get('/api/v1/analytics/sync/status')
      .then(({ data }) => {
        if (data.locked && data.retry_after_seconds > 0) {
          setState((prev) => ({
            ...prev,
            phase:      'locked',
            retryAfter: data.retry_after_seconds,
          }));
        }
      })
      .catch(() => {});
  }, [workspaceId]);

  // ── Stop polling helper ─────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  // ── Start polling for fresh data after jobs are dispatched ──────────────
  const startPolling = useCallback(() => {
    stopPolling();
    pollStart.current = Date.now();

    // Snapshot current totals to detect when data actually changed
    const cached = queryClient.getQueryData<any>(
      queryKeys.analyticsData.period(30, workspaceId!),
    );
    const baselineViews = cached?.overview?.total_views ?? -1;

    pollTimer.current = setInterval(async () => {
      const elapsed = Date.now() - pollStart.current;

      // Invalidate so TanStack refetches
      await queryClient.invalidateQueries({ queryKey: queryKeys.analyticsData.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      // Check if data changed
      const fresh = queryClient.getQueryData<any>(
        queryKeys.analyticsData.period(30, workspaceId!),
      );
      const freshViews = fresh?.overview?.total_views ?? -1;

      const dataChanged = freshViews !== baselineViews && freshViews !== -1;
      const timedOut    = elapsed >= POLL_TIMEOUT_MS;

      if (dataChanged || timedOut) {
        stopPolling();

        if (toastId.current) toast.dismiss(toastId.current);

        if (dataChanged) {
          toast.success('Datos actualizados correctamente', { duration: 3000 });
        } else {
          // Timed out but still dismiss loading — data may have been the same
          toast.success('Sincronización completada', { duration: 3000 });
        }

        setState((prev) => ({
          ...prev,
          phase:        'locked',
          retryAfter:   COOLDOWN_SECONDS,
          lastSyncedAt: new Date(),
        }));
      }
    }, POLL_INTERVAL_MS);
  }, [workspaceId, queryClient, stopPolling]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────
  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Main sync trigger ───────────────────────────────────────────────────
  const sync = useCallback(async () => {
    if (!workspaceId || state.phase === 'dispatching' || state.phase === 'waiting' || state.phase === 'locked') return;

    setState((prev) => ({ ...prev, phase: 'dispatching' }));

    try {
      await axios.post('/api/v1/analytics/sync');

      // Show persistent loading toast while jobs run
      toastId.current = toast.loading('Actualizando métricas desde las plataformas...') as string;

      setState((prev) => ({ ...prev, phase: 'waiting' }));
      startPolling();

    } catch (err: any) {
      const retryAfter = err?.response?.data?.retry_after_seconds ?? 0;

      if (retryAfter > 0) {
        toast('Sincronización reciente en progreso. Intenta en unos minutos.', {
          icon: '⏳',
          duration: 4000,
        });
        setState((prev) => ({
          ...prev,
          phase:      'locked',
          retryAfter: retryAfter,
        }));
      } else {
        toast.error('No se pudo iniciar la sincronización.');
        setState((prev) => ({ ...prev, phase: 'idle' }));
      }
    }
  }, [workspaceId, state.phase, startPolling]);

  const isBusy = state.phase === 'dispatching' || state.phase === 'waiting';

  return {
    sync,
    isBusy,
    phase:        state.phase,
    locked:       state.phase === 'locked',
    retryAfter:   state.retryAfter,
    lastSyncedAt: state.lastSyncedAt,
  };
}
