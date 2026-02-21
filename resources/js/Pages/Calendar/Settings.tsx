import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ExternalCalendarSettings from '@/Components/Calendar/ExternalCalendarSettings';
import { toast } from 'react-hot-toast';

export default function CalendarSettings() {
  const { t } = useTranslation();

  useEffect(() => {
    // Check for success/error messages in URL
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    const provider = params.get('provider');
    const message = params.get('message');

    if (success === 'connected') {
      toast.success(
        t('calendar.external.connectionSuccess', {
          provider: provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : 'Calendar',
        })
      );
      // Clean URL
      window.history.replaceState({}, '', '/calendar/settings');
    } else if (error) {
      const errorMessages: Record<string, string> = {
        invalid_state: t('calendar.external.errors.invalidState'),
        expired_state: t('calendar.external.errors.expiredState'),
        provider_mismatch: t('calendar.external.errors.providerMismatch'),
        no_code: t('calendar.external.errors.noCode'),
        connection_failed: message || t('calendar.external.errors.connectionFailed'),
      };
      toast.error(errorMessages[error] || t('calendar.external.errors.unknown'));
      // Clean URL
      window.history.replaceState({}, '', '/calendar/settings');
    }
  }, [t]);

  return (
    <AuthenticatedLayout>
      <Head title={t('calendar.external.settings')} />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {t('calendar.external.title')}
              </h2>
              <ExternalCalendarSettings />
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
