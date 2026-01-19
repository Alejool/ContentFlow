import { usePublicationStore } from "@/stores/publicationStore";
import { toast } from "react-hot-toast";

export function initPublicationsRealtime(userId: number) {
  window.Echo.private(`users.${userId}`).listen(
    ".PublicationStatusUpdated",
    (e: any) => {
      console.log("Realtime event received:", e);
      const { publicationId, status } = e;

      // Update store
      usePublicationStore.getState().updatePublication(publicationId, {
        status: status,
      });

      console.log(`Updated publication ${publicationId} to status: ${status}`);

      // Show toast notifications for final statuses
      if (status === "published") {
        console.log("Showing success toast");
        toast.success("Publication published successfully!");
      } else if (status === "failed") {
        console.log("Showing error toast");
        toast.error("Publication failed to publish.");
      }
    },
  );
}
