import { usePublicationStore } from "@/stores/publicationStore";

export function initPublicationsRealtime(userId: number) {
  console.log("Initializing Echo listener for user:", userId);

  window.Echo.private(`users.${userId}`).listen(
    ".PublicationStatusUpdated",
    (e: any) => {
      console.log("Realtime update received for publication:", e.publicationId);
      const publicationId =
        typeof e.publicationId === "string"
          ? parseInt(e.publicationId, 10)
          : e.publicationId;

      usePublicationStore.getState().updatePublication(publicationId, {
        status: e.status,
      });
    }
  );
}
