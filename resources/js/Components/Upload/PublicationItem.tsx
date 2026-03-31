import type { Publication } from '@/types/Publication';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PlatformProgress } from './PlatformProgress';

interface PublicationItemProps {
  publication: Publication;
  onCancel: (e: React.MouseEvent, id: number) => void;
  onDismiss: (e: React.MouseEvent, id: number) => void;
  onCancelPlatform?: (publicationId: number, platformId: number, platformName: string) => void;
}

export function PublicationItem({
  publication,
  onCancel,
  onDismiss,
  onCancelPlatform,
}: PublicationItemProps) {
  const { t } = useTranslation();

  // Calculate platform statistics
  const getPlatformStats = () => {
    const platformSummary = publication.platform_status_summary;
    if (!platformSummary) return null;

    // Solo contar plataformas que tienen un estado activo (no 'idle' o sin estado)
    const platforms = Object.values(platformSummary).filter(
      (p) => p.status && p.status !== 'idle' && p.status !== 'pending_selection',
    );

    const total = platforms.length;
    const published = platforms.filter((p) => p.status === 'published').length;
    const failed = platforms.filter((p) => p.status === 'failed').length;
    const publishing = platforms.filter(
      (p) =>
        (p.status as string) === 'publishing' ||
        (p.status as string) === 'pending' ||
        (p.status as string) === 'retrying',
    ).length;

    return { total, published, failed, publishing };
  };

  const getStatusIcon = () => {
    const stats = getPlatformStats();

    switch (publication.status) {
      case 'failed':
        return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
      case 'publishing':
      case 'processing':
      case 'retrying':
        return <Loader2 className="text-primary h-3.5 w-3.5 animate-spin" />;
      case 'published':
        // Show warning icon if some platforms failed
        if (stats && stats.failed > 0) {
          return <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />;
        }
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      default:
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    }
  };

  const getStatusBadge = () => {
    const stats = getPlatformStats();

    const badges = {
      publishing: {
        text: stats
          ? t('publications.status.publishingProgress', {
              current: stats.published,
              total: stats.total,
              defaultValue: `${stats.published}/${stats.total}`,
            })
          : t('common.publishing') || 'Publicando',
        className: 'bg-primary/10 text-primary dark:bg-primary/20',
      },
      retrying: {
        text: stats
          ? t('publications.status.retryingProgress', {
              current: stats.published,
              total: stats.total,
              defaultValue: `Reintentando ${stats.published}/${stats.total}`,
            })
          : t('common.retrying') || 'Reintentando',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      },
      published: {
        text: stats
          ? stats.failed > 0
            ? t('publications.status.partialSuccess', {
                success: stats.published,
                total: stats.total,
                defaultValue: `${stats.published}/${stats.total} publicado`,
              })
            : t('publications.status.allPublished', {
                total: stats.total,
                defaultValue: `${stats.total}/${stats.total} publicado`,
              })
          : t('common.success') || 'Éxito',
        className:
          stats && stats.failed > 0
            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      },
      failed: {
        text: t('common.failed') || 'Falló',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      },
    };

    const badge = badges[publication.status as keyof typeof badges];
    if (!badge) return null;

    return (
      <span
        className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${badge.className}`}
      >
        {badge.text}
      </span>
    );
  };

  const canCancel =
    publication.status === 'publishing' ||
    publication.status === 'processing' ||
    publication.status === 'retrying';
  const canDismiss = publication.status === 'failed' || publication.status === 'published';

  return (
    <div className="group border-b border-gray-100 p-3 last:border-0 dark:border-neutral-700">
      <div className="mb-2 flex items-center gap-2">
        {getStatusIcon()}
        <span
          className="flex-1 truncate text-xs font-medium text-neutral-900 dark:text-neutral-100"
          title={publication.title}
        >
          {publication.title}
        </span>
        <div className="flex items-center gap-1.5">
          {canDismiss && (
            <button
              onClick={(e) => onDismiss(e, publication.id)}
              className="text-gray-400 opacity-0 transition-opacity hover:text-green-500 group-hover:opacity-100"
              title={t('common.dismiss') || 'Descartar'}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {canCancel && (
            <button
              onClick={(e) => onCancel(e, publication.id)}
              className="text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
              title={t('publications.publish.button.cancel') || 'Cancelar'}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {getStatusBadge()}
        </div>
      </div>

      <PlatformProgress
        publication={publication}
        {...(onCancelPlatform ? { onCancelPlatform } : {})}
      />
    </div>
  );
}
