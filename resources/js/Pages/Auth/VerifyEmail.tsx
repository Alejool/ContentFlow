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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <Head title="Email Verification" />

      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Mail className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {t("verification.banner.title")}
            </h1>
            <p className="text-purple-100">
              {t("verification.banner.message").split("?")[0]}?
            </p>
          </div>

          {/* Body */}
          <div className="p-8">
            <div className="mb-6 text-gray-600 text-center">
              <p className="mb-4">{t("verification.banner.message")}</p>
              <p>
                If you didn't receive the email, we will gladly send you
                another.
              </p>
            </div>

            {status === "verification-link-sent" && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Check className="w-5 h-5 text-green-600" />
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
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5" />
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
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Log Out
              </Link>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Lock className="w-4 h-4" />
              <span>Your information is secure with us</span>
            </div>
          </div>
        </div>

        {/* Help text */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Need help?{" "}
          <a
            href="mailto:support@example.com"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
