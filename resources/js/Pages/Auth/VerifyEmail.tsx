import { Head, Link, useForm } from "@inertiajs/react";
import { Check, Loader2, Lock, Mail } from "lucide-react";
import { FormEventHandler } from "react";
import { useTranslation } from "react-i18next";

interface VerifyEmailProps {
  status?: string;
}

export default function VerifyEmail({ status }: VerifyEmailProps) {
  const { t } = useTranslation();
  const { post, processing } = useForm({});

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route("verification.send"));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4">
      <Head title={t("verification.title")} />

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow-xl">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
              <Mail className="h-10 w-10 text-purple-600" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-white">{t("verification.banner.title")}</h1>
            <p className="text-purple-100">{t("verification.banner.message").split("?")[0]}?</p>
          </div>

          {/* Body */}
          <div className="p-8">
            <div className="mb-6 text-center text-gray-600">
              <p className="mb-4">{t("verification.banner.message")}</p>
              <p>{t("verification.didNotReceive")}</p>
            </div>

            {status === "verification-link-sent" && (
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-green-800">
                    {t("verification.banner.successMessage")}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <button
                type="submit"
                disabled={processing}
                className="w-full transform rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t("verification.banner.sending")}
                  </span>
                ) : (
                  t("verification.banner.resendButton")
                )}
              </button>

              <Link
                href={route("logout")}
                method="post"
                as="button"
                className="w-full rounded-lg bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-200"
              >
                {t("verification.logout")}
              </Link>
            </form>
          </div>

          <div className="border-t border-gray-100 bg-gray-50 px-8 py-6">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Lock className="h-4 w-4" />
              <span>{t("verification.security")}</span>
            </div>
          </div>
        </div>

        {/* Help text */}
        <p className="mt-6 text-center text-sm text-gray-600">
          {t("verification.needHelp")}{" "}
          <a
            href="mailto:support@example.com"
            className="font-medium text-purple-600 hover:text-purple-700"
          >
            {t("verification.contactSupport")}
          </a>
        </p>
      </div>
    </div>
  );
}
