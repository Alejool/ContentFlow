import GlobalAiAssistant from "@/Components/AiAssistant/GlobalAiAssistant";
import MobileNavbar from "@/Components/Layout/MobileNavbar";
import Sidebar from "@/Components/Layout/Sidebar";
import { useTheme } from "@/Hooks/useTheme";
import { initNotificationRealtime } from "@/Services/notificationRealtime";
import { useNotificationStore } from "@/stores/notificationStore";
import { usePage } from "@inertiajs/react";
import { ReactNode, useEffect, useState } from "react";

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
  const { props } = usePage();
  const auth = props.auth as any;
  const user = auth?.user as User;

  const [showingNavigationDropdown, setShowingNavigationDropdown] =
    useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { theme } = useTheme();

  useEffect(() => {
    if (user?.id) {
      initNotificationRealtime(user.id);
      useNotificationStore.getState().fetchNotifications();
    }
  }, [user?.id]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div
        className="relative flex-1 min-h-0 flex bg-url('/assets/b-8.svg') bg-cover bg-center bg-no-repeat"
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

        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          <MobileNavbar
            user={user}
            showingNavigationDropdown={showingNavigationDropdown}
            setShowingNavigationDropdown={setShowingNavigationDropdown}
          />

          <main
            className={`flex-1 min-h-0 overflow-y-auto transition-all duration-500  ease-in-out ${isSidebarOpen ? "lg:ml-80" : "lg:ml-20"
              }`}
          >
            {header && (
              <header className="border-b border-white/10 dark:border-neutral-800/50">
                <div className="mx-auto max-w-7xl px-6 py-8">{header}</div>
              </header>
            )}

            <div className="py-8">
              <div className="mx-auto max-w-7xl md:px-6">{children}</div>
            </div>
          </main>
        </div>

        <GlobalAiAssistant />
      </div>
    </div>
  );
}
