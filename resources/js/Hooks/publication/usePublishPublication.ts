import { useCampaignStore } from "@/stores/campaignStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { useAccountsStore } from "@/stores/socialAccountsStore";
import { Publication } from "@/types/Publication";
import { SocialAccount } from "@/types/SocialAccount";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface PublishPublicationState {
  selectedPlatforms: number[];
  publishedPlatforms: number[];
  publishing: boolean;
  failedPlatforms: number[];
  publishingPlatforms: number[];
  scheduledPlatforms: number[];
  removedPlatforms: number[];
  unpublishing: number | null;
  youtubeThumbnails: Record<number, File | null>;
  existingThumbnails: Record<number, { url: string; id: number }>;
  isLoadingThumbnails: boolean;
}

export interface UsePublishPublicationReturn extends PublishPublicationState {
  connectedAccounts: SocialAccount[];
  fetchPublishedPlatforms: (publicationId: number) => Promise<void>;
  loadExistingThumbnails: (publication: Publication) => Promise<void>;
  handleUnpublish: (
    publicationId: number,
    accountId: number,
    platform: string
  ) => Promise<boolean>;
  togglePlatform: (accountId: number) => void;
  selectAll: () => void;
  deselectAll: () => void;
  isYoutubeSelected: () => boolean;
  handlePublish: (
    publication: Publication,
    platformSettings?: Record<string, any>
  ) => Promise<boolean>;
  setYoutubeThumbnails: React.Dispatch<
    React.SetStateAction<Record<number, File | null>>
  >;
  setExistingThumbnails: React.Dispatch<
    React.SetStateAction<Record<number, { url: string; id: number }>>
  >;
  setUnpublishing: React.Dispatch<React.SetStateAction<number | null>>;
  resetState: () => void;
  activeAccounts: SocialAccount[];
  handleThumbnailChange: (videoId: number, file: File | null) => void;
  handleThumbnailDelete: (videoId: number) => void;
}

/* -------------------------------------------------------------------------- */
/*                                    HOOK                                    */
/* -------------------------------------------------------------------------- */

export const usePublishPublication = (): UsePublishPublicationReturn => {
  /* ----------------------------- Global stores ----------------------------- */

  const accounts = useAccountsStore((s) => s.accounts);
  const campaigns = useCampaignStore((s) => s.campaigns);
  const isCampaignLoading = useCampaignStore((s) => s.isLoading);
  const fetchCampaigns = useCampaignStore((s) => s.fetchCampaigns);

  const publishedPlatformsCache = usePublicationStore(
    (s) => s.publishedPlatforms
  );
  const failedPlatformsCache = usePublicationStore((s) => s.failedPlatforms);
  const publishingPlatformsCache = usePublicationStore(
    (s) => s.publishingPlatforms
  );
  const scheduledPlatformsCache = usePublicationStore(
    (s) => s.scheduledPlatforms
  );
  const removedPlatformsCache = usePublicationStore((s) => s.removedPlatforms);

  const fetchPublishedPlatformsFromStore = usePublicationStore(
    (s) => s.fetchPublishedPlatforms
  );
  const setPublishedPlatformsInStore = usePublicationStore(
    (s) => s.setPublishedPlatforms
  );
  const publishPublication = usePublicationStore((s) => s.publishPublication);
  const unpublishPublication = usePublicationStore(
    (s) => s.unpublishPublication
  );

  /* ----------------------------- Derived state ----------------------------- */

  const activeAccounts = useMemo(
    () =>
      accounts
        .filter((account) => account.is_active)
        .map((account) => ({
          ...account,
          account_name: account.account_name || account.name,
        })),
    [accounts]
  );

  /* ------------------------------- Local state ------------------------------ */

  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState<number | null>(null);
  const [youtubeThumbnails, setYoutubeThumbnails] = useState<
    Record<number, File | null>
  >({});
  const [existingThumbnails, setExistingThumbnails] = useState<
    Record<number, { url: string; id: number }>
  >({});
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);
  const [currentPublicationId, setCurrentPublicationId] = useState<
    number | null
  >(null);
  const [hasAtteptedInitialFetch, setHasAttemptedInitialFetch] =
    useState(false);

  /* ------------------------------ Side effects ------------------------------ */

  useEffect(() => {
    if (
      campaigns.length === 0 &&
      !isCampaignLoading &&
      !hasAtteptedInitialFetch
    ) {
      setHasAttemptedInitialFetch(true);
      fetchCampaigns();
    }
  }, [
    campaigns.length,
    fetchCampaigns,
    isCampaignLoading,
    hasAtteptedInitialFetch,
  ]);

  /* ----------------------------- Store selectors ---------------------------- */

  const publishedPlatforms = useMemo(() => {
    return currentPublicationId
      ? publishedPlatformsCache[currentPublicationId] || []
      : [];
  }, [publishedPlatformsCache, currentPublicationId]);

  const failedPlatforms = useMemo(() => {
    return currentPublicationId
      ? failedPlatformsCache[currentPublicationId] || []
      : [];
  }, [failedPlatformsCache, currentPublicationId]);

  const publishingPlatforms = useMemo(() => {
    return currentPublicationId
      ? publishingPlatformsCache[currentPublicationId] || []
      : [];
  }, [publishingPlatformsCache, currentPublicationId]);

  const scheduledPlatforms = useMemo(() => {
    return currentPublicationId
      ? scheduledPlatformsCache[currentPublicationId] || []
      : [];
  }, [scheduledPlatformsCache, currentPublicationId]);

  const removedPlatforms = useMemo(() => {
    return currentPublicationId
      ? removedPlatformsCache[currentPublicationId] || []
      : [];
  }, [removedPlatformsCache, currentPublicationId]);

  /* ------------------------------ Reset state ------------------------------- */

  const resetState = useCallback(() => {
    setSelectedPlatforms([]);
    setYoutubeThumbnails({});
    setExistingThumbnails({});
    setUnpublishing(null);
    setCurrentPublicationId(null);
  }, []);

  /* --------------------------- Thumbnails handling -------------------------- */

  const loadExistingThumbnails = useCallback(
    async (publication: Publication) => {
      if (!publication?.media_files) {
        setExistingThumbnails({});
        return;
      }

      setIsLoadingThumbnails(true);
      try {
        const thumbnails: Record<number, { url: string; id: number }> = {};

        const videoFiles = publication.media_files.filter((m) =>
          m.file_type?.includes("video")
        );

        for (const video of videoFiles) {
          if (video.metadata?.thumbnail_url) {
            thumbnails[video.id] = {
              url: video.metadata.thumbnail_url,
              id: video.id,
            };
          } else if (Array.isArray(video.derivatives)) {
            const thumbnail = video.derivatives.find(
              (d: any) =>
                d.derivative_type === "thumbnail" || d.file_type === "image"
            );

            if (thumbnail?.file_path) {
              thumbnails[video.id] = {
                url: thumbnail.file_path.startsWith("http")
                  ? thumbnail.file_path
                  : `/storage/${thumbnail.file_path}`,
                id: thumbnail.id || video.id,
              };
            }
          }
        }

        setExistingThumbnails(thumbnails);
      } finally {
        setIsLoadingThumbnails(false);
      }
    },
    []
  );

  const handleThumbnailChange = useCallback(
    (videoId: number, file: File | null) => {
      setYoutubeThumbnails((prev) => ({ ...prev, [videoId]: file }));

      if (!file) {
        setExistingThumbnails((prev) => {
          const next = { ...prev };
          delete next[videoId];
          return next;
        });
      }
    },
    []
  );

  const handleThumbnailDelete = useCallback((videoId: number) => {
    setYoutubeThumbnails((prev) => {
      const next = { ...prev };
      delete next[videoId];
      return next;
    });

    setExistingThumbnails((prev) => {
      const next = { ...prev };
      delete next[videoId];
      return next;
    });
  }, []);

  /* -------------------------- Published platforms --------------------------- */

  const fetchPublishedPlatforms = useCallback(
    async (publicationId: number) => {
      setCurrentPublicationId(publicationId);
      await fetchPublishedPlatformsFromStore(publicationId);
    },
    [fetchPublishedPlatformsFromStore]
  );

  /* ------------------------------- Unpublish -------------------------------- */

  const handleUnpublish = useCallback(
    async (publicationId: number, accountId: number, platform: string) => {
      const { success, data } = await unpublishPublication(publicationId, [
        accountId,
      ]);

      if (success) {
        toast.success(`Unpublished from ${platform}`);

        const current = publishedPlatformsCache[publicationId] || [];
        setPublishedPlatformsInStore(
          publicationId,
          current.filter((id) => id !== accountId)
        );
        return true;
      } else {
        toast.error(data || "Error unpublishing");
        return false;
      }
    },
    [
      unpublishPublication,
      publishedPlatformsCache,
      setPublishedPlatformsInStore,
    ]
  );

  /* ---------------------------- Platform selection -------------------------- */

  const togglePlatform = useCallback((accountId: number) => {
    setSelectedPlatforms((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  }, []);

  const selectAll = useCallback(() => {
    const published = currentPublicationId
      ? publishedPlatformsCache[currentPublicationId] || []
      : [];

    setSelectedPlatforms(
      activeAccounts
        .filter((acc) => !published.includes(acc.id))
        .map((acc) => acc.id)
    );
  }, [activeAccounts, currentPublicationId, publishedPlatformsCache]);

  const deselectAll = useCallback(() => {
    setSelectedPlatforms([]);
  }, []);

  const isYoutubeSelected = useCallback(() => {
    return activeAccounts.some(
      (acc) =>
        acc.platform.toLowerCase() === "youtube" &&
        selectedPlatforms.includes(acc.id)
    );
  }, [activeAccounts, selectedPlatforms]);

  /* ------------------------------- Publish ---------------------------------- */

  const handlePublish = useCallback(
    async (
      publication: Publication,
      platformSettings?: Record<string, any>
    ): Promise<boolean> => {
      if (selectedPlatforms.length === 0) {
        toast.error("Please select at least one platform");
        return false;
      }

      setPublishing(true);
      try {
        const formData = new FormData();

        selectedPlatforms.forEach((id) =>
          formData.append("platforms[]", id.toString())
        );

        Object.entries(youtubeThumbnails).forEach(([videoId, file]) => {
          if (file) {
            formData.append("youtube_thumbnails[]", file);
            formData.append("youtube_thumbnail_video_ids[]", videoId);
          }
        });

        if (platformSettings && Object.keys(platformSettings).length > 0) {
          formData.append(
            "platform_settings",
            JSON.stringify(platformSettings)
          );
        }

        const { success, data } = await publishPublication(
          publication.id,
          formData
        );

        if (!success) {
          toast.error(data || "Publishing failed");
          return false;
        }

        toast.success("Publishing started");
        setYoutubeThumbnails({});
        return true;
      } catch {
        toast.error("Publishing failed");
        return false;
      } finally {
        setPublishing(false);
      }
    },
    [selectedPlatforms, youtubeThumbnails, publishPublication]
  );

  /* ------------------------------- RETURN ----------------------------------- */

  return {
    connectedAccounts: activeAccounts,
    activeAccounts,

    selectedPlatforms,
    publishedPlatforms,
    failedPlatforms,
    removedPlatforms,
    publishingPlatforms,
    scheduledPlatforms,
    publishing,
    unpublishing,
    youtubeThumbnails,
    existingThumbnails,
    isLoadingThumbnails,

    fetchPublishedPlatforms,
    loadExistingThumbnails,
    handleUnpublish,
    togglePlatform,
    selectAll,
    deselectAll,
    isYoutubeSelected,
    handlePublish,

    handleThumbnailChange,
    handleThumbnailDelete,

    setYoutubeThumbnails,
    setExistingThumbnails,
    setUnpublishing,

    resetState,
  };
};
