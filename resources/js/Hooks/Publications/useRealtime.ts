import { initPublicationsRealtime } from '@/Services/publicationRealtime';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export function useRealtime(userId?: number) {
  const { props } = usePage<any>();
  const workspaceId = props.auth.user?.current_workspace_id;

  useEffect(() => {
    if (!userId) return;

    // initPublicationsRealtime now returns a cleanup function
    // that handles Echo initialization and channel cleanup
    const cleanup = initPublicationsRealtime(userId, workspaceId);

    return cleanup;
  }, [userId, workspaceId]);
}
