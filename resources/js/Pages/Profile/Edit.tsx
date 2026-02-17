import Button from "@/Components/common/Modern/Button";
import AccountStatistics from "@/Components/profile/Partials/AccountStatistics";
import AiConfigSection from "@/Components/profile/Partials/AiConfigSection";
import ConnectedAccounts from "@/Components/profile/Partials/ConnectedAccounts";
import UpdatePasswordForm from "@/Components/profile/Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "@/Components/profile/Partials/UpdateProfileInformationForm";
import UpdateThemeForm from "@/Components/profile/Partials/UpdateThemeForm";
import { useTheme } from "@/Hooks/useTheme";
import { useUser } from "@/Hooks/useUser";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useUserStore } from "@/stores/userStore";
import { Head, usePage } from "@inertiajs/react";
import {
  BrainCircuit,
  ChevronRight,
  Info,
  Lock,
  Palette,
  Save,
  Share2,
  User,
} from "lucide-react";
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
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);

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
    {
      id: "ai",
      name: t("profile.tabs.ai") || "Inteligencia Artificial",
      icon: BrainCircuit,
    },
    {
      id: "appearance",
      name: t("profile.tabs.appearance") || "Apariencia",
      icon: Palette,
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

      <div className="w-full max-w-full overflow-x-hidden min-w-0 bg-gray-50/30 dark:bg-neutral-900/10 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Horizontal Menu - Styled like ContentPage */}
          <div className="mb-8 overflow-x-auto">
            <div className="inline-flex items-center p-1.5 rounded-lg bg-white dark:bg-neutral-800 backdrop-blur-sm border border-gray-200/60 dark:border-neutral-700/60 gap-1 shadow-sm min-w-max">
              {tabs
                .filter((tab) => !tab.hidden)
                .map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-primary-600 text-white shadow-md shadow-primary-500/20 ring-1 ring-primary-500/50"
                        : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700/50"
                    }`}
                  >
                    <tab.icon
                      className={`w-4 h-4 ${
                        activeTab === tab.id ? "text-white" : "opacity-70"
                      }`}
                    />
                    <span>{tab.name}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Statistics Section (Collapsible) - Full Width */}
          <div className="mb-8">
            <div
              className={`rounded-lg border shadow-sm overflow-hidden transition-all duration-300 dark:bg-neutral-900 darkborder-neutral-800 bg-white border-gray-100"
              }`}
            >
              <button
                onClick={() => setShowStats(!showStats)}
                className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-neutral-800/50 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <ChevronRight
                      className={`w-4 h-4 transition-transform duration-300 ${
                        showStats ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-neutral-400">
                    {t("profile.statistics.title")}
                  </span>
                </div>
              </button>
              <div
                className={`transition-all duration-300 ease-in-out ${
                  showStats
                    ? "max-h-[1000px] opacity-100 border-t border-gray-100 dark:border-neutral-800"
                    : "max-h-0 opacity-0 overflow-hidden"
                }`}
              >
                <div className="p-6">
                  <AccountStatistics status={status} />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="w-full">
            <div
              className={`rounded-lg p-6 md:p-10 border shadow-sm dark:bg-neutral-900 dark:border-neutral-800"bg-white border-gray-100"
              }`}
            >
              {activeTab === "profile" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <UpdateProfileInformationForm
                    mustVerifyEmail={mustVerifyEmail}
                    user={user}
                    status={status}
                  />
                </div>
              )}

              {activeTab === "password" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <UpdatePasswordForm user={user} />
                </div>
              )}

              {activeTab === "accounts" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-8">
                    <ConnectedAccounts />
                  </div>
                </div>
              )}

              {activeTab === "ai" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <AiConfigSectionWrapper user={user} />
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <UpdateThemeForm user={user} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

/**
 * A wrapper to handle form logic for AI settings
 */
function AiConfigSectionWrapper({ user }: { user: any }) {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    hasChanges,
    watchedValues,
    setValue,
  } = useUser(user);
  const { t } = useTranslation();

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <AiConfigSection
        register={register}
        errors={errors}
        isSubmitting={isSubmitting}
        watchedValues={watchedValues}
        setValue={setValue}
      />

      {/* Save Button for AI Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-gray-100 dark:border-neutral-800/50 transition-all duration-300">
        <div className="flex-1">
          {hasChanges && !isSubmitting && (
            <div className="flex items-center gap-3 text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-800/50 max-w-fit animate-in fade-in slide-in-from-left-2 transition-all">
              <Info className="w-4 h-4" />
              {t("profile.messages.unsavedChanges") ||
                "Tienes cambios sin guardar"}
            </div>
          )}
        </div>

        <Button
          disabled={isSubmitting}
          icon={Save}
          loading={isSubmitting}
          loadingText={t("common.saving")}
          className={`w-full sm:w-auto min-w-[200px] transition-all duration-300 rounded-lg shadow-xl font-bold uppercase tracking-wider ${
            isSubmitting
              ? "opacity-50 grayscale"
              : "hover:scale-[1.05] active:scale-[0.95] bg-primary-600 hover:bg-primary-500 text-white border-0 shadow-primary-500/25"
          }`}
          type="submit"
          size="lg"
        >
          {t("profile.actions.saveChanges")}
        </Button>
      </div>
    </form>
  );
}
