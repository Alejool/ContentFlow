import AccountStatistics from "@/Components/profile/Partials/AccountStatistics";
import ConnectedAccounts from "@/Components/profile/Partials/ConnectedAccounts";
import UpdatePasswordForm from "@/Components/profile/Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "@/Components/profile/Partials/UpdateProfileInformationForm";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import { Lock, Share2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface EditProps {
  mustVerifyEmail: boolean;
  status?: string;
}

// Componente Avatar personalizado sin Chakra
interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

function CustomAvatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
    xl: "w-20 h-20 text-xl",
    "2xl": "w-24 h-24 text-2xl",
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center font-bold shadow-lg`}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Si la imagen falla, muestra las iniciales
              e.currentTarget.style.display = "none";
              const fallback =
                e.currentTarget.parentElement?.querySelector(
                  ".avatar-fallback",
                );
              if (fallback) fallback.classList.remove("hidden");
            }}
          />
        ) : null}
        <div
          className={`avatar-fallback ${
            src ? "hidden" : ""
          } w-full h-full flex items-center justify-center`}
        >
          {getInitials(name)}
        </div>
      </div>
    </div>
  );
}

import { useUserStore } from "@/stores/userStore";

export default function Edit({ mustVerifyEmail, status }: EditProps) {
  const { t } = useTranslation();
  const user = usePage<any>().props.auth.user;
  const setUser = useUserStore((state) => state.setUser);
  const storedUser = useUserStore((state) => state.user);

  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    // Only update store if user is different to prevent loops
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
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex-shrink-0">
            <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight truncate">
              {t("nav.profile")}
            </h2>
            <p className="text-xs text-gray-500 dark:text-neutral-500 font-medium truncate max-w-[150px] sm:max-w-none">
              {t("profile.settings_description")}
            </p>
          </div>
        </div>
      }
    >
      <Head title="Profile" />

      <div className="py-4">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8">
          {/* Lateral Menu - Left Sidebar */}
          <div className="lg:col-span-3 xl:col-span-2 space-y-4">
            <div className="bg-white/80 dark:bg-neutral-900/80 rounded-none md:rounded-lg p-3 md:p-4 border-y md:border border-white/50 dark:border-neutral-800/50 backdrop-blur-xl shadow-lg shadow-black/5 sticky top-0 lg:top-24 z-30 transition-all duration-300">
              <div className="hidden lg:block text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500 mb-4 px-2">
                {t("profile.menu_title") || "Configuración"}
              </div>
              <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible scrollbar-hide">
                {tabs
                  .filter((tab) => !tab.hidden)
                  .map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                                flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-xs lg:text-sm font-bold transition-all duration-300 whitespace-nowrap w-auto lg:w-full
                                ${
                                  activeTab === tab.id
                                    ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25 scale-[1.02]"
                                    : "text-gray-600 dark:text-neutral-400 hover:bg-white/50 dark:hover:bg-neutral-800/50 hover:text-gray-900 dark:hover:text-white"
                                }
                            `}
                    >
                      <tab.icon
                        className={`w-4 h-4 ${activeTab === tab.id ? "text-white" : "text-primary-500 opacity-70"}`}
                      />
                      <span>{tab.name}</span>
                    </button>
                  ))}
              </nav>
            </div>
          </div>

          <div className="lg:col-span-9 xl:col-span-7 space-y-6 md:space-y-8">
            <div className="bg-white/40 dark:bg-neutral-900/40 rounded-none md:rounded-lg p-4 sm:p-8 md:p-10 border-y md:border border-white/50 dark:border-neutral-800/50 backdrop-blur-sm shadow-sm transition-all duration-300 min-h-[400px]">
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
                  <header className="mb-10 border-b border-gray-100 dark:border-neutral-800 pb-4">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t("connectedAccounts.title") || "Cuentas Conectadas"}
                      </h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 pl-11">
                      {t("connectedAccounts.description") ||
                        "Gestiona tus conexiones con redes sociales y servicios externos."}
                    </p>
                  </header>
                  <ConnectedAccounts />
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-12 xl:col-span-3">
            <div className="bg-white/40 dark:bg-neutral-900/40 rounded-none md:rounded-3xl p-5 md:p-6 border-y md:border border-white/50 dark:border-neutral-800/50 backdrop-blur-sm shadow-sm sticky top-0 xl:top-24 mt-4 lg:mt-0 lg:mb-8">
              <AccountStatistics status={status} />
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
