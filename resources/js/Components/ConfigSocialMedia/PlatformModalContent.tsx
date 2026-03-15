import FacebookSettings from "@/Components/ConfigSocialMedia/FacebookSettings";
import InstagramSettings from "@/Components/ConfigSocialMedia/InstagramSettings";
import TikTokSettings from "@/Components/ConfigSocialMedia/TikTokSettings";
import TwitterSettings from "@/Components/ConfigSocialMedia/TwitterSettings";
import YoutubeSettings from "@/Components/ConfigSocialMedia/YoutubeSettings";
import { SOCIAL_PLATFORMS } from "@/Constants/socialPlatformsConfig";
import { Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PlatformModalContentProps {
  platform: string;
  settings: any;
  onSettingsChange: (newSettings: any) => void;
  videoMetadata?: {
    duration: number;
    width?: number;
    height?: number;
    aspectRatio?: number;
  };
  allPlatforms?: string[];
  allSettings?: Record<string, any>;
  onAllSettingsChange?: (platform: string, newSettings: any) => void;
}

export default function PlatformModalContent({
  platform,
  settings,
  onSettingsChange,
  videoMetadata,
  allPlatforms = [],
  allSettings = {},
  onAllSettingsChange,
}: PlatformModalContentProps) {
  const { t } = useTranslation();
  const isAllPlatforms = platform.toLowerCase() === "all" || allPlatforms.length > 0;

  const renderPlatformSettings = (
    platformName: string,
    platformSettings: any,
    onChange: (newSettings: any) => void,
  ) => {
    switch (platformName.toLowerCase()) {
      case "youtube":
        return (
          <YoutubeSettings
            settings={platformSettings}
            onSettingsChange={onChange}
            videoMetadata={videoMetadata}
          />
        );
      case "facebook":
        return <FacebookSettings settings={platformSettings} onSettingsChange={onChange} />;
      case "instagram":
        return <InstagramSettings settings={platformSettings} onSettingsChange={onChange} />;
      case "tiktok":
        return <TikTokSettings settings={platformSettings} onSettingsChange={onChange} />;
      case "twitter":
        return <TwitterSettings settings={platformSettings} onSettingsChange={onChange} />;
      default:
        return null;
    }
  };

  const getPlatformIcon = (platformName: string) => {
    const platformKey = platformName.toLowerCase();
    const platformConfig = SOCIAL_PLATFORMS[platformKey as keyof typeof SOCIAL_PLATFORMS];

    if (platformConfig && platformConfig.logo) {
      return <img src={platformConfig.logo} alt={platformConfig.name} className="h-8 w-8" />;
    }

    return <Settings2 className="h-6 w-6 text-primary-500" />;
  };

  if (isAllPlatforms && allPlatforms.length > 0) {
    return (
      <div className="space-y-8">
        {allPlatforms.map((platformName) => (
          <div
            key={platformName}
            className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-neutral-700 dark:bg-neutral-800/50"
          >
            <div className="mb-6 flex items-center gap-3">
              {getPlatformIcon(platformName)}
              <h3 className="text-lg font-bold uppercase">
                {t(`platformSettings.${platformName.toLowerCase()}.title`) || platformName}
              </h3>
            </div>
            {renderPlatformSettings(
              platformName,
              allSettings[platformName.toLowerCase()] || {},
              (newSettings) => {
                if (onAllSettingsChange) {
                  onAllSettingsChange(platformName.toLowerCase(), newSettings);
                }
              },
            )}
          </div>
        ))}
      </div>
    );
  }

  return renderPlatformSettings(platform, settings, onSettingsChange);
}
