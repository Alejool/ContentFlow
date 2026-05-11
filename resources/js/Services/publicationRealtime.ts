import i18n from '@/i18n';
import { usePublicationStore } from '@/stores/publicationStore';
import { createEchoSubscription } from '@/Utils/echoHelper';
import toast from 'react-hot-toast';

export function initPublicationsRealtime(userId: number, _workspaceId?: number) {
  // Use safe Echo subscription with automatic retry logic
  return createEchoSubscription(`users.${userId}`, 'private', (channel) => {
    // Existing User channel listener for simple status updates
    channel.listen(
      '.PublicationStatusUpdated',
      (e: { publicationId: number; status: string }) => {
        const { publicationId, status } = e;

        // Update store
        usePublicationStore.getState().updatePublication(publicationId, {
          status: status,
        });

        // Show toast notifications for final statuses
        if (status === 'published') {
          toast.success(i18n.t('publications.toast.publishedSuccess'), {
            id: `pub-published-${publicationId}`,
          });
        } else if (status === 'failed') {
          toast.error(i18n.t('publications.toast.publishedError'), {
            id: `pub-failed-${publicationId}`,
          });
        }
      },
    );
  });

  // NEW: Workspace channel listener (Global data sync is now handled in usePublicationLock.ts)
  // Note: Toast notifications for publication updates are handled in useWorkspaceLocks
  // to avoid duplicate notifications
}
