import { queryKeys } from '@/lib/queryKeys';
import { ApprovalRequest } from '@/types/ApprovalTypes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

async function fetchPendingApprovalsFn(type = 'to_approve'): Promise<ApprovalRequest[]> {
  const response = await axios.get(route('api.v1.approvals.pending'), { params: { type } });
  return response.data.requests ?? [];
}

/**
 * Fetch pending approval requests.
 * `refreshTrigger` kept for backward compat — incrementing it forces a refetch.
 */
export function usePendingApprovals(refreshTrigger?: number) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.approvals.pending('to_approve'),
    queryFn: () => fetchPendingApprovalsFn('to_approve'),
    staleTime: 60 * 1000, // 1 min
  });

  // When refreshTrigger changes, invalidate so the query refetches
  // (replaces the old useEffect pattern)
  if (refreshTrigger !== undefined) {
    queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
  }

  return {
    requests: query.data ?? [],
    isLoading: query.isLoading,
    refresh: query.refetch,
  };
}
