import { FacebookPreview } from "@/Components/ManageContent/Publication/previews/FacebookPreview";
import { InstagramPreview } from "@/Components/ManageContent/Publication/previews/InstagramPreview";
import { LinkedInPreview } from "@/Components/ManageContent/Publication/previews/LinkedInPreview";
import { TikTokPreview } from "@/Components/ManageContent/Publication/previews/TikTokPreview";
import { TwitterPreview } from "@/Components/ManageContent/Publication/previews/TwitterPreview";
import { YouTubePreview } from "@/Components/ManageContent/Publication/previews/YouTubePreview";
import { SOCIAL_PLATFORMS } from "@/Constants/socialPlatformsConfig";
import {
  Facebook,
  Instagram,
  Linkedin,
  Music2,
  Twitter,
  Youtube,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface LivePreviewSectionProps {
  content: string;
  mediaUrls: string[];
  user?: {
    name: string;
    username: string;
    avatar?: string;
    headline?: string;
  };
  className?: string;
}

type Platform =
  | "twitter"
  | "instagram"
  | "linkedin"
  | "facebook"
  | "tiktok"
  | "youtube";

export const LivePreviewSection = ({
  content,
  mediaUrls,
  user,
  className,
}: LivePreviewSectionProps) => {
  const { t } = useTranslation();

  const tabs = useMemo(() => {
    const allTabs: { id: Platform; label: string; icon: any }[] = [
      { id: "twitter", label: "Twitter", icon: Twitter },
      { id: "instagram", label: "Instagram", icon: Instagram },
      { id: "linkedin", label: "LinkedIn", icon: Linkedin },
      { id: "facebook", label: "Facebook", icon: Facebook },
      { id: "youtube", label: "YouTube", icon: Youtube },
      { id: "tiktok", label: "TikTok", icon: Music2 },
    ];

    return allTabs.filter((tab) => {
      const config = (SOCIAL_PLATFORMS as any)[tab.id];
      return config?.active === true;
    });
  }, []);

  const [activePlatform, setActivePlatform] = useState<Platform>(
    tabs.length > 0 ? tabs[0].id : "twitter",
  );

  return (
    <div className={`space-y-4 ${className || ""}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("publications.modal.preview.title") || "Live Preview"}
        </h3>
      </div>

      <div className="flex p-1 space-x-1 bg-gray-100 dark:bg-neutral-800 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActivePlatform(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activePlatform === tab.id
                  ? "bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-gray-50 dark:bg-neutral-900/50 rounded-xl p-6 min-h-[400px] flex items-center justify-center border border-gray-200 dark:border-neutral-800">
        {activePlatform === "twitter" && (
          <TwitterPreview content={content} mediaUrls={mediaUrls} user={user} />
        )}
        {activePlatform === "instagram" && (
          <InstagramPreview
            content={content}
            mediaUrls={mediaUrls}
            user={user}
          />
        )}
        {activePlatform === "linkedin" && (
          <LinkedInPreview
            content={content}
            mediaUrls={mediaUrls}
            user={user}
          />
        )}
        {activePlatform === "facebook" && (
          <FacebookPreview
            content={content}
            mediaUrls={mediaUrls}
            user={user}
          />
        )}
        {activePlatform === "tiktok" && (
          <TikTokPreview content={content} mediaUrls={mediaUrls} user={user} />
        )}
        {activePlatform === "youtube" && (
          <YouTubePreview content={content} mediaUrls={mediaUrls} user={user} />
        )}
      </div>

      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        {t("publications.modal.preview.disclaimer") ||
          "Preview is an approximation. Actual appearance may vary by platform."}
      </p>
    </div>
  );
};
