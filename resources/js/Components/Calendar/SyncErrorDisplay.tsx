import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SyncError } from '@/types/errors';

interface SyncErrorDisplayProps {
  error: SyncError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const SyncErrorDisplay: React.FC<SyncErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
}) => {
  const { t } = useTranslation();

  const getProviderName = (provider: 'google' | 'outlook') => {
    return provider === 'google' ? 'Google Calendar' : 'Outlook Calendar';
  };

  const getErrorMessage = (error: SyncError) => {
    switch (error.code) {
      case 'SYNC_FAILED':
        return t(
          'calendar.sync.error.failed',
          `Failed to sync with ${getProviderName(error.provider)}`
        );
      case 'TOKEN_EXPIRED':
        return t(
          'calendar.sync.error.token_expired',
          `Your ${getProviderName(error.provider)} connection has expired. Please reconnect.`
        );
      case 'PROVIDER_UNAVAILABLE':
        return t(
          'calendar.sync.error.unavailable',
          `${getProviderName(error.provider)} is currently unavailable. Please try again later.`
        );
      default:
        return error.message || t('calendar.sync.error.unknown', 'An unknown sync error occurred');
    }
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {t('calendar.sync.error.title', 'Synchronization Error')}
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {getErrorMessage(error)}
            </p>
            
            {error.details && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                {error.details}
              </p>
            )}
          </div>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors"
              aria-label={t('calendar.sync.error.dismiss', 'Dismiss error')}
            >
              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          )}
        </div>

        {error.retryable && onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 rounded transition-colors"
            aria-label={t('calendar.sync.error.retry', 'Retry synchronization')}
          >
            <RefreshCw className="w-4 h-4" />
            {t('calendar.sync.error.retry_button', 'Retry')}
          </button>
        )}

        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
          {t('calendar.sync.error.local_saved', 'Your changes have been saved locally.')}
        </p>
      </div>
    </div>
  );
};

interface SyncErrorListProps {
  errors: SyncError[];
  onRetry?: (error: SyncError) => void;
  onDismiss?: (error: SyncError) => void;
  onDismissAll?: () => void;
  className?: string;
}

export const SyncErrorList: React.FC<SyncErrorListProps> = ({
  errors,
  onRetry,
  onDismiss,
  onDismissAll,
  className = '',
}) => {
  const { t } = useTranslation();

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {errors.length > 1 && onDismissAll && (
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('calendar.sync.error.multiple', `${errors.length} synchronization errors`)}
          </p>
          <button
            onClick={onDismissAll}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline"
          >
            {t('calendar.sync.error.dismiss_all', 'Dismiss all')}
          </button>
        </div>
      )}

      {errors.map((error, index) => (
        <SyncErrorDisplay
          key={`${error.provider}-${error.timestamp.getTime()}-${index}`}
          error={error}
          onRetry={onRetry ? () => onRetry(error) : undefined}
          onDismiss={onDismiss ? () => onDismiss(error) : undefined}
        />
      ))}
    </div>
  );
};
