import { approvalService, type ApproveRequestPayload } from '@/Services/Approval/approvalService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useApprovalActions() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['approvals'] });
  };

  const submitForApproval = useMutation({
    mutationFn: (contentId: number) => approvalService.submitForApproval(contentId),
    onSuccess: invalidate,
  });

  const approveRequest = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload?: ApproveRequestPayload }) =>
      approvalService.approveRequest(id, payload),
    onSuccess: invalidate,
  });

  const rejectRequest = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      approvalService.rejectRequest(id, reason),
    onSuccess: invalidate,
  });

  const approveContent = useMutation({
    mutationFn: ({ id, comment }: { id: number; comment?: string }) =>
      approvalService.approveContent(id, comment),
    onSuccess: invalidate,
  });

  const rejectContent = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      approvalService.rejectContent(id, reason),
    onSuccess: invalidate,
  });

  return {
    submitForApproval,
    approveRequest,
    rejectRequest,
    approveContent,
    rejectContent,
  };
}
