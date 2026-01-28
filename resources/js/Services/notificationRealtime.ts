import { useNotificationStore } from "@/stores/notificationStore";

export function initNotificationRealtime(userId: number) {
  if (window.Echo) {
    window.Echo.private(`users.${userId}`).listen(
      ".NotificationCreated",
      (e: any) => {
        // Show toast immediately
        if (e.title || e.message) {
          const toastId = `notification-${e.id || Date.now()}`;
          // We use hot-toast via the existing global configuration if possible, 
          // but here we can just import it or use a custom event.
          // For now, let's assume we want a fresh fetch.

          // If it's an approval request, we might want to refresh publications
          if (e.type?.includes('PublicationAwaitingApproval') || e.publication_id) {
            // We can't easily access publicationStore here without importing it
            // but fetchNotifications is already refreshing the bell icon.
          }
        }

        useNotificationStore.getState().fetchNotifications();
      }
    );
  }
}
