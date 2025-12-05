import Bg from "@/../assets/background.svg";
import GlobalAiAssistant from "@/Components/AiAssistant/GlobalAiAssistant";
import { useTheme } from "@/Hooks/useTheme";
import { usePage } from "@inertiajs/react";
import { ReactNode, useState } from "react";
import MobileNavbar from "./Components/MobileNavbar";
import Sidebar from "./Components/Sidebar";

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
  const user = usePage().props.auth.user as User;
  const [showingNavigationDropdown, setShowingNavigationDropdown] =
    useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { theme } = useTheme();

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${Bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className={`
          absolute inset-0 pointer-events-none backdrop-blur-md transition-all duration-300
          ${
            theme === "dark"
              ? "bg-gray-900/95 backdrop-blur-sm"
              : "bg-white/20 backdrop-blur-md"
          }
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
        className={`transition-all duration-500 ease-in-out relative z-10 ${
          isSidebarOpen ? "lg:ml-80" : "lg:ml-20"
        }`}
      >
        {header && (
          <header className="border-b border-white/10 dark:border-neutral-800/50">
            <div className="mx-auto max-w-7xl px-6 py-8">{header}</div>
          </header>
        )}

        <div className="p-8 min-h-screen">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
      </main>

      <GlobalAiAssistant />
    </div>
  );
}
