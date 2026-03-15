import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { XCircle, ArrowLeft, HelpCircle } from "lucide-react";
import Button from "@/Components/common/Modern/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { useTranslation } from "react-i18next";

interface Props {
  auth: any;
}

export default function Cancel({ auth }: Props) {
  const { t } = useTranslation();

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t("subscription.cancel.title")} />

      <div className="min-h-screen text-black dark:text-white bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Cancel Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-neutral-800 rounded-full mb-6">
              <XCircle className="h-12 w-12 text-gray-600 dark:text-gray-400" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
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
              <CardDescription>
                {t("subscription.cancel.processWasCanceled")}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t("subscription.cancel.noChargeDescription")}
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
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
                  <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-600 dark:text-primary-400 text-sm font-semibold">
                      1
                    </span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("subscription.cancel.option1")}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-600 dark:text-primary-400 text-sm font-semibold">
                      2
                    </span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("subscription.cancel.option2")}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-600 dark:text-primary-400 text-sm font-semibold">
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg"
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
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t("subscription.cancel.needHelp")}
            </p>
            <a
              href="mailto:support@contentflow.com"
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              {t("subscription.cancel.contactSupport")}
            </a>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
