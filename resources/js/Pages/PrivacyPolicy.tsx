import { Head } from "@inertiajs/react";
import { ArrowLeft, Shield } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  // In a real app, this date might come from a processing file or config, but we keep it static for now
  // passing it as a variable to the translation
  const date = "15/01/2026";

  return (
    <>
      <Head title={`${t("legal.privacyPolicy.title")} - ContentFlow`} />

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
            {/* Header Section without separate background block */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <Shield className="w-10 h-10 text-primary-600 dark:text-primary-400" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-4xl">
                {t("legal.privacyPolicy.title")}
              </h1>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {t("legal.privacyPolicy.subtitle")}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("legal.common.lastUpdated", { date })}
              </p>
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
              <Section title={t("legal.privacyPolicy.sections.intro.title")}>
                <p>{t("legal.privacyPolicy.sections.intro.content.0")}</p>
                <p>{t("legal.privacyPolicy.sections.intro.content.1")}</p>
              </Section>

              <Section
                title={t("legal.privacyPolicy.sections.infoCollected.title")}
              >
                <p>
                  {t("legal.privacyPolicy.sections.infoCollected.subtitle")}
                </p>

                <h4 className="font-semibold text-gray-900 dark:text-white mt-4 mb-2">
                  {t(
                    "legal.privacyPolicy.sections.infoCollected.provided.title",
                  )}
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(
                    t(
                      "legal.privacyPolicy.sections.infoCollected.provided.items",
                      { returnObjects: true },
                    ) as string[]
                  ).map((item, index) => (
                    <li key={index}>
                      <Trans
                        i18nKey={`legal.privacyPolicy.sections.infoCollected.provided.items.${index}`}
                      />
                    </li>
                  ))}
                </ul>

                <h4 className="font-semibold text-gray-900 dark:text-white mt-4 mb-2">
                  {t("legal.privacyPolicy.sections.infoCollected.auto.title")}
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {(
                    t("legal.privacyPolicy.sections.infoCollected.auto.items", {
                      returnObjects: true,
                    }) as string[]
                  ).map((item, index) => (
                    <li key={index}>
                      <Trans
                        i18nKey={`legal.privacyPolicy.sections.infoCollected.auto.items.${index}`}
                      />
                    </li>
                  ))}
                </ul>

                <h4 className="font-semibold text-gray-900 dark:text-white mt-4 mb-2">
                  {t(
                    "legal.privacyPolicy.sections.infoCollected.thirdParty.title",
                  )}
                </h4>
                <p>
                  {t(
                    "legal.privacyPolicy.sections.infoCollected.thirdParty.description",
                  )}
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {(
                    t(
                      "legal.privacyPolicy.sections.infoCollected.thirdParty.items",
                      { returnObjects: true },
                    ) as string[]
                  ).map((item, index) => (
                    <li key={index}>
                      <Trans
                        i18nKey={`legal.privacyPolicy.sections.infoCollected.thirdParty.items.${index}`}
                      />
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title={t("legal.privacyPolicy.sections.usage.title")}>
                <p>{t("legal.privacyPolicy.sections.usage.subtitle")}</p>
                <ul className="list-disc pl-5 space-y-1">
                  {(
                    t("legal.privacyPolicy.sections.usage.items", {
                      returnObjects: true,
                    }) as string[]
                  ).map((item, index) => (
                    <li key={index}>
                      <Trans
                        i18nKey={`legal.privacyPolicy.sections.usage.items.${index}`}
                      />
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title={t("legal.privacyPolicy.sections.sharing.title")}>
                <p>{t("legal.privacyPolicy.sections.sharing.subtitle")}</p>
                <ul className="list-disc pl-5 space-y-1">
                  {(
                    t("legal.privacyPolicy.sections.sharing.items", {
                      returnObjects: true,
                    }) as string[]
                  ).map((item, index) => (
                    <li key={index}>
                      <Trans
                        i18nKey={`legal.privacyPolicy.sections.sharing.items.${index}`}
                      />
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title={t("legal.privacyPolicy.sections.security.title")}>
                <p>{t("legal.privacyPolicy.sections.security.content")}</p>
              </Section>

              <Section title={t("legal.privacyPolicy.sections.rights.title")}>
                <p>{t("legal.privacyPolicy.sections.rights.subtitle")}</p>
                <ul className="list-disc pl-5 space-y-1">
                  {(
                    t("legal.privacyPolicy.sections.rights.items", {
                      returnObjects: true,
                    }) as string[]
                  ).map((item, index) => (
                    <li key={index}>
                      <Trans
                        i18nKey={`legal.privacyPolicy.sections.rights.items.${index}`}
                      />
                    </li>
                  ))}
                </ul>
                <p className="mt-2">
                  {t("legal.privacyPolicy.sections.rights.contactNote")}
                </p>
              </Section>

              <Section title={t("legal.privacyPolicy.sections.kids.title")}>
                <p>{t("legal.privacyPolicy.sections.kids.content")}</p>
              </Section>

              <Section title={t("legal.privacyPolicy.sections.changes.title")}>
                <p>{t("legal.privacyPolicy.sections.changes.content")}</p>
              </Section>

              <Section title={t("legal.privacyPolicy.sections.contact.title")}>
                <p>{t("legal.privacyPolicy.sections.contact.content")}</p>
                <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="font-medium">{t("legal.common.team")}</p>
                  <p>
                    Email:{" "}
                    <a
                      href="mailto:soporte@contentflow.app"
                      className="text-primary-600 hover:text-primary-500"
                    >
                      soporte@contentflow.app
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
