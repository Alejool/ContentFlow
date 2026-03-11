import { useState, useEffect } from 'react';
import axios from 'axios';

interface CanApproveResponse {
  can_approve: boolean;
  reason: 'admin_permission' | 'workflow_assignment' | '';
}

export function useCanApprove(workspaceId?: number) {
  const [canApprove, setCanApprove] = useState(false);
  const [reason, setReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!workspaceId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get<CanApproveResponse & { success: boolean }>(
          route('api.v1.approvals.can-approve')
        );
        
        setCanApprove(response.data.can_approve);
        setReason(response.data.reason);
      } catch (error) {
        console.error('Error checking approval permission:', error);
        setCanApprove(false);
        setReason('');
      } finally {
        setIsLoading(false);
      }
    };

    checkPermission();
  }, [workspaceId]);

  return { canApprove, reason, isLoading };
}
