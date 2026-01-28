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
        toast.success("Publication published successfully!");
      } else if (status === "failed") {
        toast.error("Publication failed to publish.");
      }
    },
  );

  // NEW: Workspace channel listener (Global data sync is now handled in usePublicationLock.ts)
  if (workspaceId) {
    window.Echo.private(`workspace.${workspaceId}`).listen(
      ".publication.updated",
      (e: any) => {
        const { publication } = e;
        if (
          publication &&
          (publication.status === "approved" || publication.status === "draft")
        ) {
          // We only keep the toast here to notify about processing completion
          // The actual store updates are handled in useWorkspaceLocks
          toast.success(`Procesado completado: ${publication.title}`);
        }
      },
    );
  }
}
