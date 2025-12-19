import { useNotificationStore } from "@/stores/notificationStore";

export function initNotificationRealtime(userId: number) {
  if (window.Echo) {
    window.Echo.private(`users.${userId}`).listen(
      ".NotificationCreated",
      (e: any) => {
        // Show toast if message is present (optional, can be customized)
        // Ideally the payload 'e' might contain some info to show toast immediately
        // but for now we just fetch fresh data.

        useNotificationStore.getState().fetchNotifications();
      }
    );
  }
}
