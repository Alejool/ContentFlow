import { useNotificationStore } from "@/stores/notificationStore";

export const useNotifications = () => {
  return useNotificationStore();
};
