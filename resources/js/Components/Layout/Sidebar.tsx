import Logo from "@/../assets/logo.png";
import NotificationsModal from "@/Components/Notifications/NotificationsModal";
import LanguageSwitcher from "@/Components/common/ui/LanguageSwitcher";
import NavLink from "@/Components/common/ui/NavLink";
import ThemeSwitcher from "@/Components/common/ui/ThemeSwitcher";
import { useNotifications } from "@/Hooks/useNotifications";
import { useTheme } from "@/Hooks/useTheme";
import { Link } from "@inertiajs/react";
import {
  BarChart3,
  Bell,
  Bot,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  LogOut,
  Share2,
  User,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const navigationItems = [
  {
    nameKey: "nav.dashboard",
    href: "dashboard",
    icon: Home,
  },
  {
    nameKey: "nav.profile",
    href: "profile.edit",
    icon: User,
  },
  {
    nameKey: "nav.manageContent",
    href: "/ManageContent.index",
    icon: FileText,
  },
  {
    nameKey: "nav.analytics",
    href: "analytics.index",
    icon: BarChart3,
  },
  {
    nameKey: "nav.aiChat",
    href: "ai-chat.index",
    icon: Bot,
  },
  {
    nameKey: "nav.socialNetworks",
    href: "settings.social",
    icon: Share2,
  },
];

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
}: SidebarProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications();

  const isRouteActive = (routeName: string): boolean => {
    if (typeof window === "undefined") return false;

    const currentPath = window.location.pathname;

    const routePatterns: Record<string, string[]> = {
      dashboard: ["/dashboard"],
      "profile.edit": ["/profile", "/profile/edit"],
      "/ManageContent.index": ["/ManageContent"],
      "analytics.index": ["/analytics"],
      "ai-chat.index": ["/ai-chat"],
      "settings.social": ["/settings", "/settings/social"],
    };

    const patterns = routePatterns[routeName] || [
      `/${routeName.replace(".", "/")}`,
    ];

    return patterns.some(
      (pattern) =>
        currentPath === pattern || currentPath.startsWith(pattern + "/")
    );
  };

  const getRouteUrl = (routeName: string): string => {
    const routeUrls: Record<string, string> = {
      dashboard: "/dashboard",
      "profile.edit": "/profile",
      "/ManageContent.index": "/ManageContent",
      "analytics.index": "/analytics",
      "ai-chat.index": "/ai-chat",
      "settings.social": "/settings/social",
      logout: "/logout",
    };

    return routeUrls[routeName] || `/${routeName.replace(".", "/")}`;
  };

  const isDark = theme === "dark";

  const classes = {
    sidebarBg: isDark ? "bg-neutral-900" : "bg-white/50",
    borderColor: isDark ? "border-neutral-700/50" : "border-beige-300/50",
    textColor: isDark ? "text-gray-300" : "text-gray-700",
    hoverBg: isDark ? "hover:bg-neutral-800" : "hover:bg-beige-300",
    hoverText: isDark ? "hover:text-primary-400" : "hover:text-primary-600",
    activeGradient: isDark
      ? "bg-gradient-to-r from-primary-600 to-primary-800"
      : "bg-gradient-to-r from-primary-600 to-primary-700",
    buttonHoverBg: isDark ? "hover:bg-neutral-800" : "hover:bg-beige-300",
    logoGradient: isDark
      ? "from-primary-500 to-primary-700"
      : "from-primary-600 to-primary-800",
    titleGradient: isDark
      ? "from-gray-200 to-gray-400"
      : "from-gray-800 to-gray-600",
    subtitleColor: isDark ? "text-gray-400" : "text-gray-500",
    logoutHoverBg: isDark
      ? "hover:bg-primary-900/30 hover:text-primary-300"
      : "hover:bg-primary-50 hover:text-primary-600",
    tooltipBg: isDark
      ? "bg-neutral-800 text-gray-100"
      : "bg-gray-900 text-white",
  };

  return (
    <>
      <div
        className={`hidden lg:block fixed inset-y-0 z-50 transition-all duration-500 ease-in-out ${
          isSidebarOpen ? "w-80" : "w-32"
        }`}
      >
        <div
          className={`absolute inset-0 backdrop-blur-3xl border-r ${classes.borderColor} shadow-2xl opacity-90 ${classes.sidebarBg}`}
        />

        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div
            className={`flex items-center justify-between p-6 border-b ${classes.borderColor}`}
          >
            <Link
              href="/"
              className={`flex items-center transition-all duration-300 ${
                !isSidebarOpen && "justify-center"
              }`}
            >
              <div
                className={`w-12 h-12 bg-gradient-to-r rounded-lg flex items-center justify-center flex-shrink-0`}
              >
                <img
                  src={Logo}
                  alt="logo"
                  className="w-16 h-16 object-contain"
                />
              </div>
              {isSidebarOpen && (
                <div className="ml-4 opacity-100 transition-opacity duration-300">
                  <h1
                    className={`text-xl font-bold bg-gradient-to-r ${classes.titleGradient} bg-clip-text text-transparent`}
                  >
                    ContentFlow
                  </h1>
                  <p className={`text-xs ${classes.subtitleColor}`}>
                    Social Media Manager
                  </p>
                </div>
              )}
            </Link>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-lg transition-colors duration-200 ${classes.buttonHoverBg} ${classes.textColor}`}
            >
              {isSidebarOpen ? (
                <ChevronLeft
                  className={`h-5 w-5 transition-colors ${
                    isDark
                      ? "text-gray-400 hover:text-primary-400"
                      : "text-gray-600 hover:text-primary-600"
                  }`}
                />
              ) : (
                <ChevronRight
                  className={`h-5 w-5 transition-colors ${
                    isDark
                      ? "text-gray-400 hover:text-primary-400"
                      : "text-gray-600 hover:text-primary-600"
                  }`}
                />
              )}
            </button>
          </div>

          {/* Navegación principal */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const isActive = isRouteActive(item.href);
              return (
                <NavLink
                  key={item.href}
                  href={getRouteUrl(item.href)}
                  active={isActive}
                  className={`group w-full flex items-center
                        px-4 py-3 text-sm
                        ${isSidebarOpen ? "" : "justify-center"}
                        font-medium rounded-lg transition-all duration-300
                        ${classes.hoverBg}
                        ${classes.textColor}
                        hover:shadow-lg
                        ${
                          isActive
                            ? `${classes.activeGradient} text-white shadow-lg hover:text-white`
                            : `${classes.textColor} ${classes.hoverText}`
                        }`}
                >
                  <div className="flex items-center justify-center rounded-full h-10">
                    <item.icon className="h-5 w-5" />
                  </div>

                  {isSidebarOpen && (
                    <span className="ml-4 transition-all duration-300">
                      {t(item.nameKey)}
                    </span>
                  )}

                  {!isSidebarOpen && (
                    <div
                      className={`absolute left-full ml-2 px-3 py-2
                        ${classes.tooltipBg} text-sm rounded-lg
                        opacity-0 group-hover:opacity-100 transition-opacity
                        duration-200 pointer-events-none whitespace-nowrap
                        z-50`}
                    >
                      {t(item.nameKey)}
                      <div
                        className={`absolute left-0 top-1/2 transform
                        -translate-y-1/2 -translate-x-1 w-2 h-2
                        ${isDark ? "bg-neutral-800" : "bg-gray-900"} rotate-45`}
                      />
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="mt-auto">
            {/* Sección de controles (Notificaciones, Theme, Language) */}
            <div
              className={`p-4 border-t ${classes.borderColor} ${
                isSidebarOpen
                  ? "flex items-center justify-between"
                  : "flex flex-col items-center gap-3"
              }`}
            >
              <div
                className={`flex items-center gap-3 ${
                  isSidebarOpen ? "" : "flex-col"
                }`}
              >
                {/* Controles de tema e idioma */}
                <div
                  className={`flex items-center gap-2 ${
                    isSidebarOpen ? "" : "flex-col"
                  }`}
                >
                  <ThemeSwitcher />
                  <LanguageSwitcher />
                </div>
                {/* Botón de notificaciones */}
                <button
                  onClick={() => setShowNotifications(true)}
                  className={`group relative p-2.5 rounded-lg transition-all duration-300
                    ${classes.hoverBg} ${classes.textColor}
                    hover:text-primary-600 hover:shadow-md
                    flex items-center justify-center`}
                  aria-label={t("nav.notifications")}
                >
                  <div className="relative">
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <>
                        <span
                          className={`absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full
                            bg-red-500 text-[10px] font-bold text-white shadow-md
                            border-2 ${
                              isDark ? "border-neutral-900" : "border-beige-200"
                            }
                            `}
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5  rounded-full bg-red-400 opacity-0" />
                      </>
                    )}
                  </div>

                  {/* Tooltip para sidebar colapsado */}
                  {!isSidebarOpen && (
                    <div
                      className={`absolute left-full ml-3 px-3 py-2
                        ${classes.tooltipBg} text-sm rounded-lg
                        opacity-0 group-hover:opacity-100 transition-opacity
                        duration-200 pointer-events-none whitespace-nowrap
                        z-50 flex items-center gap-2`}
                    >
                      {t("nav.notifications")}
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                      <div
                        className={`absolute left-0 top-1/2 transform
                          -translate-y-1/2 -translate-x-1 w-2 h-2
                          ${
                            isDark ? "bg-neutral-800" : "bg-gray-900"
                          } rotate-45`}
                      />
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div
              className={`p-4 border-t ${classes.borderColor} ${classes.textColor} ${classes.logoutHoverBg}`}
            >
              <NavLink
                href={getRouteUrl("logout")}
                method="post"
                as="button"
                className={`group w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
                  ${isSidebarOpen ? "" : "justify-center"}`}
              >
                <div className="flex items-center justify-center">
                  <LogOut className="h-5 w-5" />
                </div>

                {isSidebarOpen && (
                  <span className="font-medium">{t("nav.logout")}</span>
                )}

                {!isSidebarOpen && (
                  <div
                    className={`absolute left-full ml-2 px-3 py-2
                      ${classes.tooltipBg} text-sm rounded-lg
                      opacity-0 group-hover:opacity-100 transition-opacity
                      duration-200 pointer-events-none whitespace-nowrap
                      z-50`}
                  >
                    {t("nav.logout")}
                    <div
                      className={`absolute left-0 top-1/2 transform
                        -translate-y-1/2 -translate-x-1 w-2 h-2
                        ${isDark ? "bg-neutral-800" : "bg-gray-900"} rotate-45`}
                    />
                  </div>
                )}
              </NavLink>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de notificaciones */}
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}
