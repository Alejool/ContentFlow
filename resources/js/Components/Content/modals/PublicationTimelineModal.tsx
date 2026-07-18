import { DynamicModal } from '@/Components/common/Modern/DynamicModal';
import type { PublishTimelineEntry } from '@/Hooks/Publications/usePublishTimeline';
import { usePublishTimeline } from '@/Hooks/Publications/usePublishTimeline';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PublicationTimelineModalProps {
  publicationId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, { icon: typeof CheckCircle2; className: string }> = {
  published: { icon: CheckCircle2, className: 'text-green-600 dark:text-green-400' },
  publishing: { icon: Loader2, className: 'animate-spin text-blue-600 dark:text-blue-400' },
  pending: { icon: Clock, className: 'text-gray-500 dark:text-neutral-400' },
  failed: { icon: XCircle, className: 'text-red-600 dark:text-red-400' },
  orphaned: { icon: AlertCircle, className: 'text-yellow-600 dark:text-yellow-400' },
  removed_on_platform: { icon: AlertCircle, className: 'text-yellow-600 dark:text-yellow-400' },
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function TimelineEntry({ entry }: { entry: PublishTimelineEntry }) {
  const { t } = useTranslation();
  const style = STATUS_STYLES[entry.status] ?? STATUS_STYLES['pending']!;
  const Icon = style.icon;

  return (
    <li className="flex gap-3 border-b border-gray-100 py-3 last:border-0 dark:border-neutral-800">
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.className}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium capitalize text-gray-900 dark:text-white">
            {entry.platform}
          </span>
          {entry.account_name && (
            <span className="truncate text-sm text-gray-500 dark:text-neutral-400">
              {entry.account_name}
            </span>
          )}
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
            {t(`publications.timeline.status.${entry.status}`, entry.status)}
          </span>
          {entry.is_retrying && (
            <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
              <RefreshCw className="h-3 w-3 animate-spin" />
              {t('publications.timeline.retrying', 'Retrying…')}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
          {entry.published_at
            ? `${t('publications.timeline.publishedAt', 'Published')}: ${formatDate(entry.published_at)}`
            : `${t('publications.timeline.attemptedAt', 'Attempted')}: ${formatDate(entry.updated_at)}`}
          {entry.retry_count > 0 && (
            <span className="ml-2">
              · {t('publications.timeline.retries', 'Retries')}: {entry.retry_count}
            </span>
          )}
        </p>

        {entry.error_message && (
          <p className="mt-1 break-words rounded bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {entry.error_message}
          </p>
        )}

        {entry.post_url && (
          <a
            href={entry.post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
          >
            {t('publications.timeline.viewPost', 'View post')}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </li>
  );
}

export function PublicationTimelineModal({
  publicationId,
  isOpen,
  onClose,
}: PublicationTimelineModalProps) {
  const { t } = useTranslation();
  const { data, isPending, error } = usePublishTimeline(isOpen ? publicationId : null);

  return (
    <DynamicModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('publications.timeline.title', 'Publish status')}
      size="2xl"
    >
      {isPending && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      )}

      {!isPending && error && (
        <p className="py-6 text-center text-sm text-red-600 dark:text-red-400">
          {t('publications.timeline.error', 'Could not load the publish status.')}
        </p>
      )}

      {!isPending && !error && data && (
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium text-gray-700 dark:text-neutral-300">
              {data.publication.title}
            </p>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:bg-neutral-800 dark:text-neutral-300">
              {t(`publications.timeline.status.${data.publication.status}`, data.publication.status)}
            </span>
          </div>

          {data.timeline.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-neutral-400">
              {t(
                'publications.timeline.empty',
                'No publish attempts yet. The timeline appears once the publication is sent.',
              )}
            </p>
          ) : (
            <ul>
              {data.timeline.map((entry) => (
                <TimelineEntry key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </div>
      )}
    </DynamicModal>
  );
}

export default PublicationTimelineModal;
