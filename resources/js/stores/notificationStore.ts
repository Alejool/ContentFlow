import axios from "axios";
import { create } from "zustand";

export interface NotificationData {
  id: string;
  type: string;
  category: "application" | "system";
  data: {
    message?: string;
    description?: string;
    title?: string;
    status?: string;
    platform?: string;
    priority?: string;
    [key: string]: any;
  };
  read_at: string | null;
  created_at: string;
}

interface NotificationState {
  notifications: NotificationData[];
  applicationNotifications: NotificationData[];
  systemNotifications: NotificationData[];
  unreadCount: number;
  isLoading: boolean;

  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  filterByPriority: (priority: string | null) => NotificationData[];
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  applicationNotifications: [],
  systemNotifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get("/api/v1/notifications");
      const notifications = response.data.notifications.sort(
        (a: NotificationData, b: NotificationData) => {
          // Sort by read status (unread first)
          if (a.read_at === null && b.read_at !== null) return -1;
          if (a.read_at !== null && b.read_at === null) return 1;

          // Then by date (newest first)
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        },
      );

      const unreadCount = response.data.unread_count;

      const applicationNotifications = notifications.filter(
        (n: NotificationData) =>
          n.category === "application" || n.data.category === "application",
      );

      const systemNotifications = notifications.filter(
        (n: NotificationData) =>
          (n.category === "system" || !n.category) &&
          n.data.category !== "application",
      );

      set({
        notifications,
        unreadCount,
        applicationNotifications,
        systemNotifications,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await axios.post(`/api/v1/notifications/${id}/read`);
      set((state) => {
        const updatedNotifications = state.notifications.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
        );

        // Re-calculate derived state
        const unreadCount = Math.max(0, state.unreadCount - 1);

        return {
          notifications: updatedNotifications,
          unreadCount,
          applicationNotifications: updatedNotifications.filter(
            (n) =>
              n.category === "application" || n.data.category === "application",
          ),
          systemNotifications: updatedNotifications.filter(
            (n) =>
              (n.category === "system" || !n.category) &&
              n.data.category !== "application",
          ),
        };
      });
    } catch (error) {
      }
  },

  markAllAsRead: async () => {
    try {
      await axios.post("/api/v1/notifications/read-all");
      set((state) => {
        const updatedNotifications = state.notifications.map((n) => ({
          ...n,
          read_at: new Date().toISOString(),
        }));

        return {
          notifications: updatedNotifications,
          unreadCount: 0,
          applicationNotifications: updatedNotifications.filter(
            (n) =>
              n.category === "application" || n.data.category === "application",
          ),
          systemNotifications: updatedNotifications.filter(
            (n) =>
              (n.category === "system" || !n.category) &&
              n.data.category !== "application",
          ),
        };
      });
    } catch (error) {
      }
  },

  deleteNotification: async (id: string) => {
    try {
      await axios.delete(`/api/v1/notifications/${id}`);
      set((state) => {
        const notification = state.notifications.find((n) => n.id === id);
        const updatedNotifications = state.notifications.filter(
          (n) => n.id !== id,
        );
        let unreadCount = state.unreadCount;

        if (notification && !notification.read_at) {
          unreadCount = Math.max(0, unreadCount - 1);
        }

        return {
          notifications: updatedNotifications,
          unreadCount,
          applicationNotifications: updatedNotifications.filter(
            (n) =>
              n.category === "application" || n.data.category === "application",
          ),
          systemNotifications: updatedNotifications.filter(
            (n) =>
              (n.category === "system" || !n.category) &&
              n.data.category !== "application",
          ),
        };
      });
    } catch (error) {
      }
  },

  filterByPriority: (priority: string | null) => {
    const { notifications } = get();
    if (!priority) return notifications;
    return notifications.filter((n) => n.data.priority === priority);
  },
}));
