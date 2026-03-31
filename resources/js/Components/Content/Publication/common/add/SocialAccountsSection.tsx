import { Check, Target } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import SocialAccountItem from './SocialAccounts/SocialAccountItem';
import type { SocialAccountsSectionProps } from './SocialAccounts/types';

const SocialAccountsSection = memo(
  ({
    socialAccounts,
    selectedAccounts,
    accountSchedules,
    t,
    onAccountToggle,
    onScheduleChange,
    onScheduleRemove,
    onPlatformSettingsClick,
    globalSchedule,
    publishedAccountIds,
    publishingAccountIds,
    failedAccountIds,
    unpublishing,
    onCancel,
    onCancelPlatform,
    error,
    durationErrors = {},
    videoMetadata = {},
    mediaFiles = [],
    disabled = false,
    socialPostLogs = [],
    contentType,
    onThumbnailChange,
    onThumbnailDelete,
    thumbnails,
    publication,
    invalidTokenAccountIds = [],
    expiringSoonAccountIds = [],
  }: SocialAccountsSectionProps) => {
    const [activePopover, setActivePopover] = useState<number | null>(null);
    const [isYouTubeThumbnailExpanded, setIsYouTubeThumbnailExpanded] = useState(true);

    // Merge connected accounts with disconnected accounts from social_post_logs
    const allAccounts = useMemo(() => {
      const connectedAccounts = [...socialAccounts];
      const connectedAccountIds = new Set(socialAccounts.map((acc) => acc.id));

      // Find published accounts that are no longer connected
      const disconnectedPublishedAccounts = socialPostLogs
        .filter(
          (log) =>
            (log.status === 'published' ||
              log.status === 'publishing' ||
              log.status === 'failed') &&
            !connectedAccountIds.has(log.social_account_id),
        )
        .map((log) => ({
          id: log.social_account_id,
          platform: log.platform,
          name: log.account_name || 'Unknown',
          ...(log.account_name ? { account_name: log.account_name } : {}),
          isDisconnected: true as const,
        }));

      // Remove duplicates from disconnected accounts
      const uniqueDisconnected = disconnectedPublishedAccounts.filter(
        (acc, index, self) => index === self.findIndex((a) => a.id === acc.id),
      );

      return [...connectedAccounts, ...uniqueDisconnected];
    }, [socialAccounts, socialPostLogs]);

    return (
      <div className="space-y-4">
        {/* Banner informativo si ya está publicada en algunas cuentas */}
        {publishedAccountIds && publishedAccountIds.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-blue-800 dark:text-blue-200">
                  {t('publications.modal.publish.alreadyPublishedBanner.title') ||
                    'Publicación Activa'}
                </h4>
                <p className="mt-0.5 text-[11px] text-blue-700 dark:text-blue-300">
                  {t('publications.modal.publish.alreadyPublishedBanner.message') ||
                    'Esta publicación ya está publicada en las siguientes cuentas:'}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {allAccounts
                    .filter((acc) => publishedAccountIds.includes(acc.id))
                    .map((acc) => (
                      <span
                        key={acc.id}
                        className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                      >
                        <span className="capitalize">{acc.platform}</span>
                        <span className="opacity-75">@{acc.account_name || acc.name}</span>
                        {acc.isDisconnected && (
                          <span className="ml-1 rounded bg-amber-200 px-1 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-800 dark:text-amber-200">
                            {t('common.disconnected') || 'Desconectada'}
                          </span>
                        )}
                      </span>
                    ))}
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                  {t('publications.modal.publish.alreadyPublishedBanner.hint') ||
                    'Puedes publicar en cuentas adicionales seleccionándolas a continuación.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 font-semibold">
            <Target className="h-4 w-4" />
            {t('manageContent.configureNetworks') || 'Configura tus redes sociales'}
          </label>
        </div>

        <div className="flex flex-col gap-2">
          {allAccounts.map((account) => {
            const isChecked = selectedAccounts.includes(account.id);
            const customSchedule = accountSchedules[account.id];
            const isPublished = publishedAccountIds?.includes(account.id);
            const isPublishing = publishingAccountIds?.includes(account.id);
            const isFailed = failedAccountIds?.includes(account.id);
            const isIndividualUnpublishing = unpublishing === account.id;

            // Get error message from social post logs
            const errorMessage = socialPostLogs?.find(
              (log) => log.social_account_id === account.id && log.status === 'failed',
            )?.error_message;

            return (
              <SocialAccountItem
                key={account.id}
                account={account}
                isChecked={isChecked}
                customSchedule={customSchedule}
                activePopover={activePopover}
                onToggle={() => onAccountToggle(account.id)}
                t={t}
                onScheduleClick={() =>
                  setActivePopover(activePopover === account.id ? null : account.id)
                }
                onScheduleChange={(date) => onScheduleChange(account.id, date)}
                onScheduleRemove={() => onScheduleRemove(account.id)}
                onPlatformSettingsClick={() => onPlatformSettingsClick(account.platform)}
                onPopoverClose={() => setActivePopover(null)}
                globalSchedule={globalSchedule}
                isPublished={isPublished}
                isPublishing={isPublishing}
                isFailed={isFailed}
                isUnpublishing={isIndividualUnpublishing}
                onCancel={onCancelPlatform ? () => onCancelPlatform(account.id) : onCancel}
                disabled={disabled || account.isDisconnected}
                durationError={durationErrors[account.id]}
                videoMetadata={videoMetadata}
                mediaFiles={mediaFiles}
                errorMessage={errorMessage}
                onThumbnailChange={onThumbnailChange}
                onThumbnailDelete={onThumbnailDelete}
                thumbnails={thumbnails}
                publication={publication}
                isYouTubeThumbnailExpanded={isYouTubeThumbnailExpanded}
                setIsYouTubeThumbnailExpanded={setIsYouTubeThumbnailExpanded}
                contentType={contentType}
                isTokenInvalid={invalidTokenAccountIds.includes(account.id)}
                isTokenExpiringSoon={expiringSoonAccountIds.includes(account.id)}
              />
            );
          })}
        </div>
      </div>
    );
  },
);

export default SocialAccountsSection;
