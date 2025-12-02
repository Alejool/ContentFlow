import { Link } from "@inertiajs/react";
import NavLink from "@/Components/NavLink";
import Logo from "@/../assets/logo.png";
import { Home, User, FileText, BarChart3, Bot, LogOut } from "lucide-react";
import LanguageSwitcher from "@/Components/LanguageSwitcher";
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
  return (
    <div
      className={`hidden lg:block fixed inset-y-0 z-50 transition-all duration-500 ease-in-out ${
        isSidebarOpen ? "w-80" : "w-32"
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0  backdrop-blur-3xl border-r border-gray-200/50 shadow-2xl opacity-80" />

      {/* Content */}
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <Link
            href="/"
            className={`flex items-center transition-all duration-300 ${
              !isSidebarOpen && "justify-center"
            }`}
          >
            <div
              className="w-12 h-12 bg-gradient-to-r
                 from-red-500 to-orange-700 
                rounded-2xl flex items-center justify-center flex-shrink-0"
            >
              <img
                src={Logo}
                alt="logo"
                className="w-8 h-8 object-contain filter brightness-0 invert"
              />
            </div>
            {isSidebarOpen && (
              <div className="ml-4 opacity-100 transition-opacity duration-300">
                <h1
                  className="text-xl font-bold bg-gradient-to-r
                                 from-gray-900 to-gray-600 bg-clip-text text-transparent"
                >
                  ContentFlow
                </h1>
                <p className="text-xs text-gray-500">Social Media Manager</p>
              </div>
            )}
          </Link>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200 group"
          >
            <div className="relative">
              {isSidebarOpen ? (
                <svg
                  className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors"
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
                  className="h-5 w-5 text-gray-600 
                  group-hover:text-blue-600 transition-colors"
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

        {/* Navigation */}
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
                    hover:bg-gradient-to-r 
                    text-gray-700
                    hover:text-red-600
                    hover:bg-orange-50
                    hover:shadow-lg 
                    ${
                      route().current(item.href)
                        ? "bg-gradient-to-r from-red-600 to-orange-600  hover:text-white text-white shadow-lg"
                        : "text-gray-700 hover:text-red-600"
                    }`}
            >
              <div
                className={`flex items-center justify-center rounded-full 
                  h-10  transition-all duration-300 ${route().current(
                    item.href
                  )}`}
              >
                {isSidebarOpen ? (
                  <item.lucideIcon className="h-5 w-5" />
                ) : (
                  <div
                    className={`transition-colors  ${
                      route().current(item.href)
                        ? "bg-gradient-to-r from-red-600 to-orange-600 w-90 text-white shadow-lg"
                        : "text-gray-700 hover:text-red-600"
                    }`}
                  >
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
                  className="absolute left-full ml-2 px-3 py-2 
                    bg-gray-900 text-white text-sm rounded-lg 
                    opacity-0 group-hover:opacity-100 transition-opacity 
                    duration-200 pointer-events-none whitespace-nowrap 
                    z-50"
                >
                  {t(item.nameKey)}
                  <div
                    className="absolute left-0 top-1/2 transform 
                    -translate-y-1/2 -translate-x-1 w-2 h-2
                     bg-gray-900 rotate-45"
                  ></div>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout Button and Language Switcher */}
        <div
          className={`p-4 border-t border-gray-200/50 ${
            isSidebarOpen ? "flex items-center gap-2" : "flex flex-col gap-2"
          }`}
        >
          <NavLink
            href={route("logout")}
            method="post"
            as="button"
            className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 
              
              ${
                isSidebarOpen
                  ? "hover:bg-red-50 text-gray-700 hover:text-red-600 flex-1"
                  : "hover:bg-red-50 text-gray-700 hover:text-red-600 justify-center w-full"
              }`}
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
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {t("nav.logout")}
                  </div>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 ">
                <span className="font-medium">{t("nav.logout")}</span>
              </div>
            )}
          </NavLink>

          {/* Language Switcher */}
          <div className={isSidebarOpen ? "" : "w-full flex justify-center"}>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
}
