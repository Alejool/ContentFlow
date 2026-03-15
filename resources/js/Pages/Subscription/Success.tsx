import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import Button from "@/Components/common/Modern/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

interface Props {
  auth: any;
  plan: string;
  amount: number;
  currency: string;
}

export default function Success({ auth, plan, amount, currency }: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    // Dispatch event to notify all components that subscription has changed
    window.dispatchEvent(new CustomEvent("subscription-plan-changed"));

    // Force reload of shared data after a short delay to ensure backend has processed
    setTimeout(() => {
      router.reload({ only: ["auth", "onboarding"] });
    }, 1000);
  }, []);

  const planNames: Record<string, string> = {
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t("subscription.success.title")} />

      <div className="min-h-screen to-primary-50/30 py-16 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900 dark:text-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Success Icon */}
          <div className="mb-8 text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>

            <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
              {t("subscription.success.heading")}
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t("subscription.success.message")}
            </p>
          </div>

          {/* Payment Details Card */}
          <Card className="mb-8 border-2 border-green-200 dark:border-green-800">
            <CardHeader className="bg-gradient-to-r from-green-50 to-primary-50 dark:from-green-900/20 dark:to-primary-900/20">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                {t("subscription.success.detailsTitle")}
              </CardTitle>
              <CardDescription>{t("subscription.success.detailsDescription")}</CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 py-3 dark:border-neutral-800">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t("subscription.success.selectedPlan")}
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {planNames[plan] || plan}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-gray-200 py-3 dark:border-neutral-800">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t("subscription.success.amountPaid")}
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currency} ${amount.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t("subscription.success.status")}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    {t("subscription.success.active")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t("subscription.success.nextStepsTitle")}</CardTitle>
              <CardDescription>{t("subscription.success.nextStepsDescription")}</CardDescription>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("subscription.success.step1")}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("subscription.success.step2")}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("subscription.success.step3")}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("subscription.success.step4")}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:from-primary-600 hover:to-primary-700 sm:w-auto"
              >
                <span className="flex items-center gap-2">
                  {t("subscription.success.goToDashboard")}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </Link>

            <Link href="/subscription/billing">
              <Button
                size="lg"
                variant="secondary"
                buttonStyle="outline"
                className="w-full sm:w-auto"
              >
                {t("subscription.success.viewBilling")}
              </Button>
            </Link>
          </div>

          {/* Support Info */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("subscription.success.needHelp")}{" "}
              <a
                href="mailto:support@contentflow.com"
                className="font-medium text-primary-600 hover:underline dark:text-primary-400"
              >
                support@contentflow.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
