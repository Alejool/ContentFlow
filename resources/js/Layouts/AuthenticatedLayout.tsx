import ActiveWorkspace from '@/Components/Layout/ActiveWorkspace';
import MobileNavbar from '@/Components/Layout/MobileNavbar';
import NotificationButton from '@/Components/Layout/NotificationButton';
import ProfileDropdown from '@/Components/Layout/ProfileDropdown';
import SearchButton from '@/Components/Layout/SearchButton';
import Sidebar from '@/Components/Layout/Sidebar';
import { TimezoneInitializer } from '@/Components/common/TimezoneInitializer';
import { AbilityProvider } from '@/Contexts/Auth/AbilityContext';
import { OnboardingProvider } from '@/Contexts/Onboarding/OnboardingContext';
import { useCompletionNotifications } from '@/Hooks/Notifications/useCompletionNotifications';
import { useWorkspaceLocks } from '@/Hooks/Publications/usePublicationLock';
import { useSidebarState } from '@/Hooks/Layout/useSidebarState';
import { useStickyOnScroll } from '@/Hooks/ui/useStickyOnScroll';
import { useTheme } from '@/Hooks/Layout/useTheme';
import { shouldDisplayOnboarding } from '@/Utils/Onboarding/onboardingHelpers';
import { useLayoutEffects } from '@/Hooks/Layout/useLayoutEffects';
import type { AuthenticatedLayoutProps, AuthPageProps } from '@/types/common/layout';
import { usePage } from '@inertiajs/react';
import { lazy, Suspense, useState } from 'react';

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
const KeyboardShortcutsModal = lazy(
  () => import('@/Components/common/ui/KeyboardShortcutsModal'),
);

export default function AuthenticatedLayout({ header, children }: AuthenticatedLayoutProps) {
  const { props } = usePage<AuthPageProps>();
  const auth = props.auth;
  const user = auth.user;

  // ── Hooks (all unconditional — Rules of Hooks) ────────────────────────────
  const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState(true);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

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

        <div className="flex w-full max-w-full flex-col overflow-hidden">
          <div className="relative flex min-h-0 w-full min-w-0 max-w-full flex-1 overflow-x-hidden">
            <div className="absolute inset-0 bg-white dark:bg-neutral-900" />

            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

            <div className="z-5 relative flex min-h-0 min-w-0 max-w-full flex-1 flex-col">
              <MobileNavbar
                user={user}
                showingNavigationDropdown={showingNavigationDropdown}
                setShowingNavigationDropdown={setShowingNavigationDropdown}
              />

              <main
                className={`min-w-0 max-w-full flex-1  overflow-x-hidden transition-all duration-500 ease-in-out ${
                  isSidebarOpen ? 'lg:ml-80' : 'lg:ml-32'
                }`}
                role="main"
                aria-label="Main content"
              >
                <header
                  className={`${isHeaderSticky ? 'sticky top-0' : 'relative'} z-40 flex min-w-0 flex-col border-b border-gray-200/50 bg-white/80 backdrop-blur-xl transition-all duration-300 dark:border-neutral-800 dark:bg-black/80 lg:sticky lg:top-0`}
                >
                  {/* @ts-expect-error route() is missing zero-argument overload in local types */}
                  {!route().current('workspaces.*') && (
                    <div className="w-full">
                      <ActiveWorkspace />
                    </div>
                  )}

                  <div className="mx-auto hidden w-full min-w-0 max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4 lg:flex">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="hidden lg:block">
                        <SearchButton />
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-shrink-0 items-center gap-3">
                      <div className="hidden items-center gap-2 md:flex">
                        <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-neutral-800" />
                        <NotificationButton />
                        <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-neutral-800" />
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

          <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">
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
