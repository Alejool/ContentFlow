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

  // NEW: Workspace channel listener for deep publication updates (e.g. video processing finished)
  if (workspaceId) {
    window.Echo.private(`workspace.${workspaceId}`).listen(
      ".publication.updated",
      (e: any) => {
        const { publication } = e;

        if (publication && publication.id) {
          // Update the store with the full object (includes new media, status, etc.)
          usePublicationStore
            .getState()
            .updatePublication(publication.id, publication);

          if (
            publication.status === "approved" ||
            publication.status === "draft"
          ) {
            toast.success(
              `Video processing complete for: ${publication.title}`,
            );
          }
        }
      },
    );
  }
}
