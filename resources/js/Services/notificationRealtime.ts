import { ICON_MAP } from "@/Components/Notifications/DynamicIcon";
import { ToastService } from "@/Services/ToastService";
import { useNotificationStore } from "@/stores/notificationStore";
import React from "react";

export function initNotificationRealtime(userId: number) {
  if (window.Echo) {
    window.Echo.private(`users.${userId}`).listen(
      ".NotificationCreated",
      (e: any) => {
        // Show toast immediately
        if (e.title || e.message) {
          const title = e.title || "Nueva notificación";
          const message = e.message || "";

          let icon = undefined;
          if (e.icon && ICON_MAP[e.icon]) {
            const IconComp = ICON_MAP[e.icon];
            icon = React.createElement(IconComp, { className: "w-5 h-5" });
          }

          if (e.type === "error" || e.status === "failed") {
            ToastService.error(`${title}: ${message}`, { icon });
          } else if (e.type === "warning") {
            ToastService.warning(`${title}: ${message}`, { icon });
          } else {
            ToastService.success(`${title}: ${message}`, { icon });
          }
        }

        useNotificationStore.getState().fetchNotifications();
      },
    );
  }
}
