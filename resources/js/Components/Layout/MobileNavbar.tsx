import Logo from "@/../assets/logo-with-name.png";
import NotificationsModal from "@/Components/Notifications/NotificationsModal";
import Dropdown from "@/Components/common/ui/Dropdown";
import LanguageSwitcher from "@/Components/common/ui/LanguageSwitcher";
import ResponsiveNavLink from "@/Components/common/ui/ResponsiveNavLink";
import ThemeSwitcher from "@/Components/common/ui/ThemeSwitcher";
import { useNotifications } from "@/Hooks/useNotifications";
import { useTheme } from "@/Hooks/useTheme";
import { usePage } from "@inertiajs/react";
import {
  BarChart3,
  Bell,
  Bot,
  FileText,
  Home,
  LogOut,
  User,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface CustomAvatarProps {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function CustomAvatar({
  src,
  name = "User",
  size = "md",
  className = "",
}: CustomAvatarProps) {
  const { theme } = useTheme();

  const getInitials = (name: string) => {
    if (!name.trim()) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const avatarBgClass =
    theme === "dark"
      ? "bg-gradient-to-br from-primary-900/30 to-purple-900/30"
      : "bg-gradient-to-br from-primary-100 to-purple-100";

  const avatarTextClass =
    theme === "dark" ? "text-primary-200" : "text-primary-800";

  return (
    <div
      className={`${sizeClasses[size]} ${className} relative rounded-full overflow-hidden flex items-center justify-center font-bold shadow-lg ${avatarBgClass}`}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const img = e.currentTarget;
            img.style.display = "none";

            const fallback = document.createElement("div");
            fallback.className = `w-full h-full flex items-center justify-center ${avatarTextClass} font-bold`;
            fallback.textContent = getInitials(name);

            const parent = img.parentElement;
            if (parent) {
              const existingFallback = parent.querySelector(".avatar-fallback");
              if (existingFallback) {
                parent.removeChild(existingFallback);
              }

              fallback.className += " avatar-fallback";
              parent.appendChild(fallback);
            }
          }}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center ${avatarTextClass} avatar-fallback`}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}

interface MobileNavbarProps {
  user: {
    name?: string;
    photo_url?: string;
    email?: string;
    [key: string]: any;
  };
  showingNavigationDropdown: boolean;
  setShowingNavigationDropdown: (show: boolean) => void;
}

const mobileNavigationItems = [
  { nameKey: "nav.dashboard", href: "dashboard", lucideIcon: Home },
  { nameKey: "nav.profile", href: "profile.edit", lucideIcon: User },
  {
    nameKey: "nav.manageContent",
    href: "manage-content.index",
    lucideIcon: FileText,
  },
  { nameKey: "nav.analytics", href: "analytics.index", lucideIcon: BarChart3 },
  { nameKey: "nav.aiChat", href: "ai-chat.index", lucideIcon: Bot },
];

export default function MobileNavbar({
  user,
  showingNavigationDropdown,
  setShowingNavigationDropdown,
}: MobileNavbarProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { url } = usePage();
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications();

  const colorNoActive = `${
    theme === "dark"
      ? "text-white hover:text-orange-600 hover:bg-neutral-600/40"
      : "text-gray-700 hover:text-orange-600 hover:bg-gray-200/40"
  }`;

  const colorActive = `${
    theme === "dark"
      ? "bg-primary-900/30 text-primary-300"
      : "bg-primary-100 text-primary-700"
  }`;

  const isActiveRoute = (routeName: string) => {
    if (typeof window === "undefined") return false;
    const currentPath = window.location.pathname;

    const routePatterns: Record<string, string[]> = {
      dashboard: ["/dashboard"],
      "profile.edit": ["/profile", "/profile/edit"],
      "manage-content.index": ["/manage-content"],
      "analytics.index": ["/analytics"],
      "ai-chat.index": ["/ai-chat"],
    };

    const patterns = routePatterns[routeName] || [
      `/${routeName.replace(".", "/")}`,
    ];

    return patterns.some(
      (pattern) =>
        currentPath === pattern || currentPath.startsWith(pattern + "/")
    );
  };

  const isProfileActive = isActiveRoute("profile.edit");

  return (
    <nav
      className={`w-full lg:hidden shadow-lg sticky top-0 z-50 backdrop-blur-2xl
        ${theme === "dark" ? "bg-neutral-900/60" : "bg-beige-200/90"}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 justify-between items-center">
          <button
            onClick={() =>
              setShowingNavigationDropdown(!showingNavigationDropdown)
            }
            className={`inline-flex items-center justify-center p-3 rounded-lg
                ${
                  theme === "dark"
                    ? "text-gray-400 hover:text-primary-400"
                    : "text-gray-700 hover:text-primary-600"
                }`}
            aria-label={showingNavigationDropdown ? "Close menu" : "Open menu"}
          >
            <svg
              className="h-6 w-6"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                className={
                  !showingNavigationDropdown ? "inline-flex" : "hidden"
                }
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                className={showingNavigationDropdown ? "inline-flex" : "hidden"}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex items-center space-x-3">
            <img src={Logo} alt="Logo" className="w-56 h-24" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifications(true)}
              className={`group relative p-2 rounded-lg transition-colors
                  ${
                    theme === "dark"
                      ? "text-gray-400 hover:text-primary-400 hover:bg-neutral-800"
                      : "text-gray-600 hover:text-primary-600 hover:bg-beige-300"
                  }
                `}
            >
              <div className="relative">
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
            </button>
            <Dropdown>
              <Dropdown.Trigger>
                <span className="inline-flex">
                  <button
                    type="button"
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md
                        ${
                          theme === "dark"
                            ? "text-gray-200 hover:bg-neutral-800"
                            : "text-gray-700 hover:bg-beige-300"
                        }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`rounded-full ring-2 shadow-lg ${
                          theme === "dark"
                            ? "ring-purple-900/50"
                            : "ring-green-200"
                        } ${
                          isProfileActive
                            ? theme === "dark"
                              ? "ring-primary-500"
                              : "ring-primary-600"
                            : ""
                        }`}
                      >
                        <CustomAvatar
                          src={user.photo_url}
                          name={user.name}
                          size="md"
                        />
                      </div>
                      <div className="hidden sm:block flex-col items-start">
                        <span className="font-medium truncate max-w-[120px]">
                          {user.name || "User"}
                        </span>
                      </div>
                      <svg
                        className={`ml-1 h-4 w-4 ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </button>
                </span>
              </Dropdown.Trigger>

              <Dropdown.Content
                contentClasses={`shadow-xl min-w-[200px]
                  ${
                    theme === "dark"
                      ? "bg-neutral-800 text-white"
                      : "bg-white text-gray-700"
                  }`}
              >
                <div
                  className={`p-3 border-b border-neutral-700/50 dark:border-gray-200/10 $`}
                >
                  <div className="flex items-center gap-3">
                    <CustomAvatar
                      src={user.photo_url}
                      name={user.name}
                      size="md"
                    />
                    <div>
                      <p className="font-medium">{user.name || "User"}</p>
                      <p
                        className={`text-xs ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <Dropdown.Link
                  href={route("profile.edit")}
                  className={`flex items-center space-x-2 px-3 py-2.5 transition-colors  ${colorNoActive}
                    ${isProfileActive ? colorActive : ""}`}
                >
                  <User
                    className={`h-4 w-4 ${
                      isProfileActive
                        ? theme === "dark"
                          ? "text-primary-400"
                          : "text-primary-600"
                        : ""
                    }`}
                  />
                  <span
                    className={`${isProfileActive ? "font-semibold " : ``}`}
                  >
                    {t("nav.profile")}
                  </span>
                  {isProfileActive && (
                    <span className="ml-auto">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          theme === "dark" ? "bg-primary-400" : "bg-primary-600"
                        }`}
                      ></div>
                    </span>
                  )}
                </Dropdown.Link>

                <Dropdown.Link
                  href={route("logout")}
                  method="post"
                  as="button"
                  className={`flex items-center space-x-2 px-3 py-2.5 transition-colors ${colorNoActive}`}
                >
                  <LogOut className="h-4 w-4" />
                  <span className={``}>{t("nav.logout")}</span>
                </Dropdown.Link>
              </Dropdown.Content>
            </Dropdown>
          </div>
        </div>
      </div>

      <div
        className={`${showingNavigationDropdown ? "block" : "hidden"}
         `}
      >
        <div className="px-4 py-6 space-y-2">
          {mobileNavigationItems.map((item) => {
            const isActive = isActiveRoute(item.href);
            return (
              <ResponsiveNavLink
                key={item.href}
                href={route(item.href)}
                active={isActive}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300
                  ${
                    isActive
                      ? `bg-gradient-to-r ${
                          theme === "dark"
                            ? "from-primary-600 to-primary-800"
                            : "from-primary-600 to-primary-700"
                        } text-white shadow-lg`
                      : `${
                          theme === "dark"
                            ? "text-gray-200 hover:bg-neutral-800 hover:text-primary-400"
                            : "text-gray-700 hover:bg-beige-300 hover:text-primary-600"
                        }`
                  }`}
              >
                <item.lucideIcon className="h-5 w-5" />
                <span className="font-medium">{t(item.nameKey)}</span>
                {isActive && (
                  <span className="ml-auto">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        theme === "dark" ? "bg-primary-300" : "bg-primary-500"
                      }`}
                    ></div>
                  </span>
                )}
              </ResponsiveNavLink>
            );
          })}

          <div
            className={`pt-4 border-t ${
              theme === "dark" ? "border-neutral-700/50" : "border-beige-300/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <ResponsiveNavLink
                href={route("logout")}
                method="post"
                as="button"
                className={`flex-1 flex items-center justify-center space-x-3 px-4 py-3 rounded-lg border transition-all duration-300
                    ${
                      theme === "dark"
                        ? "bg-neutral-800 border-neutral-700 text-gray-200 hover:bg-primary-900/30 hover:text-primary-300"
                        : "bg-beige-300 border-beige-400 text-gray-700 hover:bg-primary-50 hover:text-primary-600"
                    }`}
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">{t("nav.logout")}</span>
              </ResponsiveNavLink>

              <div className="flex items-center justify-center gap-2">
                <ThemeSwitcher />
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </div>
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </nav>
  );
}
