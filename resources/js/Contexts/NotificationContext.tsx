import axios from "axios";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import toast from "react-hot-toast";

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
  undefined
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
      const response = await axios.get("/notifications");
      const sortedNotifications = response.data.notifications.sort(
        (a: NotificationData, b: NotificationData) => {
          // Sort by read status (unread first)
          if (a.read_at === null && b.read_at !== null) return -1;
          if (a.read_at !== null && b.read_at === null) return 1;

          // Then by date (newest first)
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
      );

      setNotifications(sortedNotifications);
      setUnreadCount(response.data.unread_count);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await axios.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post("/notifications/read-all");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await axios.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      // Update unread count if it was unread
      const notification = notifications.find((n) => n.id === id);
      if (notification && !notification.read_at) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  const deleteAllRead = async () => {
    try {
      await axios.delete("/notifications/read");
      setNotifications((prev) => prev.filter((n) => !n.read_at));
    } catch (error) {
      console.error("Failed to delete read notifications", error);
    }
  };

  const filterByPlatform = (platform: string | null): NotificationData[] => {
    if (!platform) return notifications;
    return notifications.filter(
      (n) => n.data.platform?.toLowerCase() === platform.toLowerCase()
    );
  };

  const filterByPriority = (priority: string | null): NotificationData[] => {
    if (!priority) return notifications;
    return notifications.filter((n) => n.data.priority === priority);
  };

  const getPlatformNotifications = (platform: string): NotificationData[] => {
    return applicationNotifications.filter(
      (n) => n.data.platform?.toLowerCase() === platform.toLowerCase()
    );
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for faster updates without Redis
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Real-time listener
  useEffect(() => {
    if (user?.id && (window as any).Echo) {
      const channel = (window as any).Echo.private(
        `App.Models.User.${user.id}`
      );

      channel.notification((notification: any) => {
        const { id, type, ...rest } = notification;
        const newNotif: NotificationData = {
          id: id,
          type: type,
          category: rest.category || "application",
          data: rest,
          read_at: null,
          created_at: new Date().toISOString(),
        };

        if (newNotif.data.message) {
          const toastOptions = {
            duration: 3000,
            position: "top-center" as const,
          };

          if (newNotif.data.status === "success") {
            toast.success(newNotif.data.message, toastOptions);
          } else if (newNotif.data.status === "error") {
            toast.error(newNotif.data.message, toastOptions);
          } else if (newNotif.data.status === "warning") {
            toast(newNotif.data.message, { ...toastOptions, icon: "⚠️" });
          } else {
            toast(newNotif.data.message, toastOptions);
          }
        }

        setNotifications((prev) => {
          const exists = prev.find((n) => n.id === newNotif.id);
          if (exists) return prev;

          return [newNotif, ...prev];
        });

        setUnreadCount((prev) => prev + 1);
      });

      return () => {
        if ((window as any).Echo) {
          (window as any).Echo.leave(`App.Models.User.${user.id}`);
        }
      };
    }
  }, [user]);

  const applicationNotifications = notifications.filter(
    (n) => n.category === "application" || n.data.category === "application"
  );

  const systemNotifications = notifications.filter(
    (n) =>
      (n.category === "system" || !n.category) &&
      n.data.category !== "application"
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
      "useNotificationContext must be used within a NotificationProvider"
    );
  }
  return context;
};
