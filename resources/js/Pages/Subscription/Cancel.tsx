import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { XCircle, ArrowLeft, HelpCircle } from "lucide-react";
import Button from "@/Components/common/Modern/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { useTranslation } from "react-i18next";

interface Props {
  auth: any;
}

export default function Cancel({ auth }: Props) {
  const { t } = useTranslation();

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t("subscription.cancel.title")} />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-16 text-black dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900 dark:text-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Cancel Icon */}
          <div className="mb-8 text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800">
              <XCircle className="h-12 w-12 text-gray-600 dark:text-gray-400" />
            </div>

            <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
              {t("subscription.cancel.heading")}
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t("subscription.cancel.message")}
            </p>
          </div>

          {/* Info Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t("subscription.cancel.whatHappened")}</CardTitle>
              <CardDescription>{t("subscription.cancel.processWasCanceled")}</CardDescription>
            </CardHeader>

            <CardContent>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                {t("subscription.cancel.noChargeDescription")}
              </p>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex gap-3">
                  <HelpCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="mb-1 font-semibold text-blue-900 dark:text-blue-300">
                      {t("subscription.cancel.hadProblem")}
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      {t("subscription.cancel.problemDescription")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t("subscription.cancel.whatCanYouDo")}</CardTitle>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                      1
                    </span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("subscription.cancel.option1")}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                      2
                    </span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("subscription.cancel.option2")}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                      3
                    </span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("subscription.cancel.option3")}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/pricing">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:from-primary-600 hover:to-primary-700 sm:w-auto"
              >
                <span className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {t("subscription.cancel.viewPlans")}
                </span>
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button size="lg" variant="ghost" className="w-full sm:w-auto">
                {t("subscription.cancel.backToDashboard")}
              </Button>
            </Link>
          </div>

          {/* Support Info */}
          <div className="mt-12 text-center">
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              {t("subscription.cancel.needHelp")}
            </p>
            <a
              href="mailto:support@contentflow.com"
              className="font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              {t("subscription.cancel.contactSupport")}
            </a>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
