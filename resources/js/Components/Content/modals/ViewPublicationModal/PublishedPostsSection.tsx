import { formatPublicationDate } from '@/Utils/publicationHelpers';
import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PublishedPostsSectionProps {
  socialPostLogs?: any[];
  scheduledPosts?: any[];
}

export default function PublishedPostsSection({
  socialPostLogs = [],
  scheduledPosts = [],
}: PublishedPostsSectionProps) {
  const { t } = useTranslation();

  const hasPublishedPosts =
    (socialPostLogs && socialPostLogs.length > 0) ||
    (scheduledPosts &&
      scheduledPosts.some((p: any) => p.status === 'posted' || p.status === 'published'));

  if (!hasPublishedPosts) return null;

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      return '';
    } catch {
      return '';
    }
  };

  return (
    <div className="rounded-lg bg-gray-50 p-4 dark:bg-neutral-900/50 md:col-span-2">
      <div className="mb-3 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          {t('publications.table.publishedOn', 'Publicado en')}
        </span>
      </div>

      <div className="space-y-2">
        {/* From social_post_logs */}
        {socialPostLogs &&
          socialPostLogs
            .filter((log: any) => log.published_at || log.created_at)
            .map((log: any, index: number) => {
              const publishDate = log.published_at || log.created_at;
              const platformName = log.social_account?.platform || log.platform || 'Social Network';
              const accountName = log.social_account?.account_name || log.account_name;

              return (
                <div
                  key={`log-${log.id || index}`}
                  className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/30 dark:bg-green-900/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold capitalize text-gray-900 dark:text-white">
                          {platformName}
                        </span>
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-400">
                          {t('publications.status.published')}
                        </span>
                      </div>
                      {accountName && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">@{accountName}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatPublicationDate(publishDate) || t('common.notSet', 'Not set')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(publishDate)}
                    </p>
                  </div>
                </div>
              );
            })}

        {/* From scheduled_posts with status 'posted' or 'published' */}
        {scheduledPosts &&
          scheduledPosts
            .filter((post: any) => post.status === 'posted' || post.status === 'published')
            .map((post: any, index: number) => {
              const publishDate = post.published_at || post.scheduled_at;
              const platformName =
                post.social_account?.platform || post.platform || 'Social Network';
              const accountName = post.social_account?.account_name || post.account_name;

              return (
                <div
                  key={`posted-${post.id || index}`}
                  className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/30 dark:bg-green-900/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold capitalize text-gray-900 dark:text-white">
                          {platformName}
                        </span>
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-400">
                          {t('publications.status.published')}
                        </span>
                      </div>
                      {accountName && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">@{accountName}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatPublicationDate(publishDate) || t('common.notSet', 'Not set')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(publishDate)}
                    </p>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
