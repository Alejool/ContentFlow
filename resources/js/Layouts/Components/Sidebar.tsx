import Logo from "@/../assets/logo.png";
import LanguageSwitcher from "@/Components/LanguageSwitcher";
import NavLink from "@/Components/NavLink";
import ThemeSwitcher from "@/Components/ThemeSwitcher";
import { useTheme } from "@/Hooks/useTheme";
import { Link } from "@inertiajs/react";
import { BarChart3, Bot, FileText, Home, LogOut, User } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const navigationItems = [
  {
    nameKey: "nav.dashboard",
    href: "dashboard",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
    lucideIcon: Home,
  },
  {
    nameKey: "nav.profile",
    href: "profile.edit",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    lucideIcon: User,
  },
  {
    nameKey: "nav.manageContent",
    href: "manage-content.index",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    lucideIcon: FileText,
  },
  {
    nameKey: "nav.analytics",
    href: "analytics.index",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    lucideIcon: BarChart3,
  },
  {
    nameKey: "nav.aiChat",
    href: "ai-chat.index",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
    lucideIcon: Bot,
  },
];

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
}: SidebarProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const sidebarBg = theme === "dark" ? "bg-neutral-900" : "bg-beige-200";

  const borderColor =
    theme === "dark" ? "border-neutral-700/50" : "border-beige-300/50";

  const textColor = theme === "dark" ? "text-gray-300" : "text-gray-700";

  const hoverBg =
    theme === "dark" ? "hover:bg-neutral-800" : "hover:bg-beige-300";

  const hoverText =
    theme === "dark" ? "hover:text-primary-400" : "hover:text-primary-600";

  const activeGradient =
    theme === "dark"
      ? "bg-gradient-to-r from-primary-600 to-primary-800"
      : "bg-gradient-to-r from-primary-600 to-primary-700";

  const buttonHoverBg =
    theme === "dark" ? "hover:bg-neutral-800" : "hover:bg-beige-300";

  const logoGradient =
    theme === "dark"
      ? "from-primary-500 to-primary-700"
      : "from-primary-600 to-primary-800";

  const titleGradient =
    theme === "dark"
      ? "from-gray-200 to-gray-400"
      : "from-gray-800 to-gray-600";

  const subtitleColor = theme === "dark" ? "text-gray-400" : "text-gray-500";

  const logoutHoverBg =
    theme === "dark"
      ? "hover:bg-primary-900/30 hover:text-primary-300"
      : "hover:bg-primary-50 hover:text-primary-600";

  const tooltipBg =
    theme === "dark"
      ? "bg-neutral-800 text-gray-100"
      : "bg-gray-900 text-white";

  return (
    <div
      className={`hidden lg:block fixed inset-y-0 z-50 transition-all duration-500 ease-in-out ${
        isSidebarOpen ? "w-80" : "w-32"
      }`}
    >
      <div
        className={`absolute inset-0 backdrop-blur-3xl border-r ${borderColor} shadow-2xl opacity-90 ${sidebarBg}`}
      />

      <div className="relative h-full flex flex-col">
        <div
          className={`flex items-center justify-between p-6 border-b ${borderColor}`}
        >
          <Link
            href="/"
            className={`flex items-center transition-all duration-300 ${
              !isSidebarOpen && "justify-center"
            }`}
          >
            <div
              className={`w-12 h-12 bg-gradient-to-r 
                rounded-lg flex items-center justify-center flex-shrink-0`}
            >
              <img src={Logo} alt="logo" className="w-16 h-16 object-contain" />
            </div>
            {isSidebarOpen && (
              <div className="ml-4 opacity-100 transition-opacity duration-300">
                <h1
                  className={`text-xl font-bold bg-gradient-to-r ${titleGradient} bg-clip-text text-transparent`}
                >
                  ContentFlow
                </h1>
                <p className={`text-xs ${subtitleColor}`}>
                  Social Media Manager
                </p>
              </div>
            )}
          </Link>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-lg transition-colors duration-200 ${buttonHoverBg} ${textColor}`}
          >
            <div className="relative">
              {isSidebarOpen ? (
                <svg
                  className={`h-5 w-5 transition-colors ${
                    theme === "dark"
                      ? "text-gray-400 hover:text-primary-400"
                      : "text-gray-600 hover:text-primary-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              ) : (
                <svg
                  className={`h-5 w-5 transition-colors ${
                    theme === "dark"
                      ? "text-gray-400 hover:text-primary-400"
                      : "text-gray-600 hover:text-primary-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </div>
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => (
            <NavLink
              key={item.href}
              href={route(item.href)}
              active={route().current(item.href)}
              className={`group w-full flex items-center 
                    d-flex 
                    align-center
                    px-4 py-3 text-sm 
                    ${isSidebarOpen ? "" : "justify-center"}
                    font-medium rounded-lg transition-all duration-300 
                    ${hoverBg}
                    ${textColor}
                    hover:shadow-lg 
                    ${
                      route().current(item.href)
                        ? `${activeGradient} text-white shadow-lg hover:text-white`
                        : `${textColor} ${hoverText}`
                    }`}
            >
              <div
                className={`flex items-center justify-center rounded-full 
                  h-10 transition-all duration-300`}
              >
                {isSidebarOpen ? (
                  <item.lucideIcon className="h-5 w-5" />
                ) : (
                  <div className={`transition-colors`}>
                    {item.icon}
                  </div>
                )}
              </div>

              {isSidebarOpen && (
                <span className="ml-4 transition-all duration-300">
                  {t(item.nameKey)}
                </span>
              )}

              {!isSidebarOpen && (
                <div
                  className={`absolute left-full ml-2 px-3 py-2 
                    ${tooltipBg} text-sm rounded-lg 
                    opacity-0 group-hover:opacity-100 transition-opacity 
                    duration-200 pointer-events-none whitespace-nowrap 
                    z-50`}
                >
                  {t(item.nameKey)}
                  <div
                    className={`absolute left-0 top-1/2 transform 
                    -translate-y-1/2 -translate-x-1 w-2 h-2
                    ${
                      theme === "dark" ? "bg-neutral-800" : "bg-gray-900"
                    } rotate-45`}
                  ></div>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div
          className={`p-4 border-t ${borderColor} ${
            isSidebarOpen ? "flex items-center gap-2" : "flex flex-col gap-2"
          }`}
        >
          <NavLink
            href={route("logout")}
            method="post"
            as="button"
            className={`group relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 
              ${textColor}
              ${logoutHoverBg}
              ${isSidebarOpen ? "flex-1" : "justify-center w-full"}`}
          >
            <div
              className={`flex items-center justify-center rounded-full 
                h-10 transition-all duration-300`}
            >
              {isSidebarOpen ? (
                <LogOut className="h-5 w-5" />
              ) : (
                <div className="relative group">
                  <LogOut className="h-5 w-5" />
                  <div
                    className={`absolute left-full ml-2 px-2 py-1 ${tooltipBg} text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none`}
                  >
                    {t("nav.logout")}
                  </div>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <div className="flex-1">
                <span className="font-medium">{t("nav.logout")}</span>
              </div>
            )}
          </NavLink>

          <div
            className={
              isSidebarOpen
                ? "flex items-center gap-2"
                : "w-full flex flex-col gap-2 items-center"
            }
          >
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
}
