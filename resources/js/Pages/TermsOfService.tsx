import { Head } from '@inertiajs/react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

export default function TermsOfService() {
  const { t } = useTranslation();
  const date = '15/01/2026';

  return (
    <>
      <Head title={`${t('legal.termsOfService.title')} - ContentFlow`} />

      <div className="min-h-screen bg-white px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('legal.common.back')}
            </button>
          </div>

          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-4 text-center">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary-100 p-3 dark:bg-primary-900/30">
                <FileText className="h-10 w-10 text-primary-600 dark:text-primary-400" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {t('legal.termsOfService.title')}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-xl text-gray-600 dark:text-gray-300">
                {t('legal.termsOfService.subtitle')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('legal.common.lastUpdated', { date })}
              </p>
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
              <Section title={t('legal.termsOfService.sections.acceptance.title')}>
                <p>{t('legal.termsOfService.sections.acceptance.content')}</p>
              </Section>

              <Section title={t('legal.termsOfService.sections.accounts.title')}>
                <p>{t('legal.termsOfService.sections.accounts.content.0')}</p>
                <p>{t('legal.termsOfService.sections.accounts.content.1')}</p>
              </Section>

              <Section title={t('legal.termsOfService.sections.use.title')}>
                <p>{t('legal.termsOfService.sections.use.content')}</p>
                <ul className="list-disc space-y-1 pl-5">
                  {(
                    t('legal.termsOfService.sections.use.items', {
                      returnObjects: true,
                    }) as string[]
                  ).map((item, index) => (
                    <li key={index}>
                      <Trans i18nKey={`legal.termsOfService.sections.use.items.${index}`} />
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title={t('legal.termsOfService.sections.intellectualProperty.title')}>
                <p>{t('legal.termsOfService.sections.intellectualProperty.content')}</p>
              </Section>

              <Section title={t('legal.termsOfService.sections.links.title')}>
                <p>{t('legal.termsOfService.sections.links.content')}</p>
              </Section>

              <Section title={t('legal.termsOfService.sections.termination.title')}>
                <p>{t('legal.termsOfService.sections.termination.content')}</p>
              </Section>

              <Section title={t('legal.termsOfService.sections.limitation.title')}>
                <p>{t('legal.termsOfService.sections.limitation.content')}</p>
              </Section>

              <Section title={t('legal.termsOfService.sections.changes.title')}>
                <p>{t('legal.termsOfService.sections.changes.content')}</p>
              </Section>

              <Section title={t('legal.termsOfService.sections.contact.title')}>
                <p>{t('legal.termsOfService.sections.contact.content')}</p>
                <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="font-medium">{t('legal.common.team')}</p>
                  <p>
                    Email:{' '}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 border-b border-gray-100 pb-8 last:border-0 last:pb-0 dark:border-gray-800">
      <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
      <div className="space-y-4 leading-relaxed">{children}</div>
    </section>
  );
}
