import { Head } from '@inertiajs/react';
import { ArrowLeft, Mail } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

export default function Contact() {
  const { t } = useTranslation();

  return (
    <>
      <Head title={`${t('legal.contact.title')} - Intellipost`} />

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

          <div className="space-y-12">
            {/* Header */}
            <div className="space-y-4 text-center">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary-100 p-3 dark:bg-primary-900/30">
                <Mail className="h-10 w-10 text-primary-600 dark:text-primary-400" />
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {t('legal.contact.title')}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-xl text-gray-600 dark:text-gray-300">
                {t('legal.contact.subtitle')}
              </p>
            </div>

            <div className="mx-auto max-w-2xl text-center">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-8 dark:border-gray-800 dark:bg-gray-800/50">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                  <Mail className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                  {t('legal.contact.support.title')}
                </h3>
                <p className="mb-6 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                  <Trans i18nKey="legal.contact.support.description" />
                </p>
                <p className="mb-8 text-gray-600 dark:text-gray-300">
                  {t('legal.contact.support.note')}
                </p>
                <div className="inline-block rounded-lg border border-gray-200 bg-white px-6 py-4 shadow-sm transition-transform hover:scale-105 dark:border-gray-700 dark:bg-gray-900">
                  <span className="mb-1 block text-sm text-gray-500 dark:text-gray-400">
                    {t('legal.contact.support.writeTo')}
                  </span>
                  <a
                    href="mailto:soporte@Intellipost.app"
                    className="text-2xl font-bold text-primary-600 transition-all hover:underline dark:text-primary-400"
                  >
                    soporte@Intellipost.app
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-10 text-center dark:border-gray-800">
              <p className="text-gray-500 dark:text-gray-400">{t('legal.contact.footer')}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
