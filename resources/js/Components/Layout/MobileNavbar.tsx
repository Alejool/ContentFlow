import Logo from "@/../assets/logo-with-name.png";
import LanguageSwitcher from "@/Components/common/ui/LanguageSwitcher";
import ResponsiveNavLink from "@/Components/common/ui/ResponsiveNavLink";
import ThemeSwitcher from "@/Components/common/ui/ThemeSwitcher";
import { useTheme } from "@/Hooks/useTheme";
import { usePage } from "@inertiajs/react";
import { BarChart3, FileText, Home, LogOut, User, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";
import NotificationButton from "./NotificationButton";
import ProfileDropdown, { CustomAvatar } from "./ProfileDropdown";
import SearchButton from "./SearchButton";

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
  { nameKey: "nav.workspaces", href: "workspaces.index", lucideIcon: Layers },
];

export default function MobileNavbar({
  user,
  showingNavigationDropdown,
  setShowingNavigationDropdown,
}: MobileNavbarProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const isActiveRoute = (routeName: string) => {
    if (typeof window === "undefined") return false;
    const currentPath = window.location.pathname;

    const routePatterns: Record<string, string[]> = {
      dashboard: ["/dashboard"],
      "profile.edit": ["/profile", "/profile/edit"],
      "manage-content.index": ["/ManageContent"],
      "analytics.index": ["/analytics"],
      "workspaces.index": ["/workspaces"],
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
      <div className=" w-full mx-auto max-w-7xl  ">
        <div className="flex h-16 justify-between items-center px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setShowingNavigationDropdown(!showingNavigationDropdown)
              }
              className={`inline-flex items-center justify-center p-2 rounded-lg
                    ${theme === "dark"
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
            <div className="flex items-center justify-center flex-1 px-2 min-w-0">
              <img src={Logo} alt="Logo"
                className="h-10 w-auto object-contain max-w-[140px] sm:max-w-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SearchButton variant="compact" />
            <div className="h-6 w-px bg-gray-200 dark:bg-neutral-800"></div>
            <NotificationButton />
            <ProfileDropdown user={user} isProfileActive={isProfileActive} />
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
                  ${isActive
                    ? `bg-gradient-to-r ${theme === "dark"
                      ? "from-primary-600 to-primary-800"
                      : "from-primary-600 to-primary-700"
                    } text-white shadow-lg`
                    : `${theme === "dark"
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
                      className={`w-2 h-2 rounded-full ${theme === "dark" ? "bg-primary-300" : "bg-primary-500"
                        }`}
                    ></div>
                  </span>
                )}
              </ResponsiveNavLink>
            );
          })}

          <div
            className={`pt-4 border-t ${theme === "dark" ? "border-neutral-700/50" : "border-beige-300/50"
              }`}
          >
            <div className="flex items-center ">
              <ResponsiveNavLink
                href={route("logout")}
                method="post"
                as="button"
                className={`flex-1 flex items-center justify-center space-x-3 px-4 py-3 rounded-lg border transition-all duration-300
                    ${theme === "dark"
                    ? "bg-neutral-800 border-neutral-700 text-gray-200 hover:bg-primary-900/30 hover:text-primary-300"
                    : "bg-beige-300 border-beige-400 text-gray-700 hover:bg-primary-50 hover:text-primary-600"
                  }`}
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">{t("nav.logout")}</span>
              </ResponsiveNavLink>

              <div className="flex items-center justify-center ">
                <ThemeSwitcher />
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
