import PublicationThumbnail from '@/Components/Content/Publication/PublicationThumbnail';
import { formatDateString } from '@/Utils/formatters';
import type { Campaign } from '@/types/Campaign/Campaign';
import { useTranslation } from 'react-i18next';

interface CampaignPublicationsProps {
  campaign: Campaign;
  getStatusColor: (status?: string) => string;
}

export default function CampaignPublications({
  campaign,
  getStatusColor,
}: CampaignPublicationsProps) {
  const { t } = useTranslation();
  const publications = campaign.publications || [];

  return (
    <tr>
      <td colSpan={5} className="bg-gray-50/50 px-0 dark:bg-theme-bg-secondary">
        <div className="px-4 py-4 lg:px-12">
          <div className="border-primary-500 mb-3 border-l-2 pl-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
            {t('campaigns.modal.view.associatedPublications')}
          </div>
          {publications.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {publications.map((pub) => {
                if (!pub) return null;
                return (
                  <div
                    key={pub.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-neutral-700 dark:bg-theme-bg-secondary"
                  >
                    <div className="flex items-center gap-3 p-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-100 lg:h-10 lg:w-10 dark:border-neutral-700 dark:bg-theme-bg-secondary">
                        <PublicationThumbnail publication={pub} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-gray-800 dark:text-neutral-200">
                          {pub.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateString(pub.created_at)}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`shrink-0 rounded-full px-2 py-1 text-xs ${getStatusColor(
                        pub.status,
                      )}`}
                    >
                      {pub.status}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">{t('campaigns.noPublications')}</div>
          )}
        </div>
      </td>
    </tr>
  );
}
