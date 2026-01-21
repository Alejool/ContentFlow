import Logo from "@/../assets/logo.png";
import LanguageSwitcher from "@/Components/common/ui/LanguageSwitcher";
import NavLink from "@/Components/common/ui/NavLink";
import ThemeSwitcher from "@/Components/common/ui/ThemeSwitcher";
import WorkspaceSwitcher from "@/Components/Workspace/WorkspaceSwitcher";
import { useTheme } from "@/Hooks/useTheme";
import { Link, usePage } from "@inertiajs/react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  Layers,
} from "lucide-react";
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
    nameKey: "nav.manageContent",
    href: "manage-content.index",
    hrefPattern: "/ManageContent",
    icon: FileText,
  },
  {
    nameKey: "nav.analytics",
    href: "analytics.index",
    icon: BarChart3,
  },
  {
    nameKey: "nav.workspaces",
    href: "workspaces.index",
    icon: Layers,
  },
];

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
}: SidebarProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { auth } = usePage().props as any;

  const isRouteActive = (routeName: string): boolean => {
    if (typeof window === "undefined") return false;

    const currentPath = window.location.pathname;

    const routePatterns: Record<string, string[]> = {
      dashboard: ["/dashboard"],
      "manage-content.index": ["/ManageContent"],
      "analytics.index": ["/analytics"],
      "workspaces.index": ["/workspaces"],
    };

    const patterns = routePatterns[routeName] || [
      `/${routeName.replace(".", "/")}`,
    ];

    return patterns.some(
      (pattern) =>
        currentPath === pattern || currentPath.startsWith(pattern + "/"),
    );
  };

  const getRouteUrl = (routeName: string): string => {
    const routeUrls: Record<string, string> = {
      dashboard: "/dashboard",
      "manage-content.index": "/ManageContent",
      "analytics.index": "/analytics",
      "workspaces.index": "/workspaces",
    };

    return routeUrls[routeName] || `/${routeName.replace(".", "/")}`;
  };

  const isDark = theme === "dark";

  const classes = {
    sidebarBg: isDark ? "bg-neutral-900" : "bg-white",
    borderColor: isDark ? "border-neutral-700/50" : "border-gray-200",
    textColor: isDark ? "text-gray-300" : "text-gray-600",
    hoverBg: isDark ? "hover:bg-neutral-800" : "hover:bg-gray-100",
    hoverText: isDark ? "hover:text-primary-400" : "hover:text-primary-600",
    activeGradient: isDark
      ? "bg-gradient-to-r from-primary-600 to-primary-800"
      : "bg-gradient-to-r from-primary-600 to-primary-700",
    buttonHoverBg: isDark ? "hover:bg-neutral-800" : "hover:bg-gray-100",
    logoGradient: isDark
      ? "from-primary-500 to-primary-700"
      : "from-primary-600 to-primary-800",
    titleGradient: isDark
      ? "from-gray-200 to-gray-400"
      : "from-gray-900 to-gray-700",
    subtitleColor: isDark ? "text-gray-400" : "text-gray-500",
    logoutHoverBg: isDark
      ? "hover:bg-primary-900/30 hover:text-primary-300"
      : "hover:bg-red-50 hover:text-red-600",
    tooltipBg: isDark
      ? "bg-neutral-800 text-gray-100"
      : "bg-gray-900 text-white",
  };

  return (
    <>
      <div
        className={`hidden lg:block fixed  h-full z-50 pb-10 transition-all duration-500 ease-in-out ${
          isSidebarOpen ? "w-80" : "w-32"
        }`}
      >
        <div
          className={`absolute inset-0 backdrop-blur-3xl border-r ${classes.borderColor} shadow-2xl opacity-90 ${classes.sidebarBg}`}
        />

        <div className="mt-3 relative h-full flex flex-col">
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
                    {auth.current_workspace?.name || "Social Media Manager"}
                  </p>
                  {auth.current_workspace?.role && (
                    <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mt-0.5">
                      {auth.current_workspace.role.name}
                    </p>
                  )}
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

          <WorkspaceSwitcher isSidebarOpen={isSidebarOpen} />

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const isActive = !!route().current(item.href);
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

          <div className="mt-auto">
            <div
              className={`p-4 border-t ${classes.borderColor} ${
                isSidebarOpen
                  ? "flex items-center justify-between"
                  : "flex flex-col items-center gap-3"
              }`}
            >
              <div
                className={`flex items-center justify-center gap-2 w-full ${
                  isSidebarOpen ? "flex-row" : "flex-col"
                }`}
              >
                <ThemeSwitcher />
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
