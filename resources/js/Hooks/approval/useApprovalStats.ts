import { approvalService } from '@/Services/Approval/approvalService';
import { useQuery } from '@tanstack/react-query';

export function useApprovalStats(refreshTrigger?: number) {
  return useQuery({
    queryKey: ['approvals', 'stats', refreshTrigger],
    queryFn: () => approvalService.getStats(),
    staleTime: 60 * 1000,
  });
}
