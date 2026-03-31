import PricingPlansSection from '@/Components/Pricing/PricingPlansSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  limits: {
    publications_per_month: number;
    storage_gb: number;
    social_accounts: number;
    team_members: number;
  };
  popular?: boolean;
  enabled?: boolean;
  trial_days?: number;
  requires_stripe?: boolean;
}

interface Props {
  auth: any;
  plans: Plan[];
  currentPlan?: string;
  workspaceId?: number;
  systemFeatures?: {
    ai?: boolean;
    analytics?: boolean;
    reels?: boolean;
    approval_workflows?: boolean;
    calendar_sync?: boolean;
    bulk_operations?: boolean;
    white_label?: boolean;
  };
}

export default function PricingPage({
  auth,
  plans,
  currentPlan,
  workspaceId,
  systemFeatures = {},
}: Props) {
  const { t } = useTranslation();

  // Determinar si el usuario es owner del workspace actual
  const currentWorkspace = auth?.current_workspace;
  const isOwner =
    currentWorkspace &&
    (Number(currentWorkspace.created_by) === Number(auth.user?.id) ||
      currentWorkspace.user_role_slug === 'owner');

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t('pricing.title')} />

      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-orange-50/30 py-16 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900 dark:text-white">
        {/* Decorative background elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Pricing Plans Section */}
          <PricingPlansSection
            plans={plans}
            currentPlan={currentPlan}
            isAuthenticated={!!auth.user}
            showBillingToggle={true}
            showHeader={true}
            variant="default"
            isOwner={isOwner}
            systemFeatures={systemFeatures}
          />
          <div className="mt-12">
            <Card className="">
              <CardHeader className="pb-6 text-center">
                <CardTitle className="mb-3 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
                  {t('pricing.faq', '¿Tienes preguntas?')}
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
                  {t('pricing.faqSubtitle', 'Estamos aquí para ayudarte')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-8 text-center">
                <a
                  href="mailto:support@Intellipost.com"
                  className="group inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:from-primary-600 hover:to-primary-700 hover:shadow-xl"
                >
                  <span>support@Intellipost.com</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
