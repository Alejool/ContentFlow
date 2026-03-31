import Logo from '@/../assets/logo.png';
import NavLink from '@/Components/common/ui/NavLink';
import WorkspaceSwitcher from '@/Components/Workspace/WorkspaceSwitcher';
import { useTheme } from '@/Hooks/useTheme';
import { Link, usePage } from '@inertiajs/react';
import { BarChart3, ChevronLeft, ChevronRight, FileText, Home, Layers } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const navigationItems = [
  {
    nameKey: 'nav.dashboard',
    href: 'dashboard',
    icon: Home,
  },
  {
    nameKey: 'nav.manageContent',
    href: 'content.index',
    hrefPattern: '/content',
    icon: FileText,
  },
  {
    nameKey: 'nav.analytics',
    href: 'analytics.index',
    icon: BarChart3,
  },
  {
    nameKey: 'nav.workspaces',
    href: 'workspaces.index',
    icon: Layers,
  },
];

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) {
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const { auth } = usePage().props as any;
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Get user permissions from current workspace
  const userPermissions = auth?.current_workspace?.permissions || [];
  const hasAnalyticsPermission = userPermissions.includes('view-analytics');

  // Filter navigation items based on permissions
  const filteredNavigationItems = navigationItems.filter((item) => {
    // Hide Analytics if user doesn't have view-analytics permission
    if (item.href === 'analytics.index' && !hasAnalyticsPermission) {
      return false;
    }
    return true;
  });

  const isRouteActive = (routeName: string): boolean => {
    if (typeof window === 'undefined') return false;

    const currentPath = window.location.pathname;

    const routePatterns: Record<string, string[]> = {
      dashboard: ['/dashboard'],
      'content.index': ['/content'],
      'analytics.index': ['/analytics'],
      'workspaces.index': ['/workspaces'],
    };

    const patterns = routePatterns[routeName] || [`/${routeName.replace('.', '/')}`];

    return patterns.some(
      (pattern) => currentPath === pattern || currentPath.startsWith(pattern + '/'),
    );
  };

  const getRouteUrl = (routeName: string): string => {
    const routeUrls: Record<string, string> = {
      dashboard: '/dashboard',
      'content.index': '/content',
      'analytics.index': '/analytics',
      'workspaces.index': '/workspaces',
    };

    return routeUrls[routeName] || `/${routeName.replace('.', '/')}`;
  };

  const isDark = actualTheme === 'dark';

  const classes = {
    sidebarBg: isDark ? 'bg-neutral-900/10' : 'bg-white/80',
    borderColor: isDark ? 'border-neutral-700/50' : 'border-gray-200',
    textColor: isDark ? 'text-gray-300' : 'text-gray-600',
    hoverBg: isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100',
    hoverText: isDark ? 'hover:text-primary-400' : 'hover:text-primary-600',
    activeGradient: isDark
      ? 'bg-gradient-to-r from-primary-600 to-primary-800'
      : 'bg-gradient-to-r from-primary-600 to-primary-700',
    buttonHoverBg: isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100',
    logoGradient: isDark ? 'from-primary-500 to-primary-700' : 'from-primary-600 to-primary-800',
    titleGradient: isDark ? 'from-gray-200 to-gray-400' : 'from-gray-900 to-gray-700',
    subtitleColor: isDark ? 'text-gray-400' : 'text-gray-500',
    logoutHoverBg: isDark
      ? 'hover:bg-primary-900/30 hover:text-primary-300'
      : 'hover:bg-red-50 hover:text-red-600',
  };

  return (
    <>
      <div
        className={`fixed z-50 hidden h-full pb-10 transition-all duration-500 ease-in-out lg:block ${
          isSidebarOpen ? 'w-80' : 'w-32'
        }`}
      >
        <div
          className={`absolute inset-0 border-r backdrop-blur-3xl ${classes.borderColor} opacity-90 shadow-2xl ${classes.sidebarBg}`}
        />

        <div className="relative mt-3 flex h-full flex-col">
          <div
            className={`flex items-center justify-center gap-4 border-b p-6 ${classes.borderColor}`}
          >
            <Link
              href="/"
              className={`flex items-center transition-all duration-300 ${
                !isSidebarOpen && 'justify-center'
              }`}
            >
              <div
                className={`relative h-14 w-12 ${!auth?.current_workspace?.white_label_logo_url ? 'bg-gradient-to-r' : ''} flex flex-shrink-0 items-center justify-center overflow-hidden rounded-lg`}
              >
                {!logoLoaded && !logoError && (
                  <div className="absolute inset-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-neutral-700">
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
                  </div>
                )}
                {logoError ? (
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {(auth?.current_workspace?.name || 'C').charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <img
                    id="sidebar-logo"
                    src={Logo}
                    alt={`${auth?.current_workspace?.name || 'ContentFlow'} logo`}
                    onLoad={() => setLogoLoaded(true)}
                    onError={() => setLogoError(true)}
                    className={`transition-opacity duration-300 ${logoLoaded ? 'opacity-100' : 'opacity-0'} ${
                      auth?.current_workspace?.white_label_logo_url
                        ? 'h-full w-full object-contain p-1'
                        : 'h-16 w-16 object-contain'
                    }`}
                  />
                )}
              </div>
              {isSidebarOpen && (
                <div className="ml-4 opacity-100 transition-opacity duration-300">
                  <h1
                    className={`bg-gradient-to-r text-xl font-bold ${classes.titleGradient} bg-clip-text text-transparent`}
                  >
                    {auth?.current_workspace?.white_label_logo_url
                      ? auth.current_workspace.name
                      : 'ContentFlow'}
                  </h1>
                  <p className={`text-xs ${classes.subtitleColor}`}>
                    {auth?.current_workspace?.white_label_logo_url
                      ? t('nav.workspace_branding')
                      : auth?.current_workspace?.name || 'Social Media Manager'}
                  </p>
                  {auth?.current_workspace?.role && (
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-500">
                      {auth.current_workspace.role.name}
                    </p>
                  )}
                </div>
              )}
            </Link>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`rounded-lg p-2 transition-colors duration-200 ${classes.buttonHoverBg} ${classes.textColor}`}
              aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              aria-expanded={isSidebarOpen}
            >
              {isSidebarOpen ? (
                <ChevronLeft
                  className={`h-5 w-5 transition-colors ${
                    isDark
                      ? 'text-gray-400 hover:text-primary-400'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                />
              ) : (
                <ChevronRight
                  className={`h-5 w-5 transition-colors ${
                    isDark
                      ? 'text-gray-400 hover:text-primary-400'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                />
              )}
            </button>
          </div>

          <WorkspaceSwitcher isSidebarOpen={isSidebarOpen} />

          <nav className="flex-1 space-y-2 px-4" aria-label="Main navigation">
            {filteredNavigationItems.map((item) => {
              const isActive = !!route().current(item.href);
              const navLink = (
                <NavLink
                  key={item.href}
                  href={getRouteUrl(item.href)}
                  active={isActive}
                  className={`group relative flex w-full items-center px-4 py-3 text-sm ${isSidebarOpen ? '' : 'justify-center'} rounded-lg font-medium transition-all duration-300 ${classes.hoverBg} ${classes.textColor} hover:shadow-lg ${
                    isActive
                      ? `${classes.activeGradient} text-white shadow-lg hover:text-white`
                      : `${classes.textColor} ${classes.hoverText}`
                  }`}
                >
                  <div className="flex h-10 items-center justify-center rounded-full">
                    <item.icon className="h-5 w-5" />
                  </div>

                  {isSidebarOpen && (
                    <span className="ml-4 transition-all duration-300">{t(item.nameKey)}</span>
                  )}

                  {!isSidebarOpen && (
                    <div
                      className={`pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${isDark ? 'bg-neutral-800 text-gray-100' : 'bg-gray-900 text-white'}`}
                    >
                      {t(item.nameKey)}
                    </div>
                  )}
                </NavLink>
              );

              return navLink;
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
