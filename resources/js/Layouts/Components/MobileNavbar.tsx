import Dropdown from "@/Components/Dropdown";
import ResponsiveNavLink from "@/Components/ResponsiveNavLink";
import { Home, User, FileText, BarChart3, Bot, LogOut } from "lucide-react";
import LanguageSwitcher from "@/Components/LanguageSwitcher";
import ThemeSwitcher from "@/Components/ThemeSwitcher";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/Hooks/useTheme"; // Importar useTheme

interface MobileNavbarProps {
  user: {
    name?: string;
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

  return (
    <>
      <nav
        className={` w-full  lg:hidden shadow-lg sticky top-0 z-50 backdrop-blur-2xl
        ${theme === "dark" ? "bg-neutral-900/95" : "bg-beige-200/95"}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 justify-between items-center">
            {/* Menu Button */}
            <button
              onClick={() =>
                setShowingNavigationDropdown(!showingNavigationDropdown)
              }
              className={`inline-flex items-center justify-center p-3 rounded-2xl
                ${
                  theme === "dark"
                    ? "text-gray-400 hover:text-orange-400"
                    : "text-gray-700 hover:text-orange-600"
                }`}
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
                  className={
                    showingNavigationDropdown ? "inline-flex" : "hidden"
                  }
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 bg-gradient-to-r rounded-full flex items-center justify-center
                ${
                  theme === "dark"
                    ? "from-orange-500 to-orange-700"
                    : "from-orange-600 to-orange-800"
                }`}
              >
                <span className="text-white font-bold text-lg">CF</span>
              </div>
              <div>
                <h1
                  className={`text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent
                  ${
                    theme === "dark"
                      ? "from-gray-200 to-gray-400"
                      : "from-gray-800 to-gray-600"
                  }`}
                >
                  ContentFlow
                </h1>
              </div>
            </div>

            {/* User Dropdown */}
            <div className="flex items-center">
              <Dropdown>
                <Dropdown.Trigger>
                  <span className="inline-flex">
                    <button
                      type="button"
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md
                        ${
                          theme === "dark"
                            ? "text-gray-200 hover:bg-neutral-800"
                            : "text-gray-700 hover:bg-beige-300"
                        }`}
                    >
                      <div
                        className={`w-8 h-8 mr-3 bg-gradient-to-r rounded-full flex items-center justify-center
                        ${
                          theme === "dark"
                            ? "from-orange-500 to-orange-700"
                            : "from-orange-600 to-orange-800"
                        }`}
                      >
                        <span className="text-white text-sm font-bold">
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <span className="hidden sm:block">
                        {user.name || "User"}
                      </span>
                      <svg
                        className={`ml-2 h-4 w-4 ${
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
                    </button>
                  </span>
                </Dropdown.Trigger>

                <Dropdown.Content
                  className={`shadow-xl
                  ${
                    theme === "dark"
                      ? "bg-neutral-800 text-gray-200"
                      : "bg-white text-gray-700"
                  }`}
                >
                  <Dropdown.Link
                    href={route("profile.edit")}
                    className={`flex items-center space-x-2
                      ${
                        theme === "dark"
                          ? "hover:bg-neutral-700"
                          : "hover:bg-gray-100"
                      }`}
                  >
                    <User className="h-4 w-4" />
                    <span>{t("nav.profile")}</span>
                  </Dropdown.Link>
                  <Dropdown.Link
                    href={route("logout")}
                    method="post"
                    as="button"
                    className={`flex items-center space-x-2
                      ${
                        theme === "dark"
                          ? "hover:bg-neutral-700"
                          : "hover:bg-gray-100"
                      }`}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t("nav.logout")}</span>
                  </Dropdown.Link>
                </Dropdown.Content>
              </Dropdown>
            </div>
          </div>
        </div>

        {/* Dropdown menu */}
        <div
          className={`${showingNavigationDropdown ? "block" : "hidden"}
          ${theme === "dark" ? "bg-neutral-900/95" : "bg-beige-200/95"}`}
        >
          <div className="px-4 py-6 space-y-2">
            {mobileNavigationItems.map((item) => (
              <ResponsiveNavLink
                key={item.href}
                href={route(item.href)}
                active={route().current(item.href)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300
                  ${
                    route().current(item.href)
                      ? `bg-gradient-to-r ${
                          theme === "dark"
                            ? "from-orange-600 to-orange-800"
                            : "from-orange-600 to-orange-700"
                        } text-white shadow-lg`
                      : `${
                          theme === "dark"
                            ? "text-gray-200 hover:bg-neutral-800 hover:text-orange-400"
                            : "text-gray-700 hover:bg-beige-300 hover:text-orange-600"
                        }`
                  }`}
              >
                <item.lucideIcon className="h-5 w-5" />
                <span className="font-medium">{t(item.nameKey)}</span>
              </ResponsiveNavLink>
            ))}

            <div
              className={`pt-4 border-t ${
                theme === "dark"
                  ? "border-neutral-700/50"
                  : "border-beige-300/50"
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
                        ? "bg-neutral-800 border-neutral-700 text-gray-200 hover:bg-red-900/30 hover:text-red-300"
                        : "bg-beige-300 border-beige-400 text-gray-700 hover:bg-red-50 hover:text-red-600"
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
      </nav>
    </>
  );
}
