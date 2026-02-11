import { Head } from "@inertiajs/react";
import { ArrowLeft, Mail } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

export default function Contact() {
  const { t } = useTranslation();

  return (
    <>
      <Head title={`${t("legal.contact.title")} - ContentFlow`} />

      <div className="min-h-screen bg-white dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("legal.common.back")}
            </button>
          </div>

          <div className="space-y-12">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <Mail className="w-10 h-10 text-primary-600 dark:text-primary-400" />
              </div>

              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-4xl">
                {t("legal.contact.title")}
              </h1>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {t("legal.contact.subtitle")}
              </p>
            </div>

            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {t("legal.contact.support.title")}
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  <Trans i18nKey="legal.contact.support.description" />
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                  {t("legal.contact.support.note")}
                </p>
                <div className="inline-block bg-white dark:bg-gray-900 px-6 py-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-transform hover:scale-105">
                  <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {t("legal.contact.support.writeTo")}
                  </span>
                  <a
                    href="mailto:soporte@contentflow.app"
                    className="text-2xl font-bold text-primary-600 dark:text-primary-400 hover:underline transition-all"
                  >
                    soporte@contentflow.app
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-10 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {t("legal.contact.footer")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
