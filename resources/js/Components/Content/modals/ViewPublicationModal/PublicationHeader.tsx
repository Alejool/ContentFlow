import { getPublicationStatusConfig } from '@/Utils/publicationHelpers';
import { useTranslation } from 'react-i18next';

interface PublicationHeaderProps {
  title: string;
  description: string;
  status?: string;
}

export default function PublicationHeader({ title, description, status }: PublicationHeaderProps) {
  const { t } = useTranslation();
  const statusConfig = getPublicationStatusConfig(status);

  return (
    <div>
      <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
        {status && (
          <span
            className={`inline-flex items-center self-start whitespace-nowrap rounded-lg px-3 py-1 text-sm font-medium ${statusConfig.badge}`}
          >
            {t(`publications.status.${status}`)}
          </span>
        )}
      </div>
      <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}
