import { FileText, Layers } from 'lucide-react';
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
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/30">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <Layers className="h-4 w-4" />
        {t('campaigns.modal.view.associatedPublications')} (
        <span className="font-bold">{publications.length}</span>)
      </h3>
      <div className="space-y-2">
        {publications.map((pub: any) => {
          if (!pub) return null;
          return (
            <div
              key={pub.id}
              className="flex items-center gap-3 rounded bg-white p-2 shadow-sm dark:bg-neutral-800"
            >
              {pub.media_files?.[0] ? (
                <img
                  src={pub.media_files[0].file_path}
                  className="h-8 w-8 rounded object-cover"
                  alt={pub.title || 'Publication media'}
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-200">
                  <FileText className="h-4 w-4 text-gray-400" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {pub.title || pub.name || 'Untitled'}
              </span>

              {pub.status === 'published' && <div className="ml-auto flex gap-1"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
