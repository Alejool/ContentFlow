import { Publication } from '@/types/Publication';
import { getPublicationStatusConfig, getShortStatusLabel, getStatusDescription } from '@/Utils/publicationHelpers';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useMemo } from 'react';

interface PublicationStatusBadgeProps {
  publication: Publication;
  showDetails?: boolean;
  className?: string;
}

export function PublicationStatusBadge({
  publication,
  showDetails = false,
  className = '',
}: PublicationStatusBadgeProps) {
  const statusConfig = getPublicationStatusConfig(publication.status);
  const summary = publication.publication_status_summary;

  const statusInfo = useMemo(() => {
    if (!summary) {
      return {
        label: getShortStatusLabel(publication.status || 'draft'),
        description: null,
        icon: null,
      };
    }

    const label = getShortStatusLabel(publication.status || 'draft');
    const description = getStatusDescription(publication.status || 'draft', summary);

    // Determinar el icono basado en el estado
    let icon = null;
    if (summary.has_errors) {
      icon = <AlertTriangle className="h-3 w-3" />;
    } else if (summary.all_successful) {
      icon = <CheckCircle className="h-3 w-3" />;
    } else if (summary.in_progress) {
      icon = <Info className="h-3 w-3" />;
    }

    return { label, description, icon };
  }, [publication.status, summary]);

  if (!showDetails) {
    // Badge simple
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.badge} ${className}`}
      >
        {statusInfo.icon}
        {statusInfo.label}
      </span>
    );
  }

  // Badge con detalles
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.badge}`}
      >
        {statusInfo.icon}
        {statusInfo.label}
      </span>
      {statusInfo.description && statusInfo.description !== statusInfo.label && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {statusInfo.description}
        </span>
      )}
    </div>
  );
}

interface PlatformStatusListProps {
  publication: Publication;
  className?: string;
}

export function PlatformStatusList({ publication, className = '' }: PlatformStatusListProps) {
  const summary = publication.publication_status_summary;

  if (!summary || !summary.platforms || summary.platforms.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Estado por plataforma:
      </h4>
      <div className="space-y-1">
        {summary.platforms.map((platform, index) => {
          const statusConfig = getPublicationStatusConfig(platform.status);
          return (
            <div
              key={`${platform.platform}-${platform.account_id}-${index}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                  {platform.platform}
                </span>
                {platform.account_name && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({platform.account_name})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {platform.status === 'published' && platform.url && (
                  <a
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Ver post
                  </a>
                )}
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.badge}`}
                >
                  {getShortStatusLabel(platform.status)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
