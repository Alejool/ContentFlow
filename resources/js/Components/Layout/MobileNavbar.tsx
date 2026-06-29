import OptimizedImage from '@/Components/common/ui/OptimizedImage';
import ResponsiveNavLink from '@/Components/common/ui/ResponsiveNavLink';
import { Avatar } from '@/Components/common/Avatar';
import { NAV_SECTIONS, isRouteActive as isNavRouteActive, getRouteUrl } from '@/Constants/navigation';
import type { NavSection } from '@/types/navigation';
import { useTheme } from '@/Hooks/Layout/useTheme';
import { useFocusTrap } from '@/Hooks/ui/useKeyboardNavigation';
import { useStickyOnScroll } from '@/Hooks/ui/useStickyOnScroll';
import Logo from '@assets/logo.svg';
import { usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Command,
  Loader2,
  LogOut,
  Menu,
  Search,
  X as CloseIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import NotificationButton from '@/Components/Layout/NotificationButton';
import ProfileDropdown from '@/Components/Layout/ProfileDropdown';
import SearchButton from '@/Components/Layout/SearchButton';

function NavLogo({
  src,
  fallbackSrc,
  isWhiteLabel,
}: {
  src: string;
  fallbackSrc: string;
  isWhiteLabel: boolean;
}) {
  return (
    <div className="flex items-center justify-center">
      <OptimizedImage
        src={src}
        fallbackSrc={fallbackSrc}
        alt=""
        eager={true}
        className={`w-auto object-contain ${isWhiteLabel ? 'h-16' : 'h-20'}`}
      />
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

const safeRoute = (name: string, params?: Record<string, any>): string => {
  try {
    return route(name, params);
  } catch {
    return '#';
  }
};

export default function MobileNavbar({
  user,
  showingNavigationDropdown,
  setShowingNavigationDropdown,
}: MobileNavbarProps) {
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const { auth } = usePage<{
    auth: {
      current_workspace?: {
        white_label_logo_url?: string;
        permissions?: string[];
      };
    };
  }>().props;

  const [loadingHref, setLoadingHref] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(menuRef, showingNavigationDropdown);

  useEffect(() => {
    const handleFinish = () => setLoadingHref(null);
    document.addEventListener('inertia:finish', handleFinish);
    document.addEventListener('inertia:error', handleFinish);
    return () => {
      document.removeEventListener('inertia:finish', handleFinish);
      document.removeEventListener('inertia:error', handleFinish);
    };
  }, []);

  useEffect(() => {
    if (showingNavigationDropdown) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery('');
      setExpandedSections({});
    }
  }, [showingNavigationDropdown]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showingNavigationDropdown) {
        setShowingNavigationDropdown(false);
        menuTriggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showingNavigationDropdown, setShowingNavigationDropdown]);

  const isProfileActive = !!safeRoute('profile.edit');
  const whiteLabelLogo = auth?.current_workspace?.white_label_logo_url;

  const userPermissions = auth?.current_workspace?.permissions || [];
  const hasAnalyticsPermission = userPermissions.includes('view-analytics');
  const isSuperAdmin = (auth as any)?.user?.is_super_admin === true;

  const sections = useMemo(() => {
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
    })).filter((section) => section.routes.length > 0);
  }, [hasAnalyticsPermission, isSuperAdmin]);

  const filteredSections = useMemo(() => {
    if (!searchQuery) {
      const allExpanded: Record<string, boolean> = {};
      sections.forEach((s) => { allExpanded[s.id] = true; });
      return { sections, expanded: allExpanded };
    }

    const q = searchQuery.toLowerCase();
    const allExpanded: Record<string, boolean> = {};

    const filtered = sections
      .map((section) => ({
        ...section,
        routes: section.routes.filter(
          (route) =>
            t(route.nameKey).toLowerCase().includes(q) ||
            t(section.labelKey).toLowerCase().includes(q),
        ),
      }))
      .filter((section) => section.routes.length > 0);

    filtered.forEach((s) => { allExpanded[s.id] = true; });
    return { sections: filtered, expanded: allExpanded };
  }, [sections, searchQuery, t]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const isSticky = useStickyOnScroll({ threshold: 50, enabled: true });

  return (
    <nav
      role="navigation"
      aria-label="Mobile navigation"
      className={`${isSticky ? 'sticky top-0' : 'relative'} z-50 w-full py-2 shadow-lg backdrop-blur-2xl transition-all duration-300 lg:hidden ${
        actualTheme === 'dark'
          ? 'border-b border-neutral-800 bg-neutral-900/90'
          : 'border-b border-gray-200 bg-white/90'
      }`}
    >
      <AnimatePresence>
        {loadingHref && (
          <motion.div
            key="loading-bar"
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 0.85 }}
            exit={{ scaleX: 1, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute left-0 top-0 h-0.5 w-full origin-left bg-primary-500"
          />
        )}
      </AnimatePresence>
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <button
              ref={menuTriggerRef}
              onClick={() => setShowingNavigationDropdown(!showingNavigationDropdown)}
              className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors duration-200 ${
                actualTheme === 'dark'
                  ? 'text-gray-400 hover:bg-neutral-800 hover:text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600'
              }`}
              aria-label={
                showingNavigationDropdown
                  ? t('nav.menu.close') || 'Close menu'
                  : t('nav.menu.open') || 'Open menu'
              }
              aria-expanded={showingNavigationDropdown}
              aria-controls="mobile-menu-panel"
            >
              {showingNavigationDropdown ? (
                <CloseIcon className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          <div className="flex flex-1 justify-center">
            <NavLogo
              src={whiteLabelLogo || Logo}
              fallbackSrc={Logo}
              isWhiteLabel={!!whiteLabelLogo}
            />
          </div>

          <div className="flex items-center gap-2">
            <SearchButton variant="compact" />
            <NotificationButton />
            <ProfileDropdown user={user} isProfileActive={isProfileActive} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showingNavigationDropdown && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className={`overflow-hidden border-t ${
              actualTheme === 'dark'
                ? 'border-neutral-800 bg-neutral-900'
                : 'border-gray-100 bg-white'
            }`}
          >
            <div
              ref={menuRef}
              id="mobile-menu-panel"
              role="dialog"
              aria-modal="true"
              aria-label={t('nav.menu.navigation') || 'Navigation menu'}
              className="space-y-1 px-4 py-6"
            >
              {/* Search */}
              <div className="relative mb-4">
                <Search
                  className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                    actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}
                  aria-hidden="true"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('nav.search') || 'Buscar rutas...'}
                  aria-label={t('nav.search') || 'Buscar rutas'}
                  className={`w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm outline-none transition-colors ${
                    actualTheme === 'dark'
                      ? 'border-neutral-700 bg-neutral-800 text-gray-100 placeholder:text-gray-500 focus:border-primary-500'
                      : 'border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-primary-500'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      actualTheme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    aria-label={t('nav.search.clear') || 'Clear search'}
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Accordion Sections */}
              {filteredSections.sections.length === 0 && searchQuery && (
                <div className="py-8 text-center text-sm text-gray-500 dark:text-neutral-400">
                  {t('nav.noResults') || 'No se encontraron rutas'}
                </div>
              )}

              {filteredSections.sections.map((section) => {
                const isExpanded = searchQuery ? true : expandedSections[section.id] ?? false;
                const hasActive = section.routes.some((r) => isNavRouteActive(r));

                return (
                  <div key={section.id} className="mb-1" role="group" aria-label={t(section.labelKey)}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-bold transition-colors ${
                        actualTheme === 'dark'
                          ? 'text-gray-300 hover:bg-neutral-800'
                          : 'text-gray-700 hover:bg-gray-50'
                      } ${hasActive ? 'text-primary-500 dark:text-primary-400' : ''}`}
                      aria-expanded={isExpanded}
                      aria-controls={`section-${section.id}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold tracking-normal normal-case">
                          {t(section.labelKey)}
                        </span>
                        {hasActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                        )}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          key={`content-${section.id}`}
                          id={`section-${section.id}`}
                          role="list"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="ml-2 space-y-0.5 border-l-2 pl-3 dark:border-neutral-700">
                            {section.routes.map((item) => {
                              const currentWorkspaceId = auth?.current_workspace?.id;
                              const href = getRouteUrl(item, { currentWorkspaceId });
                              const isActive = isNavRouteActive(item);
                              return (
                                <ResponsiveNavLink
                                  key={item.routeName + '-' + item.nameKey}
                                  href={href}
                                  active={isActive}
                                  role="listitem"
                                  onClick={() => {
                                    if (loadingHref) return;
                                    setLoadingHref(item.routeName);
                                    setShowingNavigationDropdown(false);
                                  }}
                                  className={`flex items-center space-x-3 rounded-lg px-4 py-3 transition-all duration-300 ${
                                    loadingHref && loadingHref !== item.routeName
                                      ? 'pointer-events-none opacity-50'
                                      : ''
                                  } ${
                                    isActive
                                      ? `bg-primary-600 text-white shadow-sm`
                                      : `${
                                          actualTheme === 'dark'
                                            ? 'text-gray-300 hover:bg-neutral-800 hover:text-primary-400'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                                        }`
                                  }`}
                                >
                                  {loadingHref === item.routeName ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                  ) : (
                                    <item.icon
                                      className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`}
                                    />
                                  )}
                                  <span className="text-base font-medium">{t(item.nameKey)}</span>
                                  {isActive && (
                                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                                  )}
                                </ResponsiveNavLink>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              <div
                className={`mt-4 border-t pt-4 ${actualTheme === 'dark' ? 'border-neutral-800' : 'border-gray-100'}`}
              >
                <ResponsiveNavLink
                  href={safeRoute('logout')}
                  method="post"
                  as="button"
                  className={`flex w-full items-center justify-center space-x-3 rounded-lg border px-4 py-3 font-bold transition-all duration-300 ${
                    actualTheme === 'dark'
                      ? 'border-neutral-700 bg-neutral-800 text-red-400 hover:bg-red-900/20'
                      : 'border-gray-200 bg-gray-50 text-red-600 hover:bg-red-50'
                  }`}
                >
                  <LogOut className="h-5 w-5" />
                  <span>{t('nav.logout')}</span>
                </ResponsiveNavLink>
              </div>

              {/* Footer hint */}
              <div className="relative overflow-hidden mt-3 pt-3">
                <img 
                  src="/assets/mascot-watermark.png" 
                  alt=""
                  className="absolute left-[-10px] bottom-[-10px] w-12 h-12 object-contain opacity-20 dark:opacity-20 pointer-events-none z-0"
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
                <div className="relative z-10 flex items-center justify-center gap-2 text-[10px] text-gray-400 dark:text-neutral-500">
                  <Command className="h-3 w-3" />
                  <span>
                    <kbd className="rounded border border-gray-300 bg-gray-100 px-1 font-mono text-[9px] dark:border-neutral-600 dark:bg-theme-bg-secondary">
                      Esc
                    </kbd>
                    <span className="mx-1">{t('common.close') || 'cerrar'}</span>
                  </span>
                  <span className="mx-1 text-gray-300 dark:text-neutral-600">·</span>
                  <kbd className="rounded border border-gray-300 bg-gray-100 px-1 font-mono text-[9px] dark:border-neutral-600 dark:bg-theme-bg-secondary">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}