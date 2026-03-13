import PublicationActionService, { PublicationActionResponse } from '@/Services/PublicationActionService';
import { useEffect, useState } from 'react';

/**
 * Custom hook to determine what publication action is available for the current user.
 * Automatically fetches and caches the action based on user role and workspace settings.
 */
export function usePublicationAction() {
  const [actionData, setActionData] = useState<PublicationActionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicationAction();
  }, []);

  const fetchPublicationAction = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await PublicationActionService.getPublicationAction();
      setActionData(data);
    } catch (err) {
      setError('Failed to fetch publication action');
      console.error('Error in usePublicationAction:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    actionData,
    isLoading,
    error,
    refetch: fetchPublicationAction,
    // Convenience properties
    canPublishDirectly: actionData?.action === 'publish',
    mustSendToReview: actionData?.action === 'review',
    isOwner: actionData?.can_bypass_workflow || false,
    workflowEnabled: actionData?.workflow_enabled || false,
    buttonText: actionData?.button_text || 'Publicar',
    buttonTextEn: actionData?.button_text_en || 'Publish',
  };
}
