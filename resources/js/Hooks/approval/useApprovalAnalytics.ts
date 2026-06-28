import { approvalService } from '@/Services/Approval/approvalService';
import { useQuery } from '@tanstack/react-query';

export function useApprovalAnalytics(workspaceId: string | number, enabled = true) {
  return useQuery({
    queryKey: ['approvals', 'analytics', workspaceId],
    queryFn: () => approvalService.getAnalytics(workspaceId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
