import CommandPalette from "@/Components/CommandPalette/CommandPalette";
import GlobalUploadIndicator from "@/Components/GlobalUploadIndicator";
import ActiveWorkspace from "@/Components/Layout/ActiveWorkspace";
import MobileNavbar from "@/Components/Layout/MobileNavbar";
import NotificationButton from "@/Components/Layout/NotificationButton";
import ProfileDropdown from "@/Components/Layout/ProfileDropdown";
import SearchButton from "@/Components/Layout/SearchButton";
import Sidebar from "@/Components/Layout/Sidebar";
import MaintenanceBanner from "@/Components/MaintenanceBanner";
import { ResumeUploadsPrompt } from "@/Components/Upload/ResumeUploadsPrompt";
import { TimezoneInitializer } from "@/Components/common/TimezoneInitializer";
import KeyboardShortcutsModal from "@/Components/common/ui/KeyboardShortcutsModal";
import { AbilityProvider } from "@/Contexts/AbilityContext";
import { OnboardingProvider } from "@/Contexts/OnboardingContext";
import { useCompletionNotifications } from "@/Hooks/useCompletionNotifications";
import { useWorkspaceLocks } from "@/Hooks/usePublicationLock";
import { useSidebarState } from "@/Hooks/useSidebarState";
import { useTheme } from "@/Hooks/useTheme";
import { initNotificationRealtime } from "@/Services/notificationRealtime";
import {
  cleanupProgressRealtime,
  initProgressRealtime,
} from "@/Services/progressRealtime";
import { cssPropertiesManager } from "@/Utils/CSSCustomPropertiesManager";
import { useNotificationStore } from "@/stores/notificationStore";
import { useUploadQueue } from "@/stores/uploadQueueStore";
import type {
  OnboardingState,
  PublicationTemplate,
  SocialPlatform,
  TourStep,
} from "@/types/onboarding";
import { usePage } from "@inertiajs/react";
import { ReactNode, lazy, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// Lazy load OnboardingFlow to reduce initial bundle size
const OnboardingFlow = lazy(
  () => import("@/Components/Onboarding/OnboardingFlow"),
);

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
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState(true);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

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
  const availablePlatforms = props.availablePlatforms as
    | SocialPlatform[]
    | undefined;
  const connectedAccounts = props.connectedAccounts as
    | Array<{ platform: string; account_name: string }>
    | undefined;
  const templates = props.templates as PublicationTemplate[] | undefined;

  // Determine if onboarding should be shown
  // Only show onboarding if user was created recently (within 7 days) and hasn't completed it
  const isRecentUser = user?.created_at
    ? (new Date().getTime() - new Date(user.created_at).getTime()) /
        (1000 * 60 * 60 * 24) <=
      7
    : false;
  const shouldShowOnboarding =
    user && onboardingState && !onboardingState.completedAt && isRecentUser;

  // Debug logging
  useEffect(() => {
    if (user) {
      const isRecentUser = user?.created_at
        ? (new Date().getTime() - new Date(user.created_at).getTime()) /
            (1000 * 60 * 60 * 24) <=
          7
        : false;
    }
  }, [
    user,
    onboardingState,
    tourSteps,
    availablePlatforms,
    templates,
    shouldShowOnboarding,
  ]);

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
    const brandingColor = auth?.current_workspace?.white_label_primary_color;
    // El color de marca es la prioridad salvo que el usuario haya elegido uno manualmente
    // Para simplificar, si hay marca blanca aplicada, usamos ese color por defecto.
    const color = user?.theme_color || brandingColor || "orange";

    cssPropertiesManager.applyPrimaryColor(color);

    // Dynamically update favicon
    const faviconUrl =
      auth?.current_workspace?.white_label_favicon_url || "/favicon.ico";

    // Find all icon links (icon, shortcut icon, apple-touch-icon)
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    const timestamp = new Date().getTime();
    const newHref = `${faviconUrl}?v=${timestamp}`;

    if (existingLinks.length > 0) {
      existingLinks.forEach((link) => {
        (link as HTMLLinkElement).href = newHref;
      });
    } else {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = newHref;
      document.head.appendChild(link);
    }
  }, [
    user?.theme_color,
    auth?.current_workspace?.white_label_primary_color,
    auth?.current_workspace?.white_label_favicon_url,
  ]);

  // Keyboard shortcut: Ctrl+/ to toggle shortcuts modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "/") {
        event.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <AbilityProvider>
      <OnboardingProvider>
        {/* ✅ Inicializar timezone desde Inertia props */}
        <TimezoneInitializer />
        
        {/* Banner de mantenimiento para super admins */}
        {props.maintenanceMode && props.maintenanceBanner ? (
          <MaintenanceBanner message={String(props.maintenanceBanner)} />
        ) : null}
        <div className="flex flex-col overflow-hidden w-full max-w-full">
          <div
            className="relative flex-1 min-h-0 flex w-full max-w-full min-w-0 overflow-x-hidden"
          >
            <div className="absolute inset-0 bg-white dark:bg-neutral-900" />

            <Sidebar
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
          />

          <div className="flex-1 flex flex-col min-h-0 min-w-0 max-w-full relative z-5">
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
                dark:border-neutral-800 bg-white/80 dark:bg-black/80
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
                   <div className="mx-auto w-full max-w-7xl px-4 md:px-6 py-4 ">
                    <div className="min-w-0">{header}</div>
                  </div>
                )}
              </header>

              <div className="flex-1 min-h-0 min-w-0">
                <div className="  min-w-0">{children}</div>
              </div>
            </main>
          </div>

          <CommandPalette />
        </div>
        <GlobalUploadIndicator />
        <ResumeUploadsPrompt />
        <KeyboardShortcutsModal
          isOpen={showShortcutsModal}
          onClose={() => setShowShortcutsModal(false)}
        />

        {/* Conditionally render OnboardingFlow for incomplete onboarding */}
        {/* {shouldShowOnboarding &&
          tourSteps &&
          availablePlatforms &&
          templates && (
            <Suspense fallback={null}>
              <OnboardingFlow
                tourSteps={tourSteps}
                availablePlatforms={availablePlatforms}
                connectedAccounts={connectedAccounts || []}
                templates={templates}
              />
            </Suspense>
          )} */}

        {/* Debug: Show why onboarding is not showing */}
        {!shouldShowOnboarding && user && (
          <div style={{ display: "none" }}>
            OnboardingFlow not showing: shouldShowOnboarding=
            {String(shouldShowOnboarding)}
          </div>
        )}
        {shouldShowOnboarding && !tourSteps && (
          <div style={{ display: "none" }}>
            OnboardingFlow not showing: no tourSteps
          </div>
        )}
        {shouldShowOnboarding && !availablePlatforms && (
          <div style={{ display: "none" }}>
            OnboardingFlow not showing: no availablePlatforms
          </div>
        )}
        {shouldShowOnboarding && !templates && (
          <div style={{ display: "none" }}>
            OnboardingFlow not showing: no templates
          </div>
        )}
      </div>
    </OnboardingProvider>
    </AbilityProvider>
  );
}
