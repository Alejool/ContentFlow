import axios from "axios";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

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
    [key: string]: any;
  };
  read_at: string | null;
  created_at: string;
}

interface NotificationContextType {
  notifications: NotificationData[];
  applicationNotifications: NotificationData[];
  systemNotifications: NotificationData[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllRead: () => Promise<void>;
  filterByPlatform: (platform: string | null) => NotificationData[];
  filterByPriority: (priority: string | null) => NotificationData[];
  getPlatformNotifications: (platform: string) => NotificationData[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider = ({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: any;
}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axios.get("/api/v1/notifications");
      const sortedNotifications = response.data.notifications.sort(
        (a: NotificationData, b: NotificationData) => {
          // Sort by read status (unread first)
          if (a.read_at === null && b.read_at !== null) return -1;
          if (a.read_at !== null && b.read_at === null) return 1;

          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        },
      );

      setNotifications(sortedNotifications);
      setUnreadCount(response.data.unread_count);
      setLoading(false);
    } catch (error) {
      }
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await axios.post(`/api/v1/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post("/api/v1/notifications/read-all");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() })),
      );
      setUnreadCount(0);
    } catch (error) {
      }
  };

  const deleteNotification = async (id: string) => {
    try {
      await axios.delete(`/api/v1/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const notification = notifications.find((n) => n.id === id);
      if (notification && !notification.read_at) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      }
  };

  const deleteAllRead = async () => {
    try {
      await axios.delete("/api/v1/notifications/read");
      setNotifications((prev) => prev.filter((n) => !n.read_at));
    } catch (error) {
      }
  };

  const filterByPlatform = (platform: string | null): NotificationData[] => {
    if (!platform) return notifications;
    return notifications.filter(
      (n) => n.data.platform?.toLowerCase() === platform.toLowerCase(),
    );
  };

  const filterByPriority = (priority: string | null): NotificationData[] => {
    if (!priority) return notifications;
    return notifications.filter((n) => n.data.priority === priority);
  };

  const getPlatformNotifications = (platform: string): NotificationData[] => {
    return applicationNotifications.filter(
      (n) => n.data.platform?.toLowerCase() === platform.toLowerCase(),
    );
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (user?.id && (window as any).Echo) {
      const channel = (window as any).Echo.private(`users.${user.id}`);

      channel.listen(".NotificationCreated", (e: any) => {
        fetchNotifications();
      });

      return () => {
        if ((window as any).Echo) {
          channel.stopListening(".NotificationCreated");
        }
      };
    }
  }, [user, fetchNotifications]);

  const applicationNotifications = notifications.filter(
    (n) => n.category === "application" || n.data.category === "application",
  );

  const systemNotifications = notifications.filter(
    (n) =>
      (n.category === "system" || !n.category) &&
      n.data.category !== "application",
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        applicationNotifications,
        systemNotifications,
        unreadCount,
        loading,
        fetchNotifications,
        refreshNotifications: fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllRead,
        filterByPlatform,
        filterByPriority,
        getPlatformNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider",
    );
  }
  return context;
};
