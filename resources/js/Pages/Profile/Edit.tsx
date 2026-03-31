import Button from '@/Components/common/Modern/Button';
import TabNavigation from '@/Components/common/TabNavigation';
import AccountStatistics from '@/Components/profile/Partials/AccountStatistics';
import OnboardingSection from '@/Components/profile/Partials/OnboardingSection';
import SubscriptionSection from '@/Components/profile/Partials/SubscriptionSection';
import UpdatePasswordForm from '@/Components/profile/Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from '@/Components/profile/Partials/UpdateProfileInformationForm';
import UpdateThemeForm from '@/Components/profile/Partials/UpdateThemeForm';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useUserStore } from '@/stores/userStore';
import { Head, usePage } from '@inertiajs/react';
import { CreditCard, Lock, Save, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

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

export default function Edit({ mustVerifyEmail, status, subscription, usage }: EditProps) {
  const { t } = useTranslation();
  const user = usePage<any>().props.auth.user;
  const { auth } = usePage<any>().props;
  const setUser = useUserStore((state) => state.setUser);

  const [activeTab, setActiveTab] = useState('profile');
  const formRef = useRef<HTMLFormElement | null>(null);

  const currentWorkspace = auth?.current_workspace;
  const isOwner =
    currentWorkspace &&
    (Number(currentWorkspace.created_by) === Number(user.id) ||
      currentWorkspace.user_role_slug === 'owner');

  const tabs = [
    {
      key: 'profile',
      label: t('profile.tabs.general') || 'General',
      icon: User,
    },
    {
      key: 'password',
      label: t('profile.tabs.security') || 'Seguridad',
      icon: Lock,
      hidden: user.provider !== null,
    },
    {
      key: 'subscription',
      label: t('profile.tabs.subscription') || 'Suscripción y Plan',
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
    const tabParam = params.get('tab');
    const storedTab = localStorage.getItem('profile_active_tab');
    const initialTab = tabParam || storedTab || 'profile';

    const validTab = tabs.find((t) => t.key === initialTab && !t.hidden);
    if (validTab) {
      setActiveTab(initialTab);
    }
  }, [isOwner, user.provider]);

  useEffect(() => {
    localStorage.setItem('profile_active_tab', activeTab);
  }, [activeTab]);

  const handleSaveClick = () => {
    if (formRef.current && activeTab === 'profile') {
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex w-full flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
              <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight text-gray-900 dark:text-white">
                {t('nav.profile')}
              </h2>
              <p className="text-xs font-medium text-gray-500 dark:text-neutral-500">
                {t('profile.settings_description')}
              </p>
            </div>
          </div>

          {activeTab === 'profile' && (
            <Button
              onClick={handleSaveClick}
              icon={Save}
              size="md"
              className="shadow-md hover:shadow-lg"
            >
              {t('profile.actions.saveChanges')}
            </Button>
          )}
        </div>
      }
    >
      <Head title={t('nav.profile')} />

      <div className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-gray-50/30 dark:bg-neutral-900/10">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Horizontal Menu */}
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="horizontal"
          />

          {/* Statistics Section */}
          <div className="">
            <div className="rounded-lg px-6 py-2">
              <AccountStatistics status={status} />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="w-full">
            <div
              className={`dark:border-neutral-800"bg-white border-gray-100" } rounded-lg p-6 shadow-sm dark:bg-neutral-900 md:p-10`}
            >
              {activeTab === 'profile' && (
                <div
                  ref={(el) => {
                    if (el) {
                      const form = el.querySelector('form');
                      // @ts-ignore - Asignación directa a ref.current es válida aquí
                      formRef.current = form;
                    }
                  }}
                >
                  <UpdateProfileInformationForm
                    mustVerifyEmail={mustVerifyEmail}
                    user={user}
                    status={status}
                  />
                </div>
              )}

              {activeTab === 'theme' && (
                <div>
                  <UpdateThemeForm user={user} workspace={currentWorkspace} />
                </div>
              )}

              {activeTab === 'password' && user.provider === null && (
                <div>
                  <UpdatePasswordForm />
                </div>
              )}

              {activeTab === 'subscription' && (
                <div>
                  <SubscriptionSection
                    subscription={subscription}
                    usage={usage}
                    currentWorkspace={currentWorkspace}
                  />
                </div>
              )}

              {activeTab === 'onboarding' && (
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
