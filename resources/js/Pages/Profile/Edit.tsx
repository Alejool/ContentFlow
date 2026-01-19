import AccountStatistics from "@/Components/profile/Partials/AccountStatistics";
import ConnectedAccounts from "@/Components/profile/Partials/ConnectedAccounts";
import UpdatePasswordForm from "@/Components/profile/Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "@/Components/profile/Partials/UpdateProfileInformationForm";
import { useTheme } from "@/Hooks/useTheme";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useUserStore } from "@/stores/userStore";
import { Head, usePage } from "@inertiajs/react";
import { ChevronRight, Lock, Share2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface EditProps {
  mustVerifyEmail: boolean;
  status?: string;
}

export default function Edit({ mustVerifyEmail, status }: EditProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const user = usePage<any>().props.auth.user;
  const setUser = useUserStore((state) => state.setUser);
  const storedUser = useUserStore((state) => state.user);

  const [activeTab, setActiveTab] = useState("profile");
  const [showStats, setShowStats] = useState(true);

  // Auto-collapse stats on mobile on mount
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setShowStats(false);
    }
  }, []);

  useEffect(() => {
    if (user && JSON.stringify(user) !== JSON.stringify(storedUser)) {
      setUser(user);
    }
  }, [user, setUser, storedUser]);

  const tabs = [
    { id: "profile", name: t("profile.tabs.general") || "General", icon: User },
    {
      id: "password",
      name: t("profile.tabs.security") || "Seguridad",
      icon: Lock,
      hidden: user.provider !== null,
    },
    {
      id: "accounts",
      name: t("profile.tabs.accounts") || "Conexiones",
      icon: Share2,
    },
  ];

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {t("nav.profile")}
            </h2>
            <p className="text-xs text-gray-500 dark:text-neutral-500 font-medium">
              {t("profile.settings_description")}
            </p>
          </div>
        </div>
      }
    >
      <Head title={t("nav.profile")} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-3 w-full lg:sticky lg:top-24 space-y-6">
            <div
              className={`p-4 rounded-lg border shadow-sm ${
                theme === "dark"
                  ? "bg-neutral-900 border-neutral-800"
                  : "bg-white border-gray-100"
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500 mb-4 px-2">
                {t("profile.menu_title") || "Configuración"}
              </div>
              <nav className="space-y-1">
                {tabs
                  .filter((tab) => !tab.hidden)
                  .map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200
                        ${
                          activeTab === tab.id
                            ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                            : "text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800/50 hover:text-gray-900 dark:hover:text-white"
                        }
                      `}
                    >
                      <tab.icon
                        className={`w-4 h-4 ${activeTab === tab.id ? "text-white" : "text-primary-500"}`}
                      />
                      <span className="flex-1 text-left">{tab.name}</span>
                      <ChevronRight
                        className={`w-4 h-4 transition-opacity ${activeTab === tab.id ? "opacity-100" : "opacity-0"}`}
                      />
                    </button>
                  ))}
              </nav>
            </div>

            <div
              className={`rounded-lg border shadow-sm overflow-hidden transition-all duration-300 ${
                theme === "dark"
                  ? "bg-neutral-900 border-neutral-800"
                  : "bg-white border-gray-100"
              }`}
            >
              <button
                onClick={() => setShowStats(!showStats)}
                className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-neutral-800/50 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <ChevronRight
                      className={`w-4 h-4 transition-transform duration-300 ${showStats ? "rotate-90" : ""}`}
                    />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-neutral-400">
                    {t("profile.statistics.title")}
                  </span>
                </div>
              </button>
              <div
                className={`transition-all duration-300 ease-in-out ${showStats ? "max-h-[1000px] opacity-100 border-t border-gray-100 dark:border-neutral-800" : "max-h-0 opacity-0 overflow-hidden"}`}
              >
                <div className="p-6">
                  <AccountStatistics status={status} />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 w-full">
            <div
              className={`rounded-lg p-6 md:p-10 border shadow-sm ${
                theme === "dark"
                  ? "bg-neutral-900 border-neutral-800"
                  : "bg-white border-gray-100"
              }`}
            >
              {activeTab === "profile" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <UpdateProfileInformationForm
                    mustVerifyEmail={mustVerifyEmail}
                    status={status}
                  />
                </div>
              )}

              {activeTab === "password" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <UpdatePasswordForm />
                </div>
              )}

              {activeTab === "accounts" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-8">
                    <header className="border-b border-gray-100 dark:border-neutral-800 pb-4">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                          <Share2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                          {t("connectedAccounts.title") || "Cuentas Conectadas"}
                        </h2>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-neutral-400 pl-11">
                        {t("connectedAccounts.description") ||
                          "Gestiona tus conexiones con redes sociales y servicios externos."}
                      </p>
                    </header>
                    <ConnectedAccounts />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
