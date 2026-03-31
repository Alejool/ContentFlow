import { formatPublicationDate } from '@/Utils/publicationHelpers';
import { Calendar, Hash, Target } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CampaignInfoGridProps {
  goal?: string;
  hashtags?: string;
  startDate?: string;
  endDate?: string;
  publishDate?: string;
}

export default function CampaignInfoGrid({
  goal,
  hashtags,
  startDate,
  endDate,
  publishDate,
}: CampaignInfoGridProps) {
  const { t } = useTranslation();
  const [hashtagsExpanded, setHashtagsExpanded] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {goal && (
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-neutral-900/50">
          <div className="mb-2 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {t('campaigns.modal.view.goal')}
            </span>
          </div>
          <p className="text-sm text-gray-900 dark:text-white">{goal}</p>
        </div>
      )}

      {hashtags && (
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-neutral-900/50">
          <div className="mb-2 flex items-center gap-2">
            <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {t('campaigns.modal.view.hashtags')}
            </span>
          </div>
          <div
            className={`text-sm text-gray-900 dark:text-white ${
              !hashtagsExpanded ? 'line-clamp-2' : ''
            } cursor-pointer break-words transition-colors hover:text-primary-600 dark:hover:text-primary-400`}
            onClick={() => setHashtagsExpanded(!hashtagsExpanded)}
            title={hashtagsExpanded ? 'Click para contraer' : 'Click para expandir'}
          >
            {hashtags}
          </div>
          {hashtags.length > 100 && (
            <button
              onClick={() => setHashtagsExpanded(!hashtagsExpanded)}
              className="mt-2 text-xs text-primary-600 hover:underline dark:text-primary-400"
            >
              {hashtagsExpanded ? 'Ver menos' : 'Ver más'}
            </button>
          )}
        </div>
      )}

      {startDate && (
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-neutral-900/50">
          <div className="mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {t('campaigns.modal.view.startDate')}
            </span>
          </div>
          <p className="text-sm text-gray-900 dark:text-white">
            {formatPublicationDate(startDate) || t('common.notSet', 'Not set')}
          </p>
        </div>
      )}

      {endDate && (
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-neutral-900/50">
          <div className="mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {t('campaigns.modal.view.endDate')}
            </span>
          </div>
          <p className="text-sm text-gray-900 dark:text-white">
            {formatPublicationDate(endDate) || t('common.notSet', 'Not set')}
          </p>
        </div>
      )}

      {publishDate && (
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-neutral-900/50 md:col-span-2">
          <div className="mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {t('campaigns.modal.view.publishedOn')}
            </span>
          </div>
          <p className="text-sm text-gray-900 dark:text-white">
            {formatPublicationDate(publishDate) || t('common.notSet', 'Not set')}
          </p>
        </div>
      )}
    </div>
  );
}
