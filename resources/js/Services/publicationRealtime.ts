import { usePublicationStore } from "@/stores/publicationStore";
import { toast } from "react-hot-toast";

export function initPublicationsRealtime(userId: number, workspaceId?: number) {
  // Existing User channel listener for simple status updates
  window.Echo.private(`users.${userId}`).listen(
    ".PublicationStatusUpdated",
    (e: any) => {
      const { publicationId, status } = e;

      // Update store
      usePublicationStore.getState().updatePublication(publicationId, {
        status: status,
      });

      // Show toast notifications for final statuses
      if (status === "published") {
        toast.success("Publication published successfully!", {
          id: `pub-published-${publicationId}`,
        });
      } else if (status === "failed") {
        toast.error("Publication failed to publish.", {
          id: `pub-failed-${publicationId}`,
        });
      }
    },
  );

  // NEW: Workspace channel listener (Global data sync is now handled in usePublicationLock.ts)
  // Note: Toast notifications for publication updates are handled in useWorkspaceLocks
  // to avoid duplicate notifications
}
