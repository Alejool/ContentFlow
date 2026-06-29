import { usePresignedUrl } from '@/Hooks/Upload/usePresignedUrl';
import { FileText, Layers, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AssociatedPublicationsListProps {
  publications: any[];
}

export default function AssociatedPublicationsList({
  publications,
}: AssociatedPublicationsListProps) {
  const { t } = useTranslation();

  if (publications.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-theme-bg-secondary">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-neutral-300">
        <Layers className="h-4 w-4" />
        {t('campaigns.modal.view.associatedPublications')} (
        <span className="font-bold">{publications.length}</span>)
      </h3>
      <div className="space-y-2">
        {publications.map((pub: any) => {
          if (!pub) return null;
          return (
            <PublicationRow key={pub.id} pub={pub} />
          );
        })}
      </div>
    </div>
  );
}

function PublicationRow({ pub }: { pub: any }) {
  const mediaFileId = pub.media_files?.[0]?.id;
  const { data, isLoading } = usePresignedUrl(mediaFileId, { mediaType: 'image' });

  return (
    <div className="flex items-center gap-3 rounded bg-white p-2 shadow-sm dark:bg-theme-bg-secondary">
      {mediaFileId ? (
        isLoading ? (
          <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center">
            <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
          </div>
        ) : data?.preview_url ? (
          <img
            src={data.preview_url}
            className="h-8 w-8 rounded object-cover"
            alt={pub.title || 'Publication media'}
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-200">
            <FileText className="h-4 w-4 text-gray-400" />
          </div>
        )
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-200">
          <FileText className="h-4 w-4 text-gray-400" />
        </div>
      )}
      <span className="text-sm font-medium text-gray-700 dark:text-neutral-200">
        {pub.title || pub.name || 'Untitled'}
      </span>

      {pub.status === 'published' && <div className="ml-auto flex gap-1"></div>}
    </div>
  );
}
