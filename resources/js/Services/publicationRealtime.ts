import { usePublicationStore } from "@/stores/publicationStore";

let subscriptions = new Set<number>();

export function subscribeToPublication(publicationId: number) {
  if (subscriptions.has(publicationId)) return;

  subscriptions.add(publicationId);

  window.Echo.channel(`publication.${publicationId}`).listen(
    ".PublicationStatusUpdated",
    (e: any) => {
      usePublicationStore
        .getState()
        .updatePublication(e.publicationId, { status: e.status });
    }
  );
}

export function unsubscribeFromPublication(publicationId: number) {
  window.Echo.leave(`publication.${publicationId}`);
  subscriptions.delete(publicationId);
}
