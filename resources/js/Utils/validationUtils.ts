import { SOCIAL_PLATFORMS } from "../Constants/socialPlatformsConfig";

export interface DurationValidationResult {
  isValid: boolean;
  maxDuration: number;
  formattedMax: string;
}

/**
 * Formats duration in seconds to a human-readable string (e.g., 2m 20s, 4h).
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  let result = "";
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (remainingSeconds > 0 && hours === 0) result += `${remainingSeconds}s`;

  return result.trim();
};

/**
 * Validates if a video duration complies with a platform's limits.
 */
export const validateVideoDuration = (
  platformKey: string,
  durationInSeconds: number,
): DurationValidationResult => {
  const platform = (SOCIAL_PLATFORMS as any)[platformKey.toLowerCase()];

  if (!platform || !platform.maxVideoDuration) {
    return {
      isValid: true,
      maxDuration: Infinity,
      formattedMax: "N/A",
    };
  }

  const maxDuration = platform.maxVideoDuration;
  const isValid = durationInSeconds <= maxDuration;

  return {
    isValid,
    maxDuration,
    formattedMax: formatDuration(maxDuration),
  };
};

/**
 * Checks if a publication has any duration errors across its selected accounts.
 */
export const checkPublicationDurationErrors = (
  socialAccountIds: number[],
  accounts: any[],
  mediaFiles: any[],
  videoMetadata: Record<string, any>,
): Record<number, string> => {
  const errors: Record<number, string> = {};
  const videos = mediaFiles.filter((m) => m.type === "video");

  if (videos.length === 0) return errors;

  socialAccountIds.forEach((accountId) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    const platformKey = account.platform?.toLowerCase();
    const validation = validateVideoDuration(platformKey, 0); // Get max duration info

    if (validation.maxDuration === Infinity) return;

    videos.forEach((video) => {
      const metadata = videoMetadata[video.tempId];
      if (metadata && metadata.duration > validation.maxDuration) {
        errors[accountId] = validation.formattedMax;
      }
    });
  });

  return errors;
};
