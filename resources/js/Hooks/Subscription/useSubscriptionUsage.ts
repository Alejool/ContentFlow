import { queryClient } from '@/providers/common/QueryProvider';
import { usePage } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

// window.Echo is declared in bootstrap.ts; cast locally to keep this hook
// independent of the concrete broadcaster generic.
const echo = () => (window as any).Echo;

interface UsageData {
  team_members: any;
  period: {
    year: number;
    month: number;
    start: string;
    end: string;
  };
  plan: string;
  publications: {
    used: number;
    limit: number;
    total_available: number;
    remaining: number;
    percentage: number;
    limit_reached: boolean;
    addon_info?: {
      total: number;
      used: number;
      remaining: number;
    };
  };
  storage: {
    used_bytes: number;
    used_mb: number;
    used_gb: number;
    limit_bytes: number;
    limit_gb: number;
    total_available_bytes: number;
    total_available_gb: number;
    remaining_bytes: number;
    percentage: number;
    limit_reached: boolean;
    addon_info?: {
      total: number;
      used: number;
      remaining: number;
    };
  };
  social_accounts: {
    used: number;
    limit: number;
    total_available: number;
    remaining: number;
    percentage: number;
    limit_reached: boolean;
  };
  limits_reached: boolean;
  limits_reached_at: string | null;
}

interface UseSubscriptionUsageReturn {
  usage: UsageData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const usageQueryKey = (workspaceId: number) => ['subscription-usage', workspaceId];

async function fetchUsage(): Promise<UsageData | null> {
  const response = await fetch('/api/v1/subscription/limits/usage', {
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.success && data.data ? data.data : null;
}

// One Echo channel per workspace shared by every hook instance. Without the
// refcount, the first unmounting component would Echo.leave() the channel
// while other subscribers still need it.
const channelRefs = new Map<number, number>();

function subscribeToUsageChannel(workspaceId: number): () => void {
  const key = usageQueryKey(workspaceId);
  const refs = channelRefs.get(workspaceId) ?? 0;
  channelRefs.set(workspaceId, refs + 1);

  if (refs === 0 && echo()) {
    const channel = echo().private(`workspace.${workspaceId}.limits`);

    channel.listen('.usage.limits.updated', (data: any) => {
      let usageData = null;

      if (data.limits?.success && data.limits.data) {
        usageData = data.limits.data;
      } else if (data.success && data.data) {
        usageData = data.data;
      } else if (data.plan && data.publications) {
        usageData = data;
      }

      if (usageData) {
        queryClient.setQueryData(key, usageData);
      } else {
        queryClient.invalidateQueries({ queryKey: key });
      }
    });

    channel.error(() => {
      // silently ignore channel errors — a refetch runs on next user action
    });
  }

  return () => {
    const current = (channelRefs.get(workspaceId) ?? 1) - 1;
    if (current <= 0) {
      channelRefs.delete(workspaceId);
      if (echo()) {
        echo().leave(`workspace.${workspaceId}.limits`);
      }
    } else {
      channelRefs.set(workspaceId, current);
    }
  };
}

export function useSubscriptionUsage(): UseSubscriptionUsageReturn {
  const { auth } = (usePage().props as any) || {};
  const currentWorkspaceId = auth?.user?.current_workspace_id;

  const query = useQuery({
    queryKey: usageQueryKey(currentWorkspaceId ?? 0),
    queryFn: fetchUsage,
    enabled: !!currentWorkspaceId,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!currentWorkspaceId) {
      return;
    }

    const unsubscribe = subscribeToUsageChannel(currentWorkspaceId);

    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: usageQueryKey(currentWorkspaceId) });

    window.addEventListener('subscription-plan-changed', invalidate);
    window.addEventListener('addon-purchased', invalidate);

    return () => {
      unsubscribe();
      window.removeEventListener('subscription-plan-changed', invalidate);
      window.removeEventListener('addon-purchased', invalidate);
    };
  }, [currentWorkspaceId]);

  return {
    usage: query.data ?? null,
    loading: currentWorkspaceId ? query.isPending : false,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
