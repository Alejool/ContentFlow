import { usePublicationStore } from "@/stores/publicationStore";

// Debounce map to prevent rapid-fire updates
const updateDebounceMap = new Map<number, NodeJS.Timeout>();

export function initPublicationsRealtime(userId: number) {
  window.Echo.private(`users.${userId}`).listen(
    ".PublicationStatusUpdated",
    (e: any) => {
      const publicationId =
        typeof e.publicationId === "string"
          ? parseInt(e.publicationId, 10)
          : e.publicationId;

      // Clear existing timeout for this publication
      if (updateDebounceMap.has(publicationId)) {
        clearTimeout(updateDebounceMap.get(publicationId)!);
      }

      // Debounce updates by 500ms to batch rapid changes
      const timeout = setTimeout(() => {
        usePublicationStore.getState().updatePublication(publicationId, {
          status: e.status,
        });
        updateDebounceMap.delete(publicationId);
      }, 500);

      updateDebounceMap.set(publicationId, timeout);
    }
  );
}
