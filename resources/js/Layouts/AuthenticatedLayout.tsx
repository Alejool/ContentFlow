import GlobalAiAssistant from "@/Components/AiAssistant/GlobalAiAssistant";
import CommandPalette from "@/Components/CommandPalette/CommandPalette";
import ActiveWorkspace from "@/Components/Layout/ActiveWorkspace";
import NotificationButton from "@/Components/Layout/NotificationButton";
import MobileNavbar from "@/Components/Layout/MobileNavbar";
import ProfileDropdown from "@/Components/Layout/ProfileDropdown";
import SearchButton from "@/Components/Layout/SearchButton";
import Sidebar from "@/Components/Layout/Sidebar";
import WorkspaceInfoBadge from "@/Components/Workspace/WorkspaceInfoBadge";
import { useNotifications } from "@/Hooks/useNotifications";
import { useTheme } from "@/Hooks/useTheme";
import { initNotificationRealtime } from "@/Services/notificationRealtime";
import { useNotificationStore } from "@/stores/notificationStore";
import { usePage } from "@inertiajs/react";
import { ChevronRight } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface AuthenticatedLayoutProps {
  header?: ReactNode;
  children: ReactNode;
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

  const { theme } = useTheme();

  useEffect(() => {
    if (user?.id) {
      initNotificationRealtime(user.id);
      useNotificationStore.getState().fetchNotifications();
    }
  }, [user?.id]);

  return (
    <div className="h-screen flex flex-col overflow-hidden w-full max-w-full">
      <div
        className="relative flex-1 min-h-0 flex bg-[url('/resources/assets/b-3.jpg')] bg-cover bg-center bg-no-repeat w-full max-w-full min-w-0 overflow-x-hidden"
      >
        <div
          className={`
            absolute inset-0
            ${theme === "dark" ? "bg-black/90" : "bg-white/90"}
          `}
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
            className={`flex-1 min-w-0 max-w-full overflow-y-auto overflow-x-hidden transition-all duration-500  ease-in-out ${isSidebarOpen ? "lg:ml-80" : "lg:ml-32"
              }`}
          >
            <header className="border-b border-gray-200/50 
                dark:border-neutral-800/50 bg-white/80 dark:bg-black/80 
                backdrop-blur-xl z-40 min-w-0 sticky top-0 flex flex-col">
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
                    <NotificationButton />
                    <div className="h-6 w-px bg-gray-200 dark:bg-neutral-800 mx-1"></div>
                    <ProfileDropdown user={user} />
                  </div>
                </div>
              </div>

              {/* Dedicated Page Header Row */}
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

        <GlobalAiAssistant />
        <CommandPalette />
      </div>
    </div>
  );
}
