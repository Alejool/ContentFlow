import Logo from '@/../assets/logo-with-name-1024.png';
import ResponsiveNavLink from '@/Components/common/ui/ResponsiveNavLink';
import { useTheme } from '@/Hooks/useTheme';
import { usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  X as CloseIcon,
  FileText,
  Home,
  Layers,
  LogOut,
  Menu,
  User,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setStatus('loading');
    const img = new Image();
    timerRef.current = setTimeout(() => setStatus('error'), 5000);
    img.onload = () => {
      clearTimeout(timerRef.current!);
      setStatus('loaded');
    };
    img.onerror = () => {
      clearTimeout(timerRef.current!);
      setStatus('error');
    };
    img.src = src;
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [src]);

  // Si el whiteLabelLogo falla, caer al logo por defecto
  const finalSrc = status === 'error' && isWhiteLabel ? fallbackSrc : src;
  const isShowingFallback = status === 'error' && isWhiteLabel;

  return (
    <div className="relative flex items-center justify-center">
      {status === 'loading' && (
        <div
          className={`overflow-hidden rounded bg-gray-200 dark:bg-neutral-700 ${
            isWhiteLabel ? 'h-12 w-24' : 'h-20 w-32'
          }`}
        >
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
        </div>
      )}
      <img
        src={isShowingFallback ? fallbackSrc : src}
        alt="Logo"
        onLoad={() => setStatus('loaded')}
        className={`w-auto object-contain transition-opacity duration-300 ${
          status === 'loading' ? 'absolute opacity-0' : 'opacity-100'
        } ${isShowingFallback || !isWhiteLabel ? 'h-20' : 'h-12'}`}
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

export default function MobileNavbar({
  user,
  showingNavigationDropdown,
  setShowingNavigationDropdown,
}: MobileNavbarProps) {
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const { auth } = usePage().props as any;

  const isProfileActive = !!route().current('profile.edit');

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

  return (
    <nav
      className={`sticky top-0 z-50 w-full shadow-lg backdrop-blur-2xl transition-all duration-300 lg:hidden ${
        actualTheme === 'dark'
          ? 'border-b border-neutral-800 bg-neutral-900/90'
          : 'border-b border-gray-200 bg-white/90'
      }`}
    >
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
                const isActive = !!route().current(item.href);
                return (
                  <ResponsiveNavLink
                    key={item.href}
                    href={route(item.href)}
                    active={isActive}
                    className={`flex items-center space-x-3 rounded-lg px-4 py-3 transition-all duration-300 ${
                      isActive
                        ? `bg-primary-600 text-white shadow-sm`
                        : `${
                            actualTheme === 'dark'
                              ? 'text-gray-300 hover:bg-neutral-800 hover:text-primary-400'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                          }`
                    }`}
                  >
                    <item.lucideIcon
                      className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`}
                    />
                    <span className="font-bold">{t(item.nameKey)}</span>
                    {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white"></div>}
                  </ResponsiveNavLink>
                );
              })}

              <div
                className={`mt-4 border-t pt-4 ${actualTheme === 'dark' ? 'border-neutral-800' : 'border-gray-100'}`}
              >
                <ResponsiveNavLink
                  href={route('logout')}
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
