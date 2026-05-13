import { queryKeys } from '@/lib/common/queryKeys';
import type { ApprovalRequest } from '@/types/Approval/ApprovalTypes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect } from 'react';

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

  useEffect(() => {
    if (refreshTrigger === undefined || refreshTrigger < 1) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
  }, [refreshTrigger, queryClient]);

  return {
    requests: query.data ?? [],
    isLoading: query.isLoading,
    refresh: query.refetch,
  };
}
