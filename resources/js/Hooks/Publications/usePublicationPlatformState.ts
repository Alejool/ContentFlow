import { useMemo } from 'react';

interface SocialAccountLike {
  id: number;
  platform?: string | null;
}

interface PlatformsData {
  published?: number[];
  publishing?: number[];
  failed?: number[];
}

interface PublicationLike {
  social_post_logs?: Array<{ status: string; social_account_id: number }>;
}

/** Union of account IDs from the live query and the publication's own logs. */
function mergeAccountIds(
  publication: PublicationLike | null | undefined,
  fromQuery: number[] | undefined,
  status: string,
): number[] {
  const fromLogs = (publication?.social_post_logs ?? [])
    .filter((log) => log.status === status)
    .map((log) => log.social_account_id);
  return Array.from(new Set([...(fromQuery ?? []), ...fromLogs]));
}

/**
 * Derives everything the publication editor needs to know about the platforms
 * and accounts involved in a publication: which accounts are selected, which
 * platforms they map to, and which accounts are published / publishing /
 * failed (merging live query data with the publication's own post logs).
 *
 * Pure derivation extracted from EditPublicationModal to keep that component
 * focused on rendering.
 */
export function usePublicationPlatformState(params: {
  publication: { social_post_logs?: Array<{ status: string; social_account_id: number }> } | null | undefined;
  platformsData: PlatformsData | undefined;
  selectedSocialAccounts: number[];
  socialAccounts: SocialAccountLike[];
  platformSettings: Record<string, unknown>;
}) {
  const { publication, platformsData, selectedSocialAccounts, socialAccounts, platformSettings } = params;

  const publishedAccountIds = useMemo(
    () => mergeAccountIds(publication, platformsData?.published, 'published'),
    [publication, platformsData],
  );

  const publishingAccountIds = useMemo(
    () => mergeAccountIds(publication, platformsData?.publishing, 'publishing'),
    [publication, platformsData],
  );

  const failedAccountIds = useMemo(
    () => mergeAccountIds(publication, platformsData?.failed, 'failed'),
    [publication, platformsData],
  );

  const selectedPlatformNames = useMemo(
    () =>
      selectedSocialAccounts
        .map((id) => socialAccounts.find((a) => a.id === id)?.platform)
        .filter(Boolean) as string[],
    [selectedSocialAccounts, socialAccounts],
  );

  const selectedPlatforms = useMemo(
    () =>
      Array.from(
        new Set(
          selectedSocialAccounts
            .map((id) => socialAccounts.find((a) => a.id === id)?.platform)
            .filter((platform): platform is string => Boolean(platform)),
        ),
      ),
    [selectedSocialAccounts, socialAccounts],
  );

  const allPlatformSettings = useMemo(() => {
    const settings: Record<string, Record<string, unknown>> = {};
    selectedPlatforms.forEach((platform) => {
      const key = platform.toLowerCase();
      settings[key] = (platformSettings[key] as Record<string, unknown>) || {};
    });
    return settings;
  }, [selectedPlatforms, platformSettings]);

  const hasYouTubeAccount = useMemo(
    () =>
      selectedSocialAccounts.some(
        (id) => socialAccounts.find((a) => a.id === id)?.platform?.toLowerCase() === 'youtube',
      ),
    [selectedSocialAccounts, socialAccounts],
  );

  const hasPublishedPlatform = useMemo(
    () => publication?.social_post_logs?.some((log) => log.status === 'published') ?? false,
    [publication],
  );

  const hasPublishingPlatform = useMemo(
    () => publication?.social_post_logs?.some((log) => log.status === 'publishing') ?? false,
    [publication],
  );

  return {
    publishedAccountIds,
    publishingAccountIds,
    failedAccountIds,
    selectedPlatformNames,
    selectedPlatforms,
    allPlatformSettings,
    hasYouTubeAccount,
    hasPublishedPlatform,
    hasPublishingPlatform,
  };
}
