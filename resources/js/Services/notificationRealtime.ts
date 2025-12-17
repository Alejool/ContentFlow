import { useNotificationStore } from "@/stores/notificationStore";

export function initNotificationRealtime(userId: number) {
  console.log("Initializing Notification realtime listener for user:", userId);

  if (window.Echo) {
    window.Echo.private(`users.${userId}`).listen(
      ".NotificationCreated",
      (e: any) => {
        console.log("Notification event received:", e);

        // Show toast if message is present (optional, can be customized)
        // Ideally the payload 'e' might contain some info to show toast immediately
        // but for now we just fetch fresh data.

        useNotificationStore.getState().fetchNotifications();
      }
    );
  }
}
