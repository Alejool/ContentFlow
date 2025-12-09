import { useNotificationContext } from "@/Contexts/NotificationContext";

export type { NotificationData } from "@/Contexts/NotificationContext";

export const useNotifications = () => {
  return useNotificationContext();
};
