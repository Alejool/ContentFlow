import { usePublicationStore } from "@/stores/publicationStore";

export function initPublicationsRealtime(userId: number) {
  window.Echo.private(`users.${userId}`).listen(
    ".PublicationStatusUpdated",
    (e: any) => {
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
