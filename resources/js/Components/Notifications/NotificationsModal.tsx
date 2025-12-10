import { useNotifications } from "@/Hooks/useNotifications";
import { useTheme } from "@/Hooks/useTheme";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  AlertCircle,
  Bell,
  CheckCheck,
  Info,
  Layers,
  Settings,
  X,
} from "lucide-react";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import NotificationItem from "./NotificationItem";
interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
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
    filterByPriority,
  } = useNotifications();

  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);

  const isDark = theme === "dark";

  const colors = {
    bg: isDark ? "bg-neutral-900/95" : "bg-white/90",
    text: isDark ? "text-white" : "text-gray-900",
    textSecondary: isDark ? "text-gray-400" : "text-gray-600",
    textTertiary: isDark ? "text-gray-500" : "text-gray-500",
    border: isDark ? "border-neutral-700" : "border-gray-200",
    hoverBg: isDark ? "hover:bg-neutral-800" : "hover:bg-gray-100",
    bgSecondary: isDark ? "bg-neutral-800" : "bg-gray-100",
    bgTertiary: isDark ? "bg-neutral-800/50" : "bg-gray-50",
    closeBtn: isDark
      ? "hover:bg-neutral-800 text-gray-400 hover:text-gray-300"
      : "hover:bg-gray-100 text-gray-400 hover:text-gray-500",
    tabSelected: isDark
      ? "border-primary-color text-primary-500"
      : "border-primary-color text-primary-500",
    tabUnselected: isDark
      ? "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
    countBg: isDark
      ? "bg-primary-color text-gray-300"
      : "bg-gray-100 text-gray-600",
    emptyBg: isDark ? "bg-neutral-800" : "bg-gray-100",
    emptyText: isDark ? "text-gray-500" : "text-gray-400",
    overlay: isDark ? "bg-black/50" : "bg-gray-500/50",
    disabled: isDark
      ? "text-gray-600 cursor-not-allowed"
      : "text-gray-400 cursor-not-allowed",
    active: isDark
      ? "text-primary-color hover:text-primary-color/80"
      : "text-primary-color hover:text-primary-color/80",
  };

  const categories = [
    {
      id: "all",
      label: t("notifications.modal.categories.all") || "All",
      icon: Layers,
      count: notifications.length,
    },
    {
      id: "application",
      label: t("notifications.modal.categories.application") || "Application",
      icon: Bell,
      count: applicationNotifications.length,
    },
    {
      id: "system",
      label: t("notifications.modal.categories.system") || "System",
      icon: Settings,
      count: systemNotifications.length,
    },
  ];

  const classNames = (...classes: string[]) => {
    return classes.filter(Boolean).join(" ");
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className={`fixed inset-0 ${colors.overlay} transition-opacity backdrop-blur-sm`}
          />
        </TransitionChild>

        <div className={`fixed inset-0 z-10 overflow-hidden ${colors.text}`}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <TransitionChild
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel
                  className={`pointer-events-auto w-screen max-w-md ${colors.bg} flex flex-col`}
                >
                  <div className="flex h-full flex-col shadow-xl">
                    <div
                      className={`px-4 py-6 sm:px-6 shadow-sm border-b ${colors.border}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <DialogTitle
                            className={`text-lg font-semibold leading-6 ${colors.text}`}
                          >
                            {t("notifications.title")}
                          </DialogTitle>
                          {unreadCount > 0 && (
                            <span className="inline-flex items-center rounded-md bg-main-color/10 px-2 py-1 text-xs font-medium text-main-color ring-1 ring-inset ring-main-color/20">
                              {unreadCount} {t("notifications.new")}
                            </span>
                          )}
                        </div>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className={`relative rounded-md focus:outline-none focus:ring-2 focus:ring-main-color focus:ring-offset-2 p-1 ${colors.closeBtn}`}
                            onClick={onClose}
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">{t("common.close")}</span>
                            <X className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {unreadCount > 0 && (
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="flex items-center gap-1.5 text-sm font-medium text-main-color hover:text-main-color/80 transition-colors"
                          >
                            <CheckCheck className="h-4 w-4" />
                            {t("notifications.mark_all_read")}
                          </button>
                        </div>
                      )}
                    </div>

                    <TabGroup>
                      <div className={`border-b ${colors.border}`}>
                        <TabList className="-mb-px flex space-x-4 px-4 sm:px-6">
                          {categories.map((category) => (
                            <Tab
                              key={category.id}
                              className={({ selected }) =>
                                classNames(
                                  selected
                                    ? colors.tabSelected
                                    : colors.tabUnselected,
                                  "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2 outline-none transition-colors"
                                )
                              }
                            >
                              <category.icon className="h-4 w-4" />
                              {category.label}
                              {category.count > 0 && (
                                <span
                                  className={`ml-1.5 rounded-full py-0.5 px-2 text-xs font-medium ${colors.countBg}`}
                                >
                                  {category.count}
                                </span>
                              )}
                            </Tab>
                          ))}
                        </TabList>
                      </div>

                      <TabPanels className="flex-1 overflow-y-auto custom-scrollbar">
                        <TabPanel className="h-full">
                          {notifications.length > 0 ? (
                            <div className="divide-y divide-transparent">
                              {notifications
                                .slice(0, 50)
                                .map((notification) => (
                                  <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={() =>
                                      markAsRead(notification.id)
                                    }
                                  />
                                ))}
                              {notifications.length > 50 && (
                                <div
                                  className={`p-4 text-center ${
                                    theme === "dark"
                                      ? "text-gray-500"
                                      : "text-gray-400"
                                  }`}
                                >
                                  <p className="text-sm">
                                    Showing 50 of {notifications.length}{" "}
                                    notifications
                                  </p>
                                  <p className="text-xs mt-1">
                                    Older notifications are automatically
                                    archived
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <EmptyState t={t} isDark={isDark} colors={colors} />
                          )}
                        </TabPanel>

                        <TabPanel className="h-full">
                          {/* Priority Filter Chips */}
                          <div
                            className={`px-4 py-3 border-b ${colors.border} flex gap-2 flex-wrap`}
                          >
                            <button
                              onClick={() => setSelectedPriority(null)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                selectedPriority === null
                                  ? "bg-gray-800 text-white"
                                  : isDark
                                  ? "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
                                  : "bg-gray-100 text-black hover:bg-gray-200"
                              }`}
                            >
                              <Layers className="h-3.5 w-3.5" />
                              {t("notifications.all")}
                            </button>
                            <button
                              onClick={() => setSelectedPriority("high")}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                selectedPriority === "high"
                                  ? "bg-orange-800 text-white"
                                  : isDark
                                  ? "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              <AlertCircle className="h-3.5 w-3.5" />
                              {t("notifications.high_priority")}
                              {filterByPriority("high").filter(
                                (n) => n.data.category === "application"
                              ).length > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                                  {
                                    filterByPriority("high").filter(
                                      (n) => n.data.category === "application"
                                    ).length
                                  }
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => setSelectedPriority("normal")}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                selectedPriority === "normal"
                                  ? "bg-blue-500 text-white"
                                  : isDark
                                  ? "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              <Info className="h-3.5 w-3.5" />
                              {t("notifications.normal_priority")}
                            </button>
                          </div>

                          {/* Notifications List */}
                          {(() => {
                            const filteredNotifications = selectedPriority
                              ? applicationNotifications.filter((n) => {
                                  // Si no tiene priority definido, tratarlo como 'normal'
                                  const priority = n.data.priority || "normal";
                                  return priority === selectedPriority;
                                })
                              : applicationNotifications;

                            return filteredNotifications.length > 0 ? (
                              <div className="divide-y divide-transparent">
                                {filteredNotifications
                                  .slice(0, 50)
                                  .map((notification) => (
                                    <NotificationItem
                                      key={notification.id}
                                      notification={notification}
                                      onMarkAsRead={() =>
                                        markAsRead(notification.id)
                                      }
                                    />
                                  ))}
                                {filteredNotifications.length > 50 && (
                                  <div
                                    className={`p-4 text-center ${
                                      theme === "dark"
                                        ? "text-gray-500"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    <p className="text-sm">
                                      Showing 50 of{" "}
                                      {filteredNotifications.length}{" "}
                                      notifications
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                                <div
                                  className={`rounded-full p-4 mb-4 ${colors.emptyBg}`}
                                >
                                  {selectedPriority === "high" ? (
                                    <AlertCircle
                                      className={`h-8 w-8 ${colors.emptyText}`}
                                    />
                                  ) : (
                                    <Bell
                                      className={`h-8 w-8 ${colors.emptyText}`}
                                    />
                                  )}
                                </div>
                                <h3
                                  className={`text-sm font-medium ${colors.text} mb-1`}
                                >
                                  {selectedPriority === "high"
                                    ? "No hay notificaciones importantes"
                                    : "No hay notificaciones"}
                                </h3>
                                <p
                                  className={`text-sm ${colors.textSecondary}`}
                                >
                                  {selectedPriority === "high"
                                    ? "Las notificaciones importantes aparecerán aquí"
                                    : "No hay notificaciones para mostrar"}
                                </p>
                              </div>
                            );
                          })()}
                        </TabPanel>

                        <TabPanel className="h-full">
                          {systemNotifications.length > 0 ? (
                            <div className="divide-y divide-transparent">
                              {systemNotifications
                                .slice(0, 50)
                                .map((notification) => (
                                  <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={() =>
                                      markAsRead(notification.id)
                                    }
                                  />
                                ))}
                              {systemNotifications.length > 50 && (
                                <div
                                  className={`p-4 text-center ${
                                    theme === "dark"
                                      ? "text-gray-500"
                                      : "text-gray-400"
                                  }`}
                                >
                                  <p className="text-sm">
                                    Showing 50 of {systemNotifications.length}{" "}
                                    notifications
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <EmptyState t={t} isDark={isDark} colors={colors} />
                          )}
                        </TabPanel>
                      </TabPanels>
                    </TabGroup>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

interface EmptyStateProps {
  t: any;
  isDark: boolean;
  colors: {
    emptyBg: string;
    emptyText: string;
    text: string;
    textSecondary: string;
  };
}

function EmptyState({ t, colors }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center p-4">
      <div className={`rounded-full p-4 mb-4 ${colors.emptyBg}`}>
        <Bell className={`h-8 w-8 ${colors.emptyText}`} />
      </div>
      <h3 className={`text-sm font-medium ${colors.text} mb-1`}>
        {t("notifications.modal.no_notifications")}
      </h3>
      <p className={`text-sm ${colors.textSecondary}`}>
        {t("notifications.modal.empty_description") ||
          "No hay notificaciones para mostrar"}
      </p>
    </div>
  );
}
