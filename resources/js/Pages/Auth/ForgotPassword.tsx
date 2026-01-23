import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import GuestLayout from "@/Layouts/GuestLayout";
import { getErrorMessage } from "@/Utils/validation";
import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, CheckCircle2, Mail, Send } from "lucide-react";
import { FormEventHandler } from "react";
import { useTranslation } from "react-i18next";
interface ForgotPasswordProps {
  status?: string;
}

export default function ForgotPassword({ status }: ForgotPasswordProps) {
  const { data, setData, post, processing, errors } = useForm({
    email: "",
  });
  const { t } = useTranslation();

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route("password.email"));
  };

  return (
    <GuestLayout section="forgot-password">
      <Head title={t("auth.forgot-password.title")} />

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white ">
              {t("auth.forgot-password.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t("auth.forgot-password.enterEmail")}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {status && (
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{status}</p>
                </div>
              </div>
            )}

            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t("auth.forgot-password.description")}
              </p>
            </div>

            <div>
              <div className="relative">
                <Input
                  id="forgot_email"
                  type="email"
                  name="email"
                  label={t("auth.forgot-password.inputs.email")}
                  sizeType="lg"
                  value={data.email}
                  onChange={(e) => setData("email", e.target.value)}
                  placeholder={t("auth.forgot-password.placeholders.email")}
                  autoComplete="email"
                  required
                  autoFocus
                  icon={Mail}
                  error={getErrorMessage(errors?.email, t, "email")}
                />
              </div>
            </div>

            <Button
              type="submit"
              loading={processing}
              loadingText={t("auth.forgot-password.buttons.sending")}
              fullWidth
              icon={Send as any}
            >
              {t("auth.forgot-password.buttons.send")}
            </Button>

            <div className="pt-4">
              <div className="rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 ">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {t("auth.forgot-password.recomendations.receiveEmail")}
                </p>
                <ul className="space-y-1 text-sm list-disc px-2">
                  <li className="text-gray-500 dark:text-gray-500">
                    {t("auth.forgot-password.recomendations.1")}
                  </li>
                  <li className="text-gray-500 dark:text-gray-500">
                    {t("auth.forgot-password.recomendations.2")}
                  </li>
                  <li className="text-gray-500 dark:text-gray-500">
                    {t("auth.forgot-password.recomendations.3")}
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <Link
                href={route("login")}
                className="inline-flex items-center gap-2 text-sm text-primary-600
                                             hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300
                                             transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("auth.forgot-password.buttons.back")}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </GuestLayout>
  );
}
