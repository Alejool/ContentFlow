import NavLink from '@/Components/common/ui/NavLink';
import WorkspaceSwitcher from '@/Components/Workspace/Core/WorkspaceSwitcher';
import { NAV_SECTIONS, getRouteUrl, isRouteActive, isSectionActive } from '@/Constants/navigation';
import type { NavRoute, NavSection } from '@/types/navigation';
import { useTheme } from '@/Hooks/Layout/useTheme';
import { Avatar } from '@/Components/common/Avatar';
import Logo from '@assets/logo.png';
import { Link, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Command, ChevronDown, ChevronUp } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const SECTION_SHORTCUT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) {
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const { auth } = usePage().props as any;
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const userPermissions = (auth?.current_workspace?.permissions as string[]) || [];
  const hasAnalyticsPermission = userPermissions.includes('view-analytics');
  const isSuperAdmin = auth?.user?.is_super_admin === true;

  const currentWorkspaceId = auth?.current_workspace?.id;

  const sections = useMemo(() => {
    let idx = 0;
    return NAV_SECTIONS.filter((section) => {
      if (section.id === 'analytics' && !hasAnalyticsPermission) return false;
      if (section.id === 'admin' && !isSuperAdmin) return false;
      return true;
    }).map((section) => ({
      ...section,
      routes: section.routes.filter((route) => {
        if (route.routeName === 'analytics.index' && !hasAnalyticsPermission) return false;
        return true;
      }),
      shortcutIndex: idx++,
    })).filter((section) => section.routes.length > 0);
  }, [hasAnalyticsPermission, isSuperAdmin]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Automatically expand the section containing the active route
  useEffect(() => {
    const initial: Record<string, boolean> = { ...expandedSections };
    let changed = false;
    sections.forEach((section) => {
      const active = section.routes.some((route) => isRouteActive(route));
      if (active && !initial[section.id]) {
        initial[section.id] = true;
        changed = true;
      }
    });
    if (changed) {
      setExpandedSections(initial);
    }
  }, [sections]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey || e.metaKey || e.ctrlKey) return;

      const keyIndex = SECTION_SHORTCUT_KEYS.indexOf(e.key);
      if (keyIndex === -1 || keyIndex >= sections.length) return;

      e.preventDefault();
      const section = sections[keyIndex];
      if (section.routes.length > 0) {
        const firstRoute = section.routes[0];
        window.location.href = getRouteUrl(firstRoute, { currentWorkspaceId });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sections]);

  const isDark = actualTheme === 'dark';

  const classes = {
    sidebarBg: isDark ? 'bg-neutral-900/10' : 'bg-white/80',
    borderColor: isDark ? 'border-neutral-700/50' : 'border-gray-200',
    textColor: isDark ? 'text-gray-300' : 'text-gray-600',
    hoverBg: isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100',
    hoverText: isDark ? 'hover:text-primary-400' : 'hover:text-primary-600',
    activeGradient: isDark
      ? 'bg-linear-to-r from-primary-600 to-primary-800'
      : 'bg-linear-to-r from-primary-600 to-primary-700',
    sectionActiveText: isDark ? 'text-primary-400' : 'text-primary-600',
    sectionInactiveText: isDark ? 'text-gray-500' : 'text-gray-400',
    buttonHoverBg: isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100',
    titleGradient: isDark ? 'from-gray-200 to-gray-400' : 'from-gray-900 to-gray-700',
    subtitleColor: isDark ? 'text-gray-400' : 'text-gray-500',
  };

  const renderNavItem = useCallback((item: NavRoute) => {
    const active = isRouteActive(item);
    return (
      <NavLink
        key={item.routeName + '-' + item.nameKey}
        href={getRouteUrl(item, { currentWorkspaceId })}
        active={active}
        className={`group relative flex w-full items-center px-4 py-2.5 text-sm ${isSidebarOpen ? '' : 'justify-center '
          } rounded-lg font-medium transition-all duration-200 ${classes.hoverBg} ${classes.textColor
          } ${active
            ? `${classes.activeGradient} text-white shadow-md`
            : `${classes.textColor} ${classes.hoverText}`
          }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <item.icon className="h-[18px] w-[18px]" />
        </div>

        {isSidebarOpen && (
          <span className="ml-3 truncate transition-all duration-200">{t(item.nameKey)}</span>
        )}

        {active && isSidebarOpen && (
          <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white/80" />
        )}

        {!isSidebarOpen && (
          <div
            className={`pointer-events-none fixed left-[110px] mt-0.5 rounded-lg px-3 py-2 text-sm whitespace-nowrap opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 z-[99999] ${isDark ? 'bg-neutral-800 text-gray-100' : 'bg-gray-900 text-white'
              }`}
          >
            {t(item.nameKey)}
          </div>
        )}
      </NavLink>
    );
  }, [isSidebarOpen, classes, t, isDark]);

  return (
    <>
      <div
        className={`overflow-x-hidden fixed z-50 hidden h-full pb-10 transition-all duration-500 ease-in-out lg:block ${isSidebarOpen ? 'w-80' : 'w-32'
          }`}
      >
        <div
          className={`absolute inset-0 border-r backdrop-blur-3xl ${classes.borderColor} opacity-90 shadow-2xl ${classes.sidebarBg}`}
        />

        <div className="relative flex h-full flex-col">
          <div
            className={`flex items-center justify-center gap-4 border-b px-4 py-5 ${classes.borderColor}`}
          >
            <Link
              href="/"
              className={`flex items-center transition-all duration-300 ${!isSidebarOpen && 'justify-center'
                }`}
            >
              <div
                className={`relative flex h-12 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg ${!auth?.current_workspace?.white_label_logo_url ? '' : ''
                  }`}
              >
                {!logoLoaded && !logoError && (
                  <div className="absolute inset-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-neutral-700">
                    <div className="animate-shimmer absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
                  </div>
                )}
                {logoError ? (
                  <span className="text-primary-600 dark:text-primary-400 text-lg font-bold">
                    {(auth?.current_workspace?.name || 'C').charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <img
                    id="sidebar-logo"
                    src={Logo}
                    alt={`${auth?.current_workspace?.name || 'Intellipost'} logo`}
                    onLoad={() => setLogoLoaded(true)}
                    onError={() => setLogoError(true)}
                    className={`transition-opacity duration-300 ${logoLoaded ? 'opacity-100' : 'opacity-0'
                      } ${auth?.current_workspace?.white_label_logo_url
                        ? 'h-full w-full object-contain p-1'
                        : 'h-14 w-14 object-contain'
                      }`}
                  />
                )}
              </div>
              {isSidebarOpen && (
                <div className="ml-3 min-w-0 flex-1">
                  <h2
                    className={`truncate bg-linear-to-r text-lg font-bold ${classes.titleGradient} bg-clip-text text-transparent`}
                  >
                    {auth?.current_workspace?.white_label_logo_url
                      ? auth.current_workspace.name
                      : 'Intellipost'}
                  </h2>
                  {auth?.current_workspace?.role && (
                    <p className="text-primary-500 truncate text-[10px] font-bold tracking-widest uppercase">
                      {auth.current_workspace.role.name}
                    </p>
                  )}
                </div>
              )}
            </Link>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`rounded-lg p-2 transition-colors duration-200 ${classes.buttonHoverBg} ${classes.textColor}`}
              aria-label={
                isSidebarOpen
                  ? t('nav.sidebar.collapse') || 'Collapse sidebar'
                  : t('nav.sidebar.expand') || 'Expand sidebar'
              }
              aria-expanded={isSidebarOpen}
            >
              {isSidebarOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>

          <WorkspaceSwitcher isSidebarOpen={isSidebarOpen} />

          <nav
            ref={navRef}
            className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-3 py-2 scroll-smooth select-none [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-800"
            aria-label={t('nav.mainNavigation') || 'Main navigation'}
            role="navigation"
          >
            {sections.map((section) => {
              const sectionActive = isSectionActive(section as NavSection);
              if (section.routes.length === 0) return null;
              const isExpanded = expandedSections[section.id] ?? false;

              return (
                <div key={section.id} role="group" aria-label={t(section.labelKey)} className="mb-2">
                  {isSidebarOpen ? (
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="group/section mb-1.5 mt-4 flex w-full items-center justify-between px-3 py-1 first:mt-0 text-left"
                    >
                      <span
                        className={`flex items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] uppercase ${sectionActive
                          ? classes.sectionActiveText
                          : classes.sectionInactiveText
                          }`}
                      >
                        <span className="truncate">{t(section.labelKey)}</span>
                        <span className={`rounded px-1 py-0.5 text-[9px] font-mono ${isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-gray-200 text-gray-400'
                          }`}>
                          Alt+{SECTION_SHORTCUT_KEYS[section.shortcutIndex]}
                        </span>
                      </span>
                      {isExpanded ? (
                        <ChevronUp className={`h-3 w-3 shrink-0 transition-colors ${sectionActive ? classes.sectionActiveText : classes.sectionInactiveText}`} />
                      ) : (
                        <ChevronDown className={`h-3 w-3 shrink-0 transition-colors ${sectionActive ? classes.sectionActiveText : classes.sectionInactiveText}`} />
                      )}
                    </button>
                  ) : (
                    <div className="group/section relative flex flex-col items-center py-1.5">
                      <div
                        className={`h-px w-6 transition-colors duration-200 ${sectionActive
                          ? 'bg-primary-400/50'
                          : 'bg-gray-300 dark:bg-neutral-700'
                          }`}
                      />
                      <span
                        className={`mt-1 text-[8px] font-mono ${isDark ? 'text-neutral-600' : 'text-gray-400'
                          } opacity-0 transition-opacity duration-200 group-hover/section:opacity-100`}
                      >
                        Alt+{SECTION_SHORTCUT_KEYS[section.shortcutIndex]}
                      </span>
                    </div>
                  )}

                  <AnimatePresence initial={false}>
                    {(!isSidebarOpen || isExpanded) && (
                      <motion.div
                        key={`sidebar-routes-${section.id}`}
                        initial={isSidebarOpen ? { height: 0, opacity: 0 } : undefined}
                        animate={isSidebarOpen ? { height: 'auto', opacity: 1 } : undefined}
                        exit={isSidebarOpen ? { height: 0, opacity: 0 } : undefined}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className={`space-y-0.5 ${isSidebarOpen ? 'overflow-hidden' : 'flex flex-col items-center'}`}
                      >
                        {section.routes.map(renderNavItem)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Footer - keyboard shortcut hint */}
          {isSidebarOpen && (
            <div className={`shrink-0 border-t px-4 py-3 ${classes.borderColor} relative overflow-hidden`}>
              <img 
                src="/assets/mascot-watermark.png" 
                alt=""
                className="absolute right-[-10px] bottom-[-10px] w-16 h-16 object-contain opacity-20 dark:opacity-20 pointer-events-none z-0"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
              <div className="relative z-10 flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
                <Command className="h-3 w-3" />
                <span>
                  <kbd className="rounded border border-gray-300 bg-gray-100 px-1 font-mono text-[9px] dark:border-neutral-600 dark:bg-theme-bg-secondary">
                    Alt
                  </kbd>
                  <span className="mx-1">+</span>
                  <kbd className="rounded border border-gray-300 bg-gray-100 px-1 font-mono text-[9px] dark:border-neutral-600 dark:bg-theme-bg-secondary">
                    #
                  </kbd>
                  <span className="ml-1">{t('nav.section.quickNavHint') || 'para navegar'}</span>
                </span>
                <span className="mx-1 text-gray-300 dark:text-neutral-600">·</span>
                <kbd className="rounded border border-gray-300 bg-gray-100 px-1 font-mono text-[9px] dark:border-neutral-600 dark:bg-theme-bg-secondary">
                  ⌘K
                </kbd>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}