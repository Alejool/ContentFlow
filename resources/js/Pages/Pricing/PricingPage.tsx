import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Check, ArrowRight, Infinity, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PricingPlansSection from '@/Components/Pricing/PricingPlansSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';

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
}

export default function PricingPage({ auth, plans, currentPlan }: Props) {
  const { t } = useTranslation();

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t('pricing.title')} />

      <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900 py-16 overflow-hidden dark:text-white">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Pricing Plans Section */}
          <PricingPlansSection
            plans={plans}
            currentPlan={currentPlan}
            isAuthenticated={!!auth.user}
            showBillingToggle={true}
            showHeader={true}
            variant="default"
          />

          {/* Trust indicators */}
          <div className="mt-20">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-gray-200 dark:border-neutral-800 p-8">
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                <div className="flex items-center gap-3 group">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:scale-110 transition-transform">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {t('pricing.noCreditCard', 'Sin tarjeta de crédito')}
                  </span>
                </div>
                <div className="flex items-center gap-3 group">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                    <Infinity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {t('pricing.cancelAnytime', 'Cancela cuando quieras')}
                  </span>
                </div>
                <div className="flex items-center gap-3 group">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:scale-110 transition-transform">
                    <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {t('pricing.support247', 'Soporte 24/7')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <Card className="">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                  {t('pricing.faq', '¿Tienes preguntas?')}
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
                  {t('pricing.faqSubtitle', 'Estamos aquí para ayudarte')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pb-8">
                <a 
                  href="mailto:support@contentflow.com" 
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 group"
                >
                  <span>support@contentflow.com</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
