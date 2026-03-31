import axios from 'axios';
import { useEffect, useState } from 'react';
import { useValidateVideo } from './usePlatformCapabilities';
import type { VideoValidationResult } from './usePlatformCapabilities';

export interface PlatformCapability {
  account_id: number;
  platform: string;
  account_name: string;
  can_publish: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    platform: string;
    supports_text_only: boolean;
    requires_media: boolean;
    supports_images: boolean;
    supports_videos: boolean;
    supports_polls: boolean;
    supports_carousels: boolean;
    supports_stories: boolean;
    supports_reels: boolean;
    video_max_duration?: number;
    video_max_duration_formatted?: string;
    has_twitter_blue?: boolean;
    is_verified?: boolean;
    long_uploads_enabled?: boolean;
    upgrade_message?: string | null;
    current_media_duration?: number;
    current_media_type?: string;
    exceeds_limit?: boolean;
    reel_max_duration?: number;
    story_max_duration?: number;
    carousel_max_items?: number;
    video_min_duration?: number;
  };
}

export interface PublicationCapabilitiesResponse {
  publication_id: number;
  content_type: string;
  has_media: boolean;
  media_count: number;
  capabilities: PlatformCapability[];
}

export function usePublicationCapabilities(publicationId: number | null) {
  const [capabilities, setCapabilities] = useState<PublicationCapabilitiesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoValidationResults, setVideoValidationResults] = useState<
    VideoValidationResult[] | null
  >(null);

  const validateVideoMutation = useValidateVideo();

  useEffect(() => {
    if (!publicationId) {
      setCapabilities(null);
      setVideoValidationResults(null);
      return;
    }

    const fetchCapabilities = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get<PublicationCapabilitiesResponse>(
          `/api/v1/publications/${publicationId}/capabilities`,
        );
        setCapabilities(response.data);

        // Also validate video metadata if there are videos
        if (response.data.has_media) {
          // Get video info from publication
          const pubResponse = await axios.get(`/api/v1/publications/${publicationId}`);
          const publication = pubResponse.data;

          const videoFile = publication.media_files?.find(
            (m: any) => m.file_type === 'video' || m.mime_type?.startsWith('video/'),
          );

          if (videoFile) {
            const videoDuration = videoFile.metadata?.duration || videoFile.duration;
            const fileSizeMb = videoFile.file_size ? videoFile.file_size / (1024 * 1024) : 0;

            if (videoDuration && fileSizeMb) {
              const accountIds = response.data.capabilities.map((cap) => cap.account_id);

              try {
                const validationResult = await validateVideoMutation.mutateAsync({
                  accountIds,
                  videoDuration,
                  fileSizeMb,
                });

                setVideoValidationResults(validationResult.results);
              } catch (err) {
                console.error('Video validation failed:', err);
              }
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching publication capabilities:', err);
        setError(err.response?.data?.message || 'Error al cargar capacidades de plataformas');
      } finally {
        setLoading(false);
      }
    };

    fetchCapabilities();
  }, [publicationId]);

  const getAccountCapability = (accountId: number): PlatformCapability | null => {
    return capabilities?.capabilities.find((cap) => cap.account_id === accountId) || null;
  };

  const canPublishToAccount = (accountId: number): boolean => {
    const capability = getAccountCapability(accountId);
    const contentTypeValid = capability?.can_publish ?? true;

    // Also check video validation
    const videoValidation = videoValidationResults?.find((v) => v.account_id === accountId);
    const videoValid = videoValidation ? videoValidation.valid : true;

    return contentTypeValid && videoValid;
  };

  const getAccountErrors = (accountId: number): string[] => {
    const capability = getAccountCapability(accountId);
    const contentTypeErrors = capability?.errors || [];

    // Add video validation errors
    const videoValidation = videoValidationResults?.find((v) => v.account_id === accountId);
    const videoErrors = videoValidation?.errors.map((e) => e.message) || [];

    return [...contentTypeErrors, ...videoErrors];
  };

  const getAccountWarnings = (accountId: number): string[] => {
    const capability = getAccountCapability(accountId);
    const contentTypeWarnings = capability?.warnings || [];

    // Add video validation warnings
    const videoValidation = videoValidationResults?.find((v) => v.account_id === accountId);
    const videoWarnings = videoValidation?.warnings.map((w) => w.message) || [];

    return [...contentTypeWarnings, ...videoWarnings];
  };

  const getUpgradeMessage = (accountId: number): string | null => {
    const capability = getAccountCapability(accountId);
    const contentTypeUpgrade = capability?.metadata.upgrade_message || null;

    // Check video validation upgrade message
    const videoValidation = videoValidationResults?.find((v) => v.account_id === accountId);
    if (videoValidation && !videoValidation.valid) {
      const platform = videoValidation.platform;
      const caps = videoValidation.capabilities;

      // Use the upgrade message from usePlatformCapabilities
      const { getUpgradeMessage: getVideoUpgradeMessage } = require('./usePlatformCapabilities');
      const videoUpgrade = getVideoUpgradeMessage(platform, caps);

      if (videoUpgrade) {
        return videoUpgrade;
      }
    }

    return contentTypeUpgrade;
  };

  return {
    capabilities,
    loading,
    error,
    getAccountCapability,
    canPublishToAccount,
    getAccountErrors,
    getAccountWarnings,
    getUpgradeMessage,
  };
}
