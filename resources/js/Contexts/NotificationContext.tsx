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
        // Flatten structure if needed, depends on how basic Notification broadcast works
        // Usually notification contains the data merged.
        // We wrap it to match NotificationData structure
        const { id, type, ...rest } = notification;
        const newNotif: NotificationData = {
          id: id,
          type: type,
          category: rest.category || "application",
          data: rest,
          read_at: null,
          created_at: new Date().toISOString(),
        };

        setNotifications((prev) => {
          const exists = prev.find((n) => n.id === newNotif.id);
          if (exists) return prev;

          // Add to top
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
        refreshNotifications: fetchNotifications, // Alias for manual refresh
        markAsRead,
        markAllAsRead,
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
