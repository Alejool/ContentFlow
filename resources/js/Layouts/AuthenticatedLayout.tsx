import Bg from "@/../assets/b-8.svg";
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
  const user = usePage().props?.auth?.user as User;

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
    <div
      className={`relative overflow-hidden  scrollbar-y  `}
      style={{
        backgroundImage: `url(${Bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
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

      <MobileNavbar
        user={user}
        showingNavigationDropdown={showingNavigationDropdown}
        setShowingNavigationDropdown={setShowingNavigationDropdown}
      />

      <main
        className={`transition-all duration-500 px-16 ease-in-out relative z-10 ${
          isSidebarOpen ? "lg:ml-80" : "lg:ml-20"
        }`}
      >
        {header && (
          <header className="border-b border-white/10 dark:border-neutral-800/50">
            <div className="mx-auto max-w-7xl px-6 py-8">{header}</div>
          </header>
        )}

        <div className="">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
      </main>

      <GlobalAiAssistant />
    </div>
  );
}
