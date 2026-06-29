import { TimezoneInitializer } from '@/Components/common/TimezoneInitializer';
import ActiveWorkspace from '@/Components/Layout/ActiveWorkspace';
import MobileNavbar from '@/Components/Layout/MobileNavbar';
import NotificationButton from '@/Components/Layout/NotificationButton';
import ProfileDropdown from '@/Components/Layout/ProfileDropdown';
import SearchButton from '@/Components/Layout/SearchButton';
import Sidebar from '@/Components/Layout/Sidebar';
import { AbilityProvider } from '@/Contexts/Auth/AbilityContext';
import { OnboardingProvider } from '@/Contexts/Onboarding/OnboardingContext';
import { useLayoutEffects } from '@/Hooks/Layout/useLayoutEffects';
import { useSidebarState } from '@/Hooks/Layout/useSidebarState';
import { useTheme } from '@/Hooks/Layout/useTheme';
import { useCompletionNotifications } from '@/Hooks/Notifications/useCompletionNotifications';
import { useWorkspaceLocks } from '@/Hooks/Publications/usePublicationLock';
import { useStickyOnScroll } from '@/Hooks/ui/useStickyOnScroll';
import type { AuthenticatedLayoutProps, AuthPageProps } from '@/types/common/layout';
import { shouldDisplayOnboarding } from '@/Utils/Onboarding/onboardingHelpers';
import { usePage } from '@inertiajs/react';
import { lazy, Suspense, useState } from 'react';
import { Avatar } from '@/Components/common/Avatar';
import { useTranslation } from 'react-i18next';

// ─── Lazy: componentes pesados no críticos para el render inicial ─────────────
const CommandPalette = lazy(() => import('@/Components/CommandPalette/CommandPalette'));
const GlobalUploadIndicator = lazy(() => import('@/Components/GlobalUploadIndicator'));
const MaintenanceBanner = lazy(() => import('@/Components/MaintenanceBanner'));
const OnboardingFlow = lazy(() => import('@/Components/Onboarding/OnboardingFlow'));
const QueueNotificationFloat = lazy(() => import('@/Components/Queue/QueueNotificationFloat'));
const ResumeUploadsPrompt = lazy(() =>
  import('@/Components/Upload/ResumeUploadsPrompt').then((m) => ({
    default: m.ResumeUploadsPrompt,
  })),
);
const KeyboardShortcutsModal = lazy(() => import('@/Components/common/KeyboardShortcutsModal'));

export default function AuthenticatedLayout({ header, children }: AuthenticatedLayoutProps) {
  const { props } = usePage<AuthPageProps>();
  const auth = props.auth;
  const user = auth.user;

  // ── Hooks (all unconditional — Rules of Hooks) ────────────────────────────
  const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState(true);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const { t } = useTranslation();

  useTheme();
  useWorkspaceLocks();
  useCompletionNotifications();
  useLayoutEffects({ auth, setShowShortcutsModal });

  const isHeaderSticky = useStickyOnScroll({ threshold: 50, enabled: true });

  // ── Guard (after all hooks) ───────────────────────────────────────────────
  if (!user) return null;

  // ── Derived ───────────────────────────────────────────────────────────────
  const showOnboarding = shouldDisplayOnboarding(user, props.onboarding);

  return (
    <AbilityProvider>
      <OnboardingProvider>
        <TimezoneInitializer />

        {props.maintenanceMode && props.maintenanceBanner && (
          <Suspense fallback={null}>
            <MaintenanceBanner message={props.maintenanceBanner} />
          </Suspense>
        )}

        {/* Skip-to-content link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-white focus:shadow-xl"
        >
          {t('common.skipToMainContent', 'Saltar al contenido principal')}
        </a>

        <div className="flex w-full max-w-full flex-col overflow-hidden">
          <div className="flex min-h-0 w-full max-w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            <div className="absolute inset-0 bg-white dark:bg-theme-bg-secondary overflow-hidden pointer-events-none">
              <img 
                src="/assets/mascot-watermark.png" 
                alt=""
                className="fixed bottom-[-50px] right-[-50px] w-[600px] h-[600px] object-contain opacity-[0.04] dark:opacity-[0.02]"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
            </div>

            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

            <div className="relative z-5 flex min-h-0 max-w-full min-w-0 flex-1 flex-col h-screen">
              <MobileNavbar
                user={user}
                showingNavigationDropdown={showingNavigationDropdown}
                setShowingNavigationDropdown={setShowingNavigationDropdown}
              />

              <main
                id="main-content"
                className={`max-w-full min-w-0   transition-all duration-500 ease-in-out ${isSidebarOpen ? 'lg:ml-80' : 'lg:ml-32'
                  }`}
                role="main"
                aria-label="Main content"
                tabIndex={-1}
              >
                <header
                  className={`${isHeaderSticky ? 'sticky top-0' : 'relative'} z-40 flex min-w-0 flex-col border-b border-gray-200/50 bg-white/80 backdrop-blur-xl transition-all duration-300 lg:sticky lg:top-0 dark:border-gray-900 dark:bg-neutral-900/40`}
                >
                  {/* @ts-expect-error route() is missing zero-argument overload in local types */}
                  {!route().current('workspaces.*') && (
                    <div className="w-full">
                      <ActiveWorkspace />
                    </div>
                  )}

                  <div className="mx-auto hidden w-full max-w-7xl min-w-0 items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4 lg:flex">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="hidden lg:block">
                        <SearchButton />
                      </div>
                    </div>
                    <div className="flex min-w-0 shrink-0 items-center gap-3">
                      <div className="hidden items-center gap-2 md:flex">
                        <div className="mx-1 h-6 w-px bg-neutral-200 dark:bg-theme-bg-secondary" />
                        <NotificationButton />
                        <div className="mx-1 h-6 w-px bg-neutral-200 dark:bg-theme-bg-secondary" />
                        <ProfileDropdown
                          user={user}
                          isProfileActive={!!route().current('profile.edit')}
                        />
                      </div>
                    </div>
                  </div>

                  {header && (
                    <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6">
                      <div className="min-w-0">{header}</div>
                    </div>
                  )}
                </header>

                <div className="min-h-0 min-w-0 flex-1">
                  <div className="min-w-0">{children}</div>
                </div>
              </main>
            </div>

            {/* CommandPalette: lazy, no bloquea el render inicial */}
            <Suspense fallback={null}>
              <CommandPalette />
            </Suspense>
          </div>

          <div className="fixed right-4 bottom-4 z-[9999] flex flex-col items-end gap-2">
            <Suspense fallback={null}>
              <GlobalUploadIndicator />
            </Suspense>
          </div>

          <Suspense fallback={null}>
            <ResumeUploadsPrompt />
          </Suspense>

          <Suspense fallback={null}>
            <QueueNotificationFloat />
          </Suspense>

          <Suspense fallback={null}>
            <KeyboardShortcutsModal
              isOpen={showShortcutsModal}
              onClose={() => setShowShortcutsModal(false)}
            />
          </Suspense>

          {showOnboarding && props.tourSteps && props.availablePlatforms && props.templates && (
            <Suspense fallback={null}>
              <OnboardingFlow
                tourSteps={props.tourSteps}
                availablePlatforms={props.availablePlatforms}
                connectedAccounts={props.connectedAccounts ?? []}
                templates={props.templates}
              />
            </Suspense>
          )}
        </div>
      </OnboardingProvider>
    </AbilityProvider>
  );
}
