import AccountStatistics from "@/Components/profile/Partials/AccountStatistics";
import OnboardingSection from "@/Components/profile/Partials/OnboardingSection";
import SubscriptionSection from "@/Components/profile/Partials/SubscriptionSection";
import UpdatePasswordForm from "@/Components/profile/Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "@/Components/profile/Partials/UpdateProfileInformationForm";
import UpdateThemeForm from "@/Components/profile/Partials/UpdateThemeForm";
import TabNavigation from "@/Components/common/TabNavigation";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useUserStore } from "@/stores/userStore";
import { Head, usePage } from "@inertiajs/react";
import { CreditCard, Lock, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface EditProps {
  mustVerifyEmail: boolean;
  status?: string;
  subscription: {
    plan_name: string;
    plan_id: string;
    status: string;
    current_period_end: string;
    trial_ends_at: string | null;
    is_trial: boolean;
    features: Record<string, any>;
  } | null;
  usage?: {
    publications_used: number;
    publications_limit: number;
    storage_used: number;
    storage_limit: number;
    ai_requests_used: number;
    ai_requests_limit: number;
    social_accounts_used?: number;
    social_accounts_limit?: number;
    team_members_used?: number;
    team_members_limit?: number;
    external_integrations_used?: number;
    external_integrations_limit?: number;
  };
}

export default function Edit({
  mustVerifyEmail,
  status,
  subscription,
  usage,
}: EditProps) {
  const { t } = useTranslation();
  const user = usePage<any>().props.auth.user;
  const { auth } = usePage<any>().props;
  const setUser = useUserStore((state) => state.setUser);

  const [activeTab, setActiveTab] = useState("profile");

  const currentWorkspace = auth?.current_workspace;
  const isOwner =
    currentWorkspace &&
    (Number(currentWorkspace.created_by) === Number(user.id) ||
      currentWorkspace.user_role_slug === "owner");

  const tabs = [
    { 
      key: "profile", 
      label: t("profile.tabs.general") || "General", 
      icon: User 
    },
    {
      key: "password",
      label: t("profile.tabs.security") || "Seguridad",
      icon: Lock,
      hidden: user.provider !== null,
    },
    {
      key: "subscription",
      label: t("profile.tabs.subscription") || "Suscripción y Plan",
      icon: CreditCard,
      hidden: !isOwner,
    },
  ];

  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);

  // Sync tab with localStorage and URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const storedTab = localStorage.getItem("profile_active_tab");
    const initialTab = tabParam || storedTab || "profile";

    const validTab = tabs.find((t) => t.key === initialTab && !t.hidden);
    if (validTab) {
      setActiveTab(initialTab);
    }
  }, [isOwner, user.provider]);

  useEffect(() => {
    localStorage.setItem("profile_active_tab", activeTab);
  }, [activeTab]);

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
          {/* Horizontal Menu */}
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="horizontal"
          />

          {/* Statistics Section */}
          <div className="">
            <div className="rounded-lg py-2 px-6">
              <AccountStatistics status={status} />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="w-full">
            <div
              className={`rounded-lg p-6 md:p-10 shadow-sm dark:bg-neutral-900 dark:border-neutral-800"bg-white border-gray-100"
              }`}
            >
              {activeTab === "profile" && (
                <div>
                  <UpdateProfileInformationForm
                    mustVerifyEmail={mustVerifyEmail}
                    user={user}
                    status={status}
                  />

                  <div className="mt-10 pt-10 border-t border-gray-100 dark:border-neutral-800/50">
                    <UpdateThemeForm user={user} workspace={currentWorkspace} />
                  </div>
                </div>
              )}

              {activeTab === "password" && (
                <div>
                  <UpdatePasswordForm user={user} />
                </div>
              )}

              {activeTab === "subscription" && (
                <div>
                  <SubscriptionSection
                    subscription={subscription}
                    usage={usage}
                    currentWorkspace={currentWorkspace}
                  />
                </div>
              )}

              {activeTab === "onboarding" && (
                <div>
                  <OnboardingSection />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
