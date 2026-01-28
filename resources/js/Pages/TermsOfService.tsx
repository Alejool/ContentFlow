import { Head } from "@inertiajs/react";
import { ArrowLeft, FileText } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

export default function TermsOfService() {
  const { t } = useTranslation();
  const date = "15/01/2026";

  return (
    <>
      <Head title={`${t("legal.termsOfService.title")} - ContentFlow`} />

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

          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <FileText className="w-10 h-10 text-primary-600 dark:text-primary-400" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-4xl">
                {t("legal.termsOfService.title")}
              </h1>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {t("legal.termsOfService.subtitle")}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("legal.common.lastUpdated", { date })}
              </p>
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
              <Section
                title={t("legal.termsOfService.sections.acceptance.title")}
              >
                <p>{t("legal.termsOfService.sections.acceptance.content")}</p>
              </Section>

              <Section
                title={t("legal.termsOfService.sections.accounts.title")}
              >
                <p>{t("legal.termsOfService.sections.accounts.content.0")}</p>
                <p>{t("legal.termsOfService.sections.accounts.content.1")}</p>
              </Section>

              <Section title={t("legal.termsOfService.sections.use.title")}>
                <p>{t("legal.termsOfService.sections.use.content")}</p>
                <ul className="list-disc pl-5 space-y-1">
                  {(
                    t("legal.termsOfService.sections.use.items", {
                      returnObjects: true,
                    }) as string[]
                  ).map((item, index) => (
                    <li key={index}>
                      <Trans
                        i18nKey={`legal.termsOfService.sections.use.items.${index}`}
                      />
                    </li>
                  ))}
                </ul>
              </Section>

              <Section
                title={t(
                  "legal.termsOfService.sections.intellectualProperty.title",
                )}
              >
                <p>
                  {t(
                    "legal.termsOfService.sections.intellectualProperty.content",
                  )}
                </p>
              </Section>

              <Section title={t("legal.termsOfService.sections.links.title")}>
                <p>{t("legal.termsOfService.sections.links.content")}</p>
              </Section>

              <Section
                title={t("legal.termsOfService.sections.termination.title")}
              >
                <p>{t("legal.termsOfService.sections.termination.content")}</p>
              </Section>

              <Section
                title={t("legal.termsOfService.sections.limitation.title")}
              >
                <p>{t("legal.termsOfService.sections.limitation.content")}</p>
              </Section>

              <Section title={t("legal.termsOfService.sections.changes.title")}>
                <p>{t("legal.termsOfService.sections.changes.content")}</p>
              </Section>

              <Section title={t("legal.termsOfService.sections.contact.title")}>
                <p>{t("legal.termsOfService.sections.contact.content")}</p>
                <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="font-medium">{t("legal.common.team")}</p>
                  <p>
                    Email:{" "}
                    <a
                      href="mailto:legal@contentflow.app"
                      className="text-primary-600 hover:text-primary-500"
                    >
                      legal@contentflow.app
                    </a>
                  </p>
                </div>
              </Section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-gray-100 dark:border-gray-800 pb-8 last:border-0 last:pb-0 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {title}
      </h2>
      <div className="space-y-4 leading-relaxed">{children}</div>
    </section>
  );
}
