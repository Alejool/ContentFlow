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
/**
 * Hook to check if the current user can approve content
 * Uses CASL ability context instead of making HTTP requests
 */
export function useCanApprove(workspaceId?: number) {
  const { auth } = usePage<any>().props;
  const currentWorkspace = auth.current_workspace;
  
  // Try to get ability, but handle case where provider is not available yet
  let ability;
  let hasAbilityContext = true;
  
  try {
    ability = useAbility();
  } catch (error) {
    // If AbilityProvider is not available yet, we'll use a fallback
    hasAbilityContext = false;
  }

  const result = useMemo(() => {
    // Fallback: If no ability context, check based on role and permissions directly
    if (!hasAbilityContext || !ability) {
      const userRole = currentWorkspace?.user_role_slug;
      const permissions = currentWorkspace?.permissions || [];
      
      // Owner and Admin can always approve
      if (userRole === 'owner' || userRole === 'admin') {
        return {
          canApprove: true,
          reason: 'admin_permission' as const,
          isLoading: false
        };
      }
      
      // Check if user has 'approve' or 'publish' permission
      const hasApprovePermission = permissions.includes('approve') || permissions.includes('publish');
      
      return {
        canApprove: hasApprovePermission,
        reason: hasApprovePermission ? ('workflow_assignment' as const) : ('' as const),
        isLoading: false
      };
    }
    
    // Check if user has approve permission via CASL (lowercase 'approve')
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
  }, [ability, currentWorkspace, hasAbilityContext]);

  return result;
}
