import type { Publication } from '@/types/Publication';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PlatformProgressProps {
  publication: Publication;
  onCancelPlatform?: (publicationId: number, platformId: number, platformName: string) => void;
}

export function PlatformProgress({ publication, onCancelPlatform }: PlatformProgressProps) {
  const { t } = useTranslation();
  const platformSummary = (publication as any).platform_status_summary;

  if (!platformSummary) {
    return (
      <div className="mt-2 space-y-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-700">
          <div className="bg-primary/50 h-full w-full animate-pulse" />
        </div>
        <span className="block text-center text-[10px] italic text-gray-500 dark:text-neutral-400">
          {publication.status === 'publishing'
            ? t('publications.gallery.sendingToSocial', {
                defaultValue: 'Iniciando envío...',
              })
            : publication.status === 'retrying'
              ? t('publications.gallery.retrying', {
                  defaultValue: 'Reintentando...',
                })
              : publication.status === 'failed'
                ? 'Error en el procesamiento'
                : t('publications.gallery.processing', {
                    defaultValue: 'Procesando...',
                  })}
        </span>
      </div>
    );
  }

  const platforms = Object.values(platformSummary).filter((platform: any) => {
    const logDate = platform.published_at
      ? new Date(platform.published_at)
      : new Date(publication.updated_at || '');
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

    return (
      platform.status === 'publishing' ||
      platform.status === 'retrying' ||
      platform.status === 'pending' ||
      logDate > fiveMinsAgo
    );
  });

  return (
    <div className="mt-2 space-y-2">
      {platforms.map((platform: any) => {
        const isDone = platform.status === 'published';
        const isFailed = platform.status === 'failed';
        const isPublishing =
          platform.status === 'publishing' ||
          platform.status === 'pending' ||
          platform.status === 'retrying';
        const progress = isDone ? 100 : isFailed ? 100 : isPublishing ? 50 : 0;
        const canCancel = isPublishing && onCancelPlatform;

        return (
          <div
            key={`${platform.platform}-${platform.id || platform.platform_id}`}
            className="group rounded-lg border border-gray-100 bg-gray-50/80 p-2 dark:border-neutral-600/50 dark:bg-neutral-700/40"
          >
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPublishing ? (
                  <Loader2 className="text-primary h-3 w-3 animate-spin" />
                ) : isDone ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                )}
                <span className="text-[11px] font-semibold capitalize text-neutral-800 dark:text-neutral-200">
                  {platform.platform}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {canCancel && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancelPlatform(
                        publication.id,
                        platform.social_account_id,
                        platform.platform,
                      );
                    }}
                    className="text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                    title={t('common.cancel') || 'Cancelar'}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                    isDone
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                      : isFailed
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                        : 'bg-primary/10 text-primary dark:bg-primary/20'
                  }`}
                >
                  {isDone
                    ? t('common.sent') || 'Enviado'
                    : isFailed
                      ? t('publications.modal.publish.failed') || 'Falló'
                      : t('common.sending') || 'Enviando'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-600">
                <div
                  className={`h-full transition-all duration-500 ${
                    isFailed ? 'bg-red-500' : isDone ? 'bg-green-500' : 'bg-primary'
                  } ${isPublishing ? 'animate-pulse' : ''}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="w-10 text-right text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">
                {isDone || isFailed ? '100%' : '...'}
              </span>
            </div>
            {isFailed && platform.error && (
              <div className="mt-1.5 rounded bg-red-50 px-2 py-1 text-[10px] text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {platform.error}
              </div>
            )}
            {isDone && platform.url && (
              <a
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 flex items-center gap-1 text-[10px] text-primary-500 hover:underline"
              >
                {t('publications.viewPost', {
                  defaultValue: 'Ver publicación',
                })}
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
