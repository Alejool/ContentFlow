import CommandPalette from "@/Components/CommandPalette/CommandPalette";
import GlobalUploadIndicator from "@/Components/GlobalUploadIndicator";
import { ResumeUploadsPrompt } from "@/Components/Upload/ResumeUploadsPrompt";
import { LanguageSwitcher } from "@/Components/common/LanguageSwitcher";
import ActiveWorkspace from "@/Components/Layout/ActiveWorkspace";
import MobileNavbar from "@/Components/Layout/MobileNavbar";
import NotificationButton from "@/Components/Layout/NotificationButton";
import ProfileDropdown from "@/Components/Layout/ProfileDropdown";
import SearchButton from "@/Components/Layout/SearchButton";
import Sidebar from "@/Components/Layout/Sidebar";
import { OnboardingProvider } from "@/Contexts/OnboardingContext";
import { useWorkspaceLocks } from "@/Hooks/usePublicationLock";
import { useTheme } from "@/Hooks/useTheme";
import { useCompletionNotifications } from "@/Hooks/useCompletionNotifications";
import { initNotificationRealtime } from "@/Services/notificationRealtime";
import { initProgressRealtime, cleanupProgressRealtime } from "@/Services/progressRealtime";
import { useNotificationStore } from "@/stores/notificationStore";
import { useUploadQueue } from "@/stores/uploadQueueStore";
import { usePage } from "@inertiajs/react";
import { ReactNode, useEffect, useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import type { OnboardingState, TourStep, SocialPlatform, PublicationTemplate } from "@/types/onboarding";

// Lazy load OnboardingFlow to reduce initial bundle size
const OnboardingFlow = lazy(() => import("@/Components/Onboarding/OnboardingFlow"));

interface AuthenticatedLayoutProps {
  header?: ReactNode;
  children: ReactNode;
  user?: User;
}

interface User {
  name: string;
  email: string;
  [key: string]: any;
}

export default function AuthenticatedLayout({
  header,
  children,
}: AuthenticatedLayoutProps) {
  const { t } = useTranslation();
  const { props } = usePage();
  const auth = props.auth as any;
  const user = auth?.user as User;

  const [showingNavigationDropdown, setShowingNavigationDropdown] =
    useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const { theme, actualTheme } = useTheme();
  useWorkspaceLocks();
  
  // Initialize completion notifications monitoring
  // Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
  useCompletionNotifications();
  
  // Initialize upload queue store and restore persisted state
  // Requirements: 7.4, 7.5
  const initializeStore = useUploadQueue((state) => state.initializeStore);
  
  useEffect(() => {
    // Initialize store on mount to restore persisted uploads
    initializeStore();
  }, [initializeStore]);

  // Extract onboarding props
  const onboardingState = props.onboarding as OnboardingState | undefined;
  const tourSteps = props.tourSteps as TourStep[] | undefined;
  const availablePlatforms = props.availablePlatforms as SocialPlatform[] | undefined;
  const connectedAccounts = props.connectedAccounts as Array<{ platform: string; account_name: string }> | undefined;
  const templates = props.templates as PublicationTemplate[] | undefined;
  
  // Determine if onboarding should be shown
  const shouldShowOnboarding = user && onboardingState && !onboardingState.completedAt;

  // Debug logging
  useEffect(() => {
    if (user) {
      console.log('Onboarding Debug:', {
        hasUser: !!user,
        hasOnboardingState: !!onboardingState,
        onboardingState,
        hasTourSteps: !!tourSteps,
        tourStepsLength: tourSteps?.length,
        hasAvailablePlatforms: !!availablePlatforms,
        platformsLength: availablePlatforms?.length,
        hasTemplates: !!templates,
        templatesLength: templates?.length,
        shouldShowOnboarding,
      });
    }
  }, [user, onboardingState, tourSteps, availablePlatforms, templates, shouldShowOnboarding]);

  useEffect(() => {
    if (user?.id) {
      initNotificationRealtime(user.id);
      initProgressRealtime(user.id);
      useNotificationStore.getState().fetchNotifications();
    }

    // Cleanup on unmount
    return () => {
      if (user?.id) {
        cleanupProgressRealtime(user.id);
      }
    };
  }, [user?.id]);

  useEffect(() => {
    const color = user?.theme_color || "orange";
    document.documentElement.setAttribute("data-theme-color", color);
  }, [user?.theme_color]);


  return (
    <OnboardingProvider>
      <div className="h-screen flex flex-col overflow-hidden w-full max-w-full">
      <div
        className="relative flex-1 min-h-0 flex
  w-full
      max-w-full min-w-0 overflow-x-hidden"
      >
        <div
          className="absolute inset-0 bg-white dark:bg-neutral-900"
        />

        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <div className="flex-1 flex flex-col min-h-0 min-w-0 max-w-full relative z-10">
          <MobileNavbar
            user={user}
            showingNavigationDropdown={showingNavigationDropdown}
            setShowingNavigationDropdown={setShowingNavigationDropdown}
          />

          <main
            className={`flex-1 min-w-0 max-w-full overflow-y-auto overflow-x-hidden transition-all duration-500  ease-in-out ${
              isSidebarOpen ? "lg:ml-80" : "lg:ml-32"
            }`}
            role="main"
            aria-label="Main content"
          >
            <header
              className="border-b border-gray-200/50
                dark:border-neutral-800/50 bg-white/80 dark:bg-black/80
                backdrop-blur-xl z-40 min-w-0 sticky top-0 flex flex-col"
            >
              {!route().current("workspaces.*") && (
                <div className="w-full">
                  <ActiveWorkspace />
                </div>
              )}

              <div className="hidden lg:flex mx-auto w-full max-w-7xl px-4 md:px-6 py-3 md:py-4 justify-between items-center gap-4 min-w-0">
                <div className="flex-1 min-w-0 flex items-center gap-4">
                  <div className="hidden lg:block">
                    <SearchButton />
                  </div>
                </div>
                <div className="flex-shrink-0 min-w-0 flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-2">
                    {/* <LanguageSwitcher /> */}
                    <div className="h-6 w-px bg-gray-200 dark:bg-neutral-800 mx-1"></div>
                    <NotificationButton />
                    <div className="h-6 w-px bg-gray-200 dark:bg-neutral-800 mx-1"></div>
                    <ProfileDropdown
                      user={user}
                      isProfileActive={!!route().current("profile.edit")}
                    />
                  </div>
                </div>
              </div>

              {header && (
                <div className="mx-auto w-full max-w-7xl px-4 md:px-6 py-4 border-t border-gray-100 dark:border-neutral-800/50">
                  <div className="min-w-0">{header}</div>
                </div>
              )}
            </header>

            <div className="flex-1 min-h-0 min-w-0">
              <div className="h-full min-w-0">{children}</div>
            </div>
          </main>
        </div>

        <CommandPalette />
      </div>
      <GlobalUploadIndicator />
      <ResumeUploadsPrompt />
      
      {/* Conditionally render OnboardingFlow for incomplete onboarding */}
      {shouldShowOnboarding && tourSteps && availablePlatforms && templates && (
        <Suspense fallback={null}>
          <OnboardingFlow
            tourSteps={tourSteps}
            availablePlatforms={availablePlatforms}
            connectedAccounts={connectedAccounts || []}
            templates={templates}
          />
        </Suspense>
      )}
      
      {/* Debug: Show why onboarding is not showing */}
      {!shouldShowOnboarding && user && (
        <div style={{ display: 'none' }}>
          OnboardingFlow not showing: shouldShowOnboarding={String(shouldShowOnboarding)}
        </div>
      )}
      {shouldShowOnboarding && !tourSteps && (
        <div style={{ display: 'none' }}>
          OnboardingFlow not showing: no tourSteps
        </div>
      )}
      {shouldShowOnboarding && !availablePlatforms && (
        <div style={{ display: 'none' }}>
          OnboardingFlow not showing: no availablePlatforms
        </div>
      )}
      {shouldShowOnboarding && !templates && (
        <div style={{ display: 'none' }}>
          OnboardingFlow not showing: no templates
        </div>
      )}
    </div>
    </OnboardingProvider>
  );
}
