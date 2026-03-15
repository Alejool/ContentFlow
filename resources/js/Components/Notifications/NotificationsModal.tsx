
import { VirtualList } from "@/Components/common/ui/VirtualList";
import NotificationItem from "@/Components/Notifications/NotificationItem";
import { useNotifications } from "@/Hooks/useNotifications";
import { useTheme } from "@/Hooks/useTheme";
import { type NotificationTypeFilter } from "@/stores/notificationStore";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  FileText,
  Filter,
  Megaphone,
  Settings,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_OPTIONS: { key: NotificationTypeFilter; icon: any }[] = [
  { key: "all",          icon: Bell },
  { key: "publications", icon: FileText },
  { key: "approvals",    icon: ShieldCheck },
  { key: "campaigns",    icon: Megaphone },
  { key: "account",      icon: User },
  { key: "system",       icon: Settings },
];

const PRIORITY_OPTIONS = ["all", "critical", "high", "normal", "low"] as const;

export default function NotificationsModal({
  isOpen,
  onClose,
}: NotificationsModalProps) {
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const {
    applicationNotifications,
    systemNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    filterByType,
    countByType,
  } = useNotifications();

  const [activeCategory, setActiveCategory] = useState<"application" | "system">("application");
  const [selectedType, setSelectedType]         = useState<NotificationTypeFilter>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");

  const isDark = actualTheme === "dark";

  const c = {
    bg:            isDark ? "bg-neutral-900" : "bg-white",
    text:          isDark ? "text-white"     : "text-gray-900",
    textMuted:     isDark ? "text-gray-400"  : "text-gray-500",
    border:        isDark ? "border-neutral-700" : "border-gray-200",
    overlay:       isDark ? "bg-black/70"    : "bg-gray-500/60",
    closeBtn:      isDark ? "hover:bg-neutral-800 text-gray-400" : "hover:bg-gray-100 text-gray-400",
    tabActive:     isDark ? "border-primary-500 text-primary-400" : "border-primary-500 text-primary-600",
    tabInactive:   isDark ? "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
    dropdownBg:    isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-gray-200",
    dropdownItem:  isDark ? "text-gray-300 hover:bg-neutral-700 hover:text-white" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
    dropdownActive:isDark ? "bg-primary-900/40 text-primary-300" : "bg-primary-50 text-primary-700",
    chipActive:    isDark ? "bg-primary-900/50 text-primary-300 ring-1 ring-primary-700" : "bg-primary-50 text-primary-700 ring-1 ring-primary-200",
    emptyBg:       isDark ? "bg-neutral-800"  : "bg-gray-100",
    emptyText:     isDark ? "text-gray-500"   : "text-gray-400",
  };

  const categories = [
    { key: "application", label: t("notifications.modal.categories.application"), count: applicationNotifications.length },
    { key: "system",      label: t("notifications.modal.categories.system"),      count: systemNotifications.length },
  ];

  const currentSource = activeCategory === "application"
    ? applicationNotifications
    : systemNotifications;

  const filteredList = useMemo(() => {
    let list = filterByType(selectedType, currentSource);
    if (selectedPriority !== "all") {
      list = list.filter((n) => (n.data.priority ?? "normal") === selectedPriority);
    }
    return list;
  }, [currentSource, selectedType, selectedPriority]);

  const renderItem = (notification: any) => (
    <NotificationItem
      notification={notification}
      onMarkAsRead={() => markAsRead(notification.id)}
    />
  );

  const hasFilters = selectedType !== "all" || selectedPriority !== "all";

  const typeLabel = selectedType === "all"
    ? t("notifications.types.all")
    : t(`notifications.types.${selectedType}`);

  const priorityLabel = selectedPriority === "all"
    ? t("notifications.priorities.all")
    : t(`notifications.priorities.${selectedPriority}`);

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>

        {/* Overlay */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className={`fixed inset-0 ${c.overlay} backdrop-blur-sm`} />
        </TransitionChild>

        <div className={`fixed inset-0 z-10 overflow-hidden ${c.text}`}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10 w-full sm:w-auto">
              <TransitionChild
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-250"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel
                  className={`pointer-events-auto w-full sm:w-[28rem] ${c.bg} flex flex-col h-screen max-h-screen overflow-hidden shadow-2xl`}
                >
                  <div className="flex flex-col h-full mt-0 sm:mt-6">

                    {/* ── Header ── */}
                    <div className={`px-4 py-5 sm:px-6 border-b ${c.border} shrink-0`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <DialogTitle className={`text-base font-semibold ${c.text}`}>
                            {t("notifications.title")}
                          </DialogTitle>
                          {unreadCount > 0 && (
                            <span className="inline-flex items-center rounded-full bg-main-color/10 px-2 py-0.5 text-xs font-medium text-main-color ring-1 ring-inset ring-main-color/20">
                              {unreadCount} {t("notifications.new")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <button
                              type="button"
                              onClick={markAllAsRead}
                              className={`flex items-center gap-1 text-xs font-medium text-main-color hover:text-main-color/80 transition-colors`}
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                              {t("notifications.mark_all_read")}
                            </button>
                          )}
                          <button
                            type="button"
                            className={`rounded-md p-1 transition-colors ${c.closeBtn}`}
                            onClick={onClose}
                          >
                            <span className="sr-only">{t("common.close")}</span>
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── Category tabs (underline style) ── */}
                    <div className={`px-4 sm:px-6 border-b ${c.border} shrink-0`}>
                      <nav className="-mb-px flex gap-6">
                        {categories.map((cat) => (
                          <button
                            key={cat.key}
                            onClick={() => setActiveCategory(cat.key as any)}
                            className={`flex items-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                              activeCategory === cat.key ? c.tabActive : c.tabInactive
                            }`}
                          >
                            {cat.label}
                            {cat.count > 0 && (
                              <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                                activeCategory === cat.key
                                  ? "bg-primary-500/15 text-primary-500"
                                  : isDark ? "bg-neutral-700 text-gray-400" : "bg-gray-100 text-gray-500"
                              }`}>
                                {cat.count}
                              </span>
                            )}
                          </button>
                        ))}
                      </nav>
                    </div>

                    {/* ── Filters bar (only for Application tab) ── */}
                    <AnimatePresence initial={false}>
                      {activeCategory === "application" && (
                        <motion.div
                          key="filters"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="shrink-0"
                          style={{ overflow: "visible" }}
                        >
                          <div className={`px-4 sm:px-6 py-2.5 border-b ${c.border} flex items-center gap-2 flex-wrap relative z-30`}>
                            <Filter className={`h-3.5 w-3.5 shrink-0 ${c.textMuted}`} />

                            {/* Type dropdown */}
                            <Menu as="div" className="relative">
                              <MenuButton
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                                  selectedType !== "all"
                                    ? c.chipActive
                                    : isDark
                                      ? "border-neutral-600 text-gray-400 hover:border-neutral-500 hover:text-gray-300"
                                      : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                }`}
                              >
                                {typeLabel}
                                <ChevronDown className="h-3 w-3" />
                              </MenuButton>

                              <Transition
                                as={Fragment}
                                enter="transition ease-out duration-150"
                                enterFrom="transform opacity-0 scale-95 -translate-y-1"
                                enterTo="transform opacity-100 scale-100 translate-y-0"
                                leave="transition ease-in duration-100"
                                leaveFrom="transform opacity-100 scale-100 translate-y-0"
                                leaveTo="transform opacity-0 scale-95 -translate-y-1"
                              >
                                <MenuItems
                                  className={`absolute left-0 z-50 mt-1 w-44 rounded-xl border shadow-lg py-1 focus:outline-none ${c.dropdownBg}`}
                                >
                                  {TYPE_OPTIONS.map(({ key, icon: Icon }) => (
                                    <MenuItem key={key}>
                                      {({ focus }) => (
                                        <button
                                          onClick={() => setSelectedType(key)}
                                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                                            selectedType === key
                                              ? c.dropdownActive
                                              : focus
                                                ? (isDark ? "bg-neutral-700 text-white" : "bg-gray-50 text-gray-900")
                                                : c.dropdownItem
                                          }`}
                                        >
                                          <Icon className="h-3.5 w-3.5 shrink-0" />
                                          <span>{t(`notifications.types.${key}`)}</span>
                                          <span className={`ml-auto text-xs ${c.textMuted}`}>
                                            {countByType(key, applicationNotifications)}
                                          </span>
                                        </button>
                                      )}
                                    </MenuItem>
                                  ))}
                                </MenuItems>
                              </Transition>
                            </Menu>

                            {/* Priority dropdown */}
                            <Menu as="div" className="relative">
                              <MenuButton
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                                  selectedPriority !== "all"
                                    ? c.chipActive
                                    : isDark
                                      ? "border-neutral-600 text-gray-400 hover:border-neutral-500 hover:text-gray-300"
                                      : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                }`}
                              >
                                {priorityLabel}
                                <ChevronDown className="h-3 w-3" />
                              </MenuButton>

                              <Transition
                                as={Fragment}
                                enter="transition ease-out duration-150"
                                enterFrom="transform opacity-0 scale-95 -translate-y-1"
                                enterTo="transform opacity-100 scale-100 translate-y-0"
                                leave="transition ease-in duration-100"
                                leaveFrom="transform opacity-100 scale-100 translate-y-0"
                                leaveTo="transform opacity-0 scale-95 -translate-y-1"
                              >
                                <MenuItems
                                  className={`absolute left-0 z-50 mt-1 w-36 rounded-xl border shadow-lg py-1 focus:outline-none ${c.dropdownBg}`}
                                >
                                  {PRIORITY_OPTIONS.map((p) => (
                                    <MenuItem key={p}>
                                      {({ focus }) => (
                                        <button
                                          onClick={() => setSelectedPriority(p)}
                                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                                            selectedPriority === p
                                              ? c.dropdownActive
                                              : focus
                                                ? (isDark ? "bg-neutral-700 text-white" : "bg-gray-50 text-gray-900")
                                                : c.dropdownItem
                                          }`}
                                        >
                                          {p === "critical" && <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />}
                                          {p === "high"     && <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />}
                                          {p === "normal"   && <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />}
                                          {p === "low"      && <span className="h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />}
                                          {t(`notifications.priorities.${p}`)}
                                        </button>
                                      )}
                                    </MenuItem>
                                  ))}
                                </MenuItems>
                              </Transition>
                            </Menu>

                            {/* Clear filters */}
                            {hasFilters && (
                              <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => { setSelectedType("all"); setSelectedPriority("all"); }}
                                className={`text-xs ${c.textMuted} hover:text-red-400 transition-colors`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ── List ── */}
                    <div className="flex-1 min-h-0">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeCategory}
                          initial={{ opacity: 0, x: activeCategory === "system" ? -8 : 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="h-full"
                        >
                          {filteredList.length > 0 ? (
                            <VirtualList
                              items={filteredList.slice(0, 100)}
                              estimatedItemSize={80}
                              overscan={5}
                              style={{ height: "100%" }}
                              renderItem={renderItem}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                              <div className={`rounded-full p-4 mb-3 ${c.emptyBg}`}>
                                <Bell className={`h-7 w-7 ${c.emptyText}`} />
                              </div>
                              <p className={`text-sm ${c.textMuted}`}>
                                {t("notifications.no_notifications_filtered")}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

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
