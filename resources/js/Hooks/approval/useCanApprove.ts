import { useAbility } from '@/Contexts/AbilityContext';
import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';

interface CanApproveResponse {
  can_approve: boolean;
  reason: 'admin_permission' | 'workflow_assignment' | '';
}

/**
 * Hook to check if the current user can approve content
 * Uses CASL ability context instead of making HTTP requests
 */
export function useCanApprove(workspaceId?: number) {
  const { auth } = usePage<any>().props;
  const currentWorkspace = auth.current_workspace;
  
  // Try to get ability, but handle case where provider is not available
  let ability;
  try {
    ability = useAbility();
  } catch (error) {
    // If AbilityProvider is not available, return default values
    return {
      canApprove: false,
      reason: '' as const,
      isLoading: false
    };
  }

  const result = useMemo(() => {
    // Check if user has approve permission via CASL
    const canApprove = ability.can('approve', 'ApprovalRequest');
    
    // Determine reason
    let reason: 'admin_permission' | 'workflow_assignment' | '' = '';
    
    if (canApprove) {
      const userRole = currentWorkspace?.user_role_slug;
      if (userRole === 'owner' || userRole === 'admin') {
        reason = 'admin_permission';
      } else {
        reason = 'workflow_assignment';
      }
    }

    return {
      canApprove,
      reason,
      isLoading: false
    };
  }, [ability, currentWorkspace]);

  return result;
}
