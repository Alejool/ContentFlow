import { approvalService, type ApprovalWorkflow } from '@/Services/Approval/approvalService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export function useApprovalWorkflow(workspaceId: string | number) {
  const queryClient = useQueryClient();
  const queryKey = ['approvals', 'workflow', workspaceId];

  const query = useQuery({
    queryKey,
    queryFn: () => approvalService.getWorkflow(workspaceId),
    staleTime: 60 * 1000,
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      return status !== 404 && failureCount < 2;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      enabled
        ? approvalService.enableWorkflow(workspaceId)
        : approvalService.disableWorkflow(workspaceId),
    onSuccess: (_, enabled) => {
      queryClient.setQueryData<ApprovalWorkflow>(queryKey, (prev) =>
        prev ? { ...prev, is_enabled: enabled } : prev,
      );
    },
  });

  const configureMutation = useMutation({
    mutationFn: (data: Partial<ApprovalWorkflow>) =>
      approvalService.configureWorkflow(workspaceId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, updated);
    },
  });

  return {
    workflow: query.data,
    isLoading: query.isLoading,
    toggle: toggleMutation.mutateAsync,
    isToggling: toggleMutation.isPending,
    configure: configureMutation.mutateAsync,
    isSaving: configureMutation.isPending,
  };
}
