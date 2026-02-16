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
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const renderEmbeddedPost = (platform: string, url: string) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [url]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando publicación...</p>
      </div>
    );
  }

  switch (platform) {
    case "twitter":
      const tweetId = url.split("/status/")[1]?.split("?")[0];
      return (
        <iframe
          src={`https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=light`}
          className="w-full max-w-[550px] h-[600px] border-0"
          scrolling="no"
        />
      );

    case "instagram":
      const igUrl = url.endsWith("/") ? url : `${url}/`;
      return (
        <iframe
          src={`${igUrl}embed`}
          className="w-full max-w-[540px] h-[700px] border-0 overflow-hidden"
          scrolling="no"
          allowTransparency
        />
      );

    case "facebook":
      return (
        <iframe
          src={`https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&width=500`}
          className="w-full max-w-[500px] h-[600px] border-0 overflow-hidden"
          scrolling="no"
          allowTransparency
        />
      );

    case "youtube":
      const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?\s]+)/)?.[1];
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="w-full max-w-[640px] aspect-video border-0 rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );

    case "tiktok":
      return (
        <iframe
          src={`https://www.tiktok.com/embed/v2/${url.split("/video/")[1]?.split("?")[0]}`}
          className="w-full max-w-[325px] h-[730px] border-0"
          scrolling="no"
          allowFullScreen
        />
      );

    case "linkedin":
      return (
        <div className="text-center space-y-3 py-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            LinkedIn no permite embeber publicaciones directamente.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0077b5] hover:bg-[#006399] text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            Ver en LinkedIn
          </a>
        </div>
      );

    default:
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Vista previa no disponible para esta plataforma
        </p>
      );
  }
};

interface LivePreviewSectionProps {
  content: string;
  mediaUrls: string[];
  user?: {
    name: string;
    username: string;
    avatar?: string;
    headline?: string;
  };
  publishedLinks?: Record<string, string>;
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
  publishedLinks,
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
          const hasPublishedLink = publishedLinks && publishedLinks[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActivePlatform(tab.id)}
              className={`relative flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activePlatform === tab.id
                  ? "bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {hasPublishedLink && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white dark:border-neutral-800" />
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-gray-50 dark:bg-neutral-900/50 rounded-lg p-6 min-h-[400px] border border-gray-200 dark:border-neutral-800">
        {publishedLinks && publishedLinks[activePlatform] ? (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Publicado en {activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)}
                  </span>
                </div>
                <a
                  href={publishedLinks[activePlatform]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Abrir en {activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)}
                </a>
              </div>
            </div>
            <div className="flex items-center justify-center bg-white dark:bg-neutral-800 rounded-lg p-4 min-h-[500px]">
              {renderEmbeddedPost(activePlatform, publishedLinks[activePlatform])}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center">
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
        )}
      </div>

      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        {t("publications.modal.preview.disclaimer") ||
          "Preview is an approximation. Actual appearance may vary by platform."}
      </p>
    </div>
  );
};
