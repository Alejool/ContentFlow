import Logo from '@/../assets/logo.svg';
import OptimizedImage from '@/Components/common/ui/OptimizedImage';
import ResponsiveNavLink from '@/Components/common/ui/ResponsiveNavLink';
import { useStickyOnScroll } from '@/Hooks/useStickyOnScroll';
import { useTheme } from '@/Hooks/useTheme';
import { usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  X as CloseIcon,
  FileText,
  Home,
  Layers,
  Loader2,
  LogOut,
  Menu,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import NotificationButton from './NotificationButton';
import ProfileDropdown from './ProfileDropdown';
import SearchButton from './SearchButton';

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

const mobileNavigationItems = [
  { nameKey: 'nav.dashboard', href: 'dashboard', lucideIcon: Home },
  { nameKey: 'nav.profile', href: 'profile.edit', lucideIcon: User },
  {
    nameKey: 'nav.manageContent',
    href: 'content.index',
    lucideIcon: FileText,
  },
  { nameKey: 'nav.analytics', href: 'analytics.index', lucideIcon: BarChart3 },
  { nameKey: 'nav.workspaces', href: 'workspaces.index', lucideIcon: Layers },
];

const safeRoute = (name: string, params?: Record<string, any>): string => {
  try {
    return route(name, params);
  } catch {
    return '#';
  }
};

const safeIsActive = (name: string): boolean => {
  try {
    return !!route().current(name);
  } catch {
    return false;
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

  // Escuchar eventos reales de navegación de Inertia para limpiar el estado
  useEffect(() => {
    const handleFinish = () => setLoadingHref(null);
    document.addEventListener('inertia:finish', handleFinish);
    document.addEventListener('inertia:error', handleFinish);
    return () => {
      document.removeEventListener('inertia:finish', handleFinish);
      document.removeEventListener('inertia:error', handleFinish);
    };
  }, []);

  const isProfileActive = safeIsActive('profile.edit');

  const whiteLabelLogo = auth?.current_workspace?.white_label_logo_url;

  // Get user permissions from current workspace
  const userPermissions = auth?.current_workspace?.permissions || [];
  const hasAnalyticsPermission = userPermissions.includes('view-analytics');

  // Filter navigation items based on permissions
  const filteredMobileNavigationItems = mobileNavigationItems.filter((item) => {
    // Hide Analytics if user doesn't have view-analytics permission
    if (item.href === 'analytics.index' && !hasAnalyticsPermission) {
      return false;
    }
    return true;
  });

  // Activar sticky después del 50% del scroll solo en móvil
  const isSticky = useStickyOnScroll({ threshold: 50, enabled: true });

  return (
    <nav
      className={`${isSticky ? 'sticky top-0' : 'relative'} z-50 w-full py-2 shadow-lg backdrop-blur-2xl transition-all duration-300 lg:hidden ${
        actualTheme === 'dark'
          ? 'border-b border-neutral-800 bg-neutral-900/90'
          : 'border-b border-gray-200 bg-white/90'
      }`}
    >
      {/* Barra de progreso de carga */}
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
              onClick={() => setShowingNavigationDropdown(!showingNavigationDropdown)}
              className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors duration-200 ${
                actualTheme === 'dark'
                  ? 'text-gray-400 hover:bg-neutral-800 hover:text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600'
              }`}
              aria-label={showingNavigationDropdown ? 'Close menu' : 'Open menu'}
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
            <div className="space-y-1 px-4 py-6">
              {filteredMobileNavigationItems.map((item) => {
                const isActive = safeIsActive(item.href);
                return (
                  <ResponsiveNavLink
                    key={item.href}
                    href={safeRoute(item.href)}
                    active={isActive}
                    onClick={() => {
                      if (loadingHref) return;
                      setLoadingHref(item.href);
                      setShowingNavigationDropdown(false);
                    }}
                    className={`flex items-center space-x-3 rounded-lg px-4 py-3 transition-all duration-300 ${
                      loadingHref && loadingHref !== item.href ? 'pointer-events-none opacity-50' : ''
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
                    {loadingHref === item.href ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    ) : (
                      <item.lucideIcon
                        className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`}
                      />
                    )}
                    <span className="font-bold">{t(item.nameKey)}</span>
                    {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white"></div>}
                  </ResponsiveNavLink>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
