import Logo from "@/../assets/logo-with-name.png";
import LanguageSwitcher from "@/Components/common/ui/LanguageSwitcher";
import ResponsiveNavLink from "@/Components/common/ui/ResponsiveNavLink";
import ThemeSwitcher from "@/Components/common/ui/ThemeSwitcher";
import { useTheme } from "@/Hooks/useTheme";
import {
  BarChart3,
  X as CloseIcon,
  FileText,
  Home,
  Layers,
  LogOut,
  Menu,
  User,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import NotificationButton from "./NotificationButton";
import ProfileDropdown from "./ProfileDropdown";
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

  const isProfileActive = !!route().current("profile.edit");

  return (
    <nav
      className={`w-full lg:hidden sticky top-0 z-50 transition-all duration-300 shadow-lg backdrop-blur-2xl
        ${
          theme === "dark"
            ? "bg-neutral-900/90 border-b border-neutral-800"
            : "bg-white/90 border-b border-gray-200"
        }`}
    >
      <div className="w-full mx-auto max-w-7xl">
        <div className="flex h-16 justify-between items-center px-4">
          <div className="flex items-center">
            <button
              onClick={() =>
                setShowingNavigationDropdown(!showingNavigationDropdown)
              }
              className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors duration-200
                ${
                  theme === "dark"
                    ? "text-gray-400 hover:text-white hover:bg-neutral-800"
                    : "text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                }`}
              aria-label={
                showingNavigationDropdown ? "Close menu" : "Open menu"
              }
            >
              {showingNavigationDropdown ? (
                <CloseIcon className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          <div className="flex-1 flex justify-center">
            <img src={Logo} alt="Logo" className="h-10 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-2">
            <SearchButton variant="compact" />
            <NotificationButton />
            <ProfileDropdown user={user} isProfileActive={isProfileActive} />
          </div>
        </div>
      </div>

      <div
        className={`${showingNavigationDropdown ? "block" : "hidden"} border-t ${
          theme === "dark"
            ? "border-neutral-800 bg-neutral-900"
            : "border-gray-100 bg-white"
        }`}
      >
        <div className="px-4 py-6 space-y-1">
          {mobileNavigationItems.map((item) => {
            const isActive = !!route().current(item.href);
            return (
              <ResponsiveNavLink
                key={item.href}
                href={route(item.href)}
                active={isActive}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300
                  ${
                    isActive
                      ? `bg-primary-600 text-white shadow-sm`
                      : `${
                          theme === "dark"
                            ? "text-gray-300 hover:bg-neutral-800 hover:text-primary-400"
                            : "text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                        }`
                  }`}
              >
                <item.lucideIcon
                  className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-400"}`}
                />
                <span className="font-bold">{t(item.nameKey)}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
                )}
              </ResponsiveNavLink>
            );
          })}

          <div
            className={`pt-4 mt-4 border-t ${theme === "dark" ? "border-neutral-800" : "border-gray-100"}`}
          >
            <div className="flex items-center justify-between gap-4">
              <ResponsiveNavLink
                href={route("logout")}
                method="post"
                as="button"
                className={`flex-1 flex items-center justify-center space-x-3 px-4 py-3 rounded-lg border transition-all duration-300 font-bold
                    ${
                      theme === "dark"
                        ? "bg-neutral-800 border-neutral-700 text-red-400 hover:bg-red-900/20"
                        : "bg-gray-50 border-gray-200 text-red-600 hover:bg-red-50"
                    }`}
              >
                <LogOut className="h-5 w-5" />
                <span>{t("nav.logout")}</span>
              </ResponsiveNavLink>

              <div className="flex items-center bg-gray-100 dark:bg-neutral-800 rounded-lg p-1">
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
