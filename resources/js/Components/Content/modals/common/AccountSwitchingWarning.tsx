import { AlertTriangle, Info } from 'lucide-react';
import { formatDateTimeString } from '@/Utils/dateHelpers';

interface PlatformStatus {
  platform: string;
  status: string;
  published_at: string | null;
  error: string | null;
  url: string | null;
  account_name: string;
  account_id: string | null;
  is_current_account: boolean;
  can_unpublish: boolean;
}

interface AccountSwitchingWarningProps {
  platformStatus: Record<number, PlatformStatus>;
  currentAccountId: number;
  platform: string;
  t: any;
}

/**
 * Component to display warnings when content is published on a different account
 * than the currently connected one.
 *
 * This addresses the issue where users switch between accounts of the same platform
 * and need to understand which account has the published content.
 */
export default function AccountSwitchingWarning({
  platformStatus,
  currentAccountId,
  platform,
  t,
}: AccountSwitchingWarningProps) {
  // Find all published statuses for this platform
  const platformStatuses = Object.entries(platformStatus).filter(
    ([_, status]) => status.platform === platform && status.status === 'published',
  );

  if (platformStatuses.length === 0) {
    return null;
  }

  // Check if any published content is on a different account
  const otherAccountPublications = platformStatuses.filter(
    ([accountId, _]) => parseInt(accountId) !== currentAccountId,
  );

  const currentAccountPublication = platformStatuses.find(
    ([accountId, _]) => parseInt(accountId) === currentAccountId,
  );

  return (
    <div className="space-y-3">
      {/* Warning for publications on other accounts */}
      {otherAccountPublications.length > 0 && (
        <div className="rounded-r-lg border-l-4 border-amber-500 bg-amber-50 p-4 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <h4 className="mb-2 text-sm font-bold text-amber-900 dark:text-amber-100">
                {t('publish.publishedOnDifferentAccount') || 'Publicado en otra cuenta'}
              </h4>
              <div className="space-y-2">
                {otherAccountPublications.map(([accountId, status]) => (
                  <div key={accountId} className="text-xs text-amber-800 dark:text-amber-200">
                    <p className="font-semibold">
                      {t('publish.accountName') || 'Cuenta'}:{' '}
                      <span className="rounded bg-amber-100 px-2 py-0.5 font-mono dark:bg-amber-900/40">
                        {status.account_name}
                      </span>
                    </p>
                    {status.published_at && (
                      <p className="mt-1">
                        {t('publish.publishedAt') || 'Publicado el'}:{' '}
                        {formatDateTimeString(status.published_at)}
                      </p>
                    )}
                    {status.url && (
                      <a
                        href={status.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-amber-700 hover:underline dark:text-amber-300"
                      >
                        {t('publish.viewPost') || 'Ver publicación'} →
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300">
                {t('publish.cannotUnpublishDifferentAccount') ||
                  'No puedes despublicar contenido de una cuenta diferente. Reconecta la cuenta original para gestionar estas publicaciones.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info for current account publication */}
      {currentAccountPublication && (
        <div className="rounded-r-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <h4 className="mb-1 text-sm font-bold text-blue-900 dark:text-blue-100">
                {t('publish.publishedOnCurrentAccount') || 'Publicado en cuenta actual'}
              </h4>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                {t('publish.accountName') || 'Cuenta'}:{' '}
                <span className="rounded bg-blue-100 px-2 py-0.5 font-mono dark:bg-blue-900/40">
                  {currentAccountPublication[1].account_name}
                </span>
              </p>
              {currentAccountPublication[1].can_unpublish && (
                <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                  {t('publish.canUnpublish') ||
                    'Puedes despublicar este contenido desde esta cuenta.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info about publishing to multiple accounts */}
      {otherAccountPublications.length > 0 && !currentAccountPublication && (
        <div className="rounded-r-lg border-l-4 border-green-500 bg-green-50 p-4 dark:bg-green-900/20">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <h4 className="mb-1 text-sm font-bold text-green-900 dark:text-green-100">
                {t('publish.canPublishToNewAccount') || 'Puedes publicar en esta cuenta'}
              </h4>
              <p className="text-xs text-green-800 dark:text-green-200">
                {t('publish.multipleAccountsAllowed') ||
                  'Aunque el contenido ya está publicado en otra cuenta, puedes publicarlo también en la cuenta actual. Cada cuenta mantendrá su propia publicación independiente.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
