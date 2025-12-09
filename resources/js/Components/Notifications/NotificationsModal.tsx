import { useNotifications } from "@/Hooks/useNotifications";
import { useTheme } from "@/Hooks/useTheme";
import { Dialog, Tab, Transition } from "@headlessui/react";
import { Bell, CheckCheck, Layers, Settings, X } from "lucide-react";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import NotificationItem from "./NotificationItem";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificationCount?: number;
  setNotificationCount?: (count: number) => void;
}

export default function NotificationsModal({
  isOpen,
  onClose,
}: NotificationsModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const {
    notifications,
    applicationNotifications,
    systemNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const isDark = theme === "dark";

  const categories = [
    { id: "all", label: "Todas", icon: Layers, count: notifications.length },
    {
      id: "application",
      label: "Aplicaciones",
      icon: Bell,
      count: applicationNotifications.length,
    },
    {
      id: "system",
      label: "Sistema",
      icon: Settings,
      count: systemNotifications.length,
    },
  ];

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel
                  className={`pointer-events-auto w-screen max-w-md ${
                    isDark ? "bg-neutral-900" : "bg-white"
                  }`}
                >
                  <div className="flex h-full flex-col shadow-xl">
                    {/* Header */}
                    <div className="px-4 py-6 sm:px-6 shadow-sm border-b border-gray-200 dark:border-neutral-700">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Dialog.Title
                            className={`text-lg font-semibold leading-6 ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {t("notifications.title")}
                          </Dialog.Title>
                          {unreadCount > 0 && (
                            <span className="inline-flex items-center rounded-md bg-main-color/10 px-2 py-1 text-xs font-medium text-main-color ring-1 ring-inset ring-main-color/20">
                              {unreadCount} {t("notifications.new")}
                            </span>
                          )}
                        </div>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className={`relative rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-main-color focus:ring-offset-2 ${
                              isDark
                                ? "hover:bg-neutral-800"
                                : "hover:bg-gray-100"
                            }`}
                            onClick={onClose}
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Close panel</span>
                            <X className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => markAllAsRead()}
                          disabled={unreadCount === 0}
                          className={`flex items-center gap-1.5 text-sm font-medium ${
                            unreadCount === 0
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-main-color hover:text-main-color/80"
                          }`}
                        >
                          <CheckCheck className="h-4 w-4" />
                          {t("notifications.mark_all_read")}
                        </button>
                      </div>
                    </div>

                    {/* Tabs & Content */}
                    <Tab.Group>
                      <div className="border-b border-gray-200 dark:border-neutral-700">
                        <Tab.List className="-mb-px flex space-x-4 px-4 sm:px-6">
                          {categories.map((category) => (
                            <Tab
                              key={category.id}
                              className={({ selected }) =>
                                classNames(
                                  selected
                                    ? "border-main-color text-main-color"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300",
                                  "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2 outline-none"
                                )
                              }
                            >
                              <category.icon className="h-4 w-4" />
                              {category.label}
                              {category.count > 0 && (
                                <span
                                  className={`ml-1.5 rounded-full py-0.5 px-2 text-xs font-medium ${
                                    isDark
                                      ? "bg-neutral-800 text-gray-300"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {category.count}
                                </span>
                              )}
                            </Tab>
                          ))}
                        </Tab.List>
                      </div>

                      <Tab.Panels className="flex-1 overflow-y-auto">
                        {/* All Notifications */}
                        <Tab.Panel className="h-full p-4 sm:p-6 space-y-4">
                          {notifications.length > 0 ? (
                            notifications.map((notification) => (
                              <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={() => markAsRead(notification.id)}
                              />
                            ))
                          ) : (
                            <EmptyState t={t} isDark={isDark} />
                          )}
                        </Tab.Panel>

                        {/* Application Notifications */}
                        <Tab.Panel className="h-full p-4 sm:p-6 space-y-4">
                          {applicationNotifications.length > 0 ? (
                            applicationNotifications.map((notification) => (
                              <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={() => markAsRead(notification.id)}
                              />
                            ))
                          ) : (
                            <EmptyState t={t} isDark={isDark} />
                          )}
                        </Tab.Panel>

                        {/* System Notifications */}
                        <Tab.Panel className="h-full p-4 sm:p-6 space-y-4">
                          {systemNotifications.length > 0 ? (
                            systemNotifications.map((notification) => (
                              <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={() => markAsRead(notification.id)}
                              />
                            ))
                          ) : (
                            <EmptyState t={t} isDark={isDark} />
                          )}
                        </Tab.Panel>
                      </Tab.Panels>
                    </Tab.Group>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function EmptyState({ t, isDark }: { t: any; isDark: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div
        className={`rounded-full p-4 mb-4 ${
          isDark ? "bg-neutral-800" : "bg-gray-100"
        }`}
      >
        <Bell
          className={`h-8 w-8 ${isDark ? "text-gray-500" : "text-gray-400"}`}
        />
      </div>
      <h3
        className={`text-sm font-medium ${
          isDark ? "text-gray-200" : "text-gray-900"
        }`}
      >
        {t("notifications.no_notifications")}
      </h3>
      <p
        className={`mt-1 text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}
      >
        {t("notifications.warning")}
      </p>
    </div>
  );
}
