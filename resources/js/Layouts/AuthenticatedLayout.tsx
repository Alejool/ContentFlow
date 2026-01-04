import GlobalAiAssistant from "@/Components/AiAssistant/GlobalAiAssistant";
import WorkspaceInfoBadge from "@/Components/Workspace/WorkspaceInfoBadge";
import MobileNavbar from "@/Components/Layout/MobileNavbar";
import Sidebar from "@/Components/Layout/Sidebar";
import { useTheme } from "@/Hooks/useTheme";
import { initNotificationRealtime } from "@/Services/notificationRealtime";
import { useNotificationStore } from "@/stores/notificationStore";
import { usePage } from "@inertiajs/react";
import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@inertiajs/react";
import { ChevronRight } from "lucide-react";
import CommandPalette from "@/Components/CommandPalette/CommandPalette";

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
      <Link
        href={route('workspaces.index')}
        className={`
          relative z-[200] h-8 flex items-center px-4 text-[10px] font-bold uppercase tracking-widest
          ${theme === 'dark' ? 'bg-primary-900/95 text-primary-200 hover:bg-primary-900' : 'bg-primary-600/95 text-white hover:bg-primary-700'}
          backdrop-blur-sm border-b border-primary-500/20 transition-all duration-300 cursor-pointer group
        `}
      >
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full overflow-hidden min-w-0">
          <span className="opacity-70 flex-shrink-0">{t('workspace.active_context')}:</span>
          <span className="flex items-center gap-1.5 truncate min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse flex-shrink-0" />
            <span className="truncate max-w-[160px] sm:max-w-md min-w-0">{auth.current_workspace?.name || '...'}</span>
          </span>
          <div className="flex-1 min-w-0" />

          <div className="flex items-center gap-2 ml-2 flex-shrink-0 min-w-0">
            <span className="opacity-70 hidden sm:inline">{t('workspace.role')}:</span>
            <span className={`
               px-2 py-0.5 rounded-md border font-bold
               ${theme === 'dark' ? 'bg-primary-500/20 border-primary-500/30 text-primary-200' : 'bg-white/20 border-white/20 text-white'}
            `}>
              {auth.current_workspace?.user_role || t('workspace.member')}
            </span>
          </div>

          <ChevronRight className="h-3 w-3 opacity-50 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>

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
                backdrop-blur-xl z-40 min-w-0">
              <div className="mx-auto max-w-7xl px-4 md:px-6 py-3 md:py-4 flex justify-between items-center gap-4 min-w-0">
                <div className="flex-1 min-w-0">
                  {header ? header : (
                    <div className="h-8 min-w-0" />
                  )}
                </div>
                <div className="flex-shrink-0 min-w-0">
                  <WorkspaceInfoBadge variant="compact" />
                </div>
              </div>
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
