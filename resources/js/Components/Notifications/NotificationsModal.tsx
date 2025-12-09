import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Bell, Check, Clock, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/Hooks/useTheme";

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning" | "error";
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificationCount: number;
  setNotificationCount: (count: number) => void;
}

export default function NotificationsModal({
  isOpen,
  onClose,
  notificationCount,
  setNotificationCount,
}: NotificationsModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const isDark = theme === "dark";

  // Datos de ejemplo para notificaciones
  const notifications: Notification[] = [
    {
      id: 1,
      title: t("notifications.new_content"),
      message: t("notifications.content_ready"),
      time: "5 min ago",
      read: false,
      type: "success",
    },
    {
      id: 2,
      title: t("notifications.analytics_ready"),
      message: t("notifications.report_generated"),
      time: "1 hour ago",
      read: false,
      type: "info",
    },
    {
      id: 3,
      title: t("notifications.scheduled_post"),
      message: t("notifications.post_scheduled"),
      time: "2 hours ago",
      read: true,
      type: "info",
    },
    {
      id: 4,
      title: t("notifications.warning"),
      message: t("notifications.api_limit"),
      time: "1 day ago",
      read: true,
      type: "warning",
    },
  ];

  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <Check className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const markAllAsRead = () => {
    setNotificationCount(0);
  };

  const markAsRead = (id: number) => {
    const notification = notifications.find((n) => n.id === id);
    if (notification && !notification.read && notificationCount > 0) {
      setNotificationCount(notificationCount - 1);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`
                w-full max-w-md transform overflow-hidden rounded-2xl 
                ${isDark ? "bg-neutral-900" : "bg-white"} 
                p-6 text-left align-middle shadow-xl transition-all
              `}
              >
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className={`
                    text-lg font-semibold 
                    ${isDark ? "text-gray-100" : "text-gray-900"}
                  `}
                  >
                    {t("notifications.title")}
                    {notificationCount > 0 && (
                      <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                        {notificationCount} {t("notifications.new")}
                      </span>
                    )}
                  </Dialog.Title>
                  <div className="flex items-center gap-2">
                    {notificationCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-primary-600 hover:text-primary-800"
                      >
                        {t("notifications.mark_all_read")}
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className={`p-1 rounded-full ${
                        isDark ? "hover:bg-neutral-800" : "hover:bg-gray-100"
                      }`}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell
                        className={`h-12 w-12 mx-auto ${
                          isDark ? "text-gray-600" : "text-gray-300"
                        }`}
                      />
                      <p
                        className={`mt-2 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {t("notifications.no_notifications")}
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          notification.read
                            ? isDark
                              ? "bg-neutral-800/50"
                              : "bg-gray-50"
                            : isDark
                            ? "bg-primary-900/20"
                            : "bg-primary-50"
                        } ${
                          isDark ? "hover:bg-neutral-800" : "hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4
                                className={`font-medium ${
                                  isDark ? "text-gray-100" : "text-gray-900"
                                }`}
                              >
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <span className="h-2 w-2 rounded-full bg-primary-600" />
                              )}
                            </div>
                            <p
                              className={`mt-1 text-sm ${
                                isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Clock
                                className={`h-3 w-3 ${
                                  isDark ? "text-gray-500" : "text-gray-400"
                                }`}
                              />
                              <span
                                className={`text-xs ${
                                  isDark ? "text-gray-500" : "text-gray-400"
                                }`}
                              >
                                {notification.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={onClose}
                    className={`
                      w-full py-2 px-4 rounded-lg font-medium transition-colors
                      ${
                        isDark
                          ? "bg-neutral-800 hover:bg-neutral-700 text-gray-100"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                      }
                    `}
                  >
                    {t("common.close")}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
