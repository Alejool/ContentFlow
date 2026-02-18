import NotificationsModal from "@/Components/Notifications/NotificationsModal";
import { useNotifications } from "@/Hooks/useNotifications";
import { useTheme } from "@/Hooks/useTheme";
import { Bell } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function NotificationButton() {
    const { actualTheme } = useTheme();
    const { t } = useTranslation();
    const [showNotifications, setShowNotifications] = useState(false);
    const { unreadCount } = useNotifications();

    return (
        <>
            <button
                onClick={() => setShowNotifications(true)}
                className={`group relative p-2.5 rounded-lg transition-all duration-300
                    ${actualTheme === "dark"
                        ? "text-gray-400 hover:text-primary-400 hover:bg-neutral-800"
                        : "text-gray-600 hover:text-primary-600 hover:bg-beige-300"
                    }
                `}
                aria-label={t("nav.notifications", "Notifications")}
            >
                <div className="relative">
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-neutral-900">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </div>
            </button>
            <NotificationsModal
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
            />
        </>
    );
}
