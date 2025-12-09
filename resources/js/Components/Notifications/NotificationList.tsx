import { useTheme } from "@/Hooks/useTheme";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import axios from "axios";
import { Bell, CheckCheck } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import NotificationItem from "./NotificationItem";

export default function NotificationList() {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get("/notifications");
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
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
      console.error("Failed to mark as read");
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
      console.error("Failed to mark all as read");
    }
  };

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <PopoverButton
            className={`relative p-2 rounded-full transition-colors outline-none focus:ring-2 focus:ring-primary-500/50 ${
              theme === "dark"
                ? "text-gray-400 hover:text-white hover:bg-neutral-800"
                : "text-gray-600 hover:text-primary-600 hover:bg-gray-100"
            }`}
            onClick={() => {
              if (!open) fetchNotifications();
            }}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 block h-4 w-4 transform -translate-y-1/8 translate-x-1/8 rounded-full ring-2 ring-white dark:ring-neutral-900 bg-red-500 text-[10px] text-white font-bold leading-tight flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </PopoverButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <PopoverPanel className="absolute bottom-full left-0 mb-2 z-50 w-80 sm:w-96 transform">
              <div
                className={`overflow-hidden rounded-xl shadow-2xl ring-1 ${
                  theme === "dark"
                    ? "bg-neutral-900 ring-neutral-700"
                    : "bg-white ring-black/5"
                }`}
              >
                <div
                  className={`p-4 border-b flex items-center justify-between ${
                    theme === "dark"
                      ? "border-neutral-800 bg-neutral-800/50"
                      : "border-gray-100 bg-gray-50/50"
                  }`}
                >
                  <h3
                    className={`font-semibold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs flex items-center gap-1 text-primary-500 hover:text-primary-600 font-medium transition-colors"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={markAsRead}
                      />
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <div
                        className={`mx-auto w-12 h-12 rounded-full mb-3 flex items-center justify-center ${
                          theme === "dark" ? "bg-neutral-800" : "bg-gray-100"
                        }`}
                      >
                        <Bell
                          className={`w-6 h-6 ${
                            theme === "dark" ? "text-gray-600" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        No notifications yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </PopoverPanel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
