import { formatPublicationDate } from '@/Utils/publicationHelpers';
import { useTranslation } from 'react-i18next';
import CampaignInfoGrid from './CampaignInfoGrid';
import PublishedPostsSection from './PublishedPostsSection';

interface CampaignOverviewTabProps {
  item: any;
}

export default function CampaignOverviewTab({ item }: CampaignOverviewTabProps) {
  const { t } = useTranslation();

  return (
    <>
      <CampaignInfoGrid
        goal={item.goal}
        hashtags={item.hashtags}
        startDate={item.start_date}
        endDate={item.end_date}
        publishDate={item.publish_date}
      />

      <PublishedPostsSection
        socialPostLogs={item.social_post_logs}
        scheduledPosts={item.scheduled_posts}
      />

      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/30">
        <div className="flex flex-col items-start justify-between gap-2 text-xs sm:flex-row sm:items-center">
          <span className="text-gray-500 dark:text-gray-400">
            {t('campaigns.modal.view.created')}:{' '}
            {formatPublicationDate(item.created_at) || t('common.notSet', 'Not set')}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {t('campaigns.modal.view.lastUpdated')}:{' '}
            {formatPublicationDate(item.updated_at) || t('common.notSet', 'Not set')}
          </span>
        </div>
      </div>
    </>
  );
}
