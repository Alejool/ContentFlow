import Modal from "@/Components/common/ui/Modal";
import { format } from "date-fns";
import {
  AlertCircle,
  Clock,
  ExternalLink,
  Eye,
  Facebook,
  Heart,
  Instagram,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Play,
  Share2,
  Twitter,
  Youtube,
} from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface PlatformPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: string;
  publication: any;
  settings?: Record<string, any>;
  theme: "dark" | "light";
}

const LiteYouTube: React.FC<{ videoId: string; title?: string }> = ({
  videoId,
  title,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  if (isLoaded) {
    return (
      <div className="relative aspect-video w-full">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title || "YouTube video player"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0"
        ></iframe>
      </div>
    );
  }

  return (
    <div
      className="relative aspect-video w-full bg-black cursor-pointer group"
      onClick={() => setIsLoaded(true)}
    >
      <img
        src={thumbnailUrl}
        alt={title || "YouTube thumbnail"}
        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-12 bg-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-700 transition-colors">
          <Play className="w-8 h-8 text-white fill-white" />
        </div>
      </div>
    </div>
  );
};

const PlatformPreviewModal: React.FC<PlatformPreviewModalProps> = ({
  isOpen,
  onClose,
  platform,
  publication,
  settings = {},
  theme,
}) => {
  const { t } = useTranslation();

  const getPlatformIcon = () => {
    switch (platform.toLowerCase()) {
      case "facebook":
        return <Facebook className="w-5 h-5 text-[#1877F2]" />;
      case "instagram":
        return <Instagram className="w-5 h-5 text-[#E4405F]" />;
      case "twitter":
      case "x":
        return <Twitter className="w-5 h-5 text-sky-500" />;
      case "youtube":
        return <Youtube className="w-5 h-5 text-[#FF0000]" />;
      case "tiktok":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-1.14-.32-2.4-.3-3.43.3-.74.41-1.3 1.09-1.49 1.92-.09.38-.13.77-.12 1.16.03.75.26 1.48.63 2.11.75 1.28 2.14 2.14 3.59 2.19 1.58.11 3.16-.67 3.92-2.06.35-.63.55-1.33.56-2.05.02-3.34-.01-6.69.01-10.03z" />
          </svg>
        );
      default:
        return <Share2 className="w-5 h-5" />;
    }
  };

  const platformLogs = (publication.social_post_logs || []).filter(
    (log: any) => log.platform.toLowerCase() === platform.toLowerCase()
  );

  const latestLog = [...platformLogs].sort(
    (a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];

  const isPublished =
    latestLog?.status === "published" || latestLog?.status === "success";
  const isPublishing = latestLog?.status === "publishing";
  const isFailed = latestLog?.status === "failed";

  const publishedLog = isPublished ? latestLog : null;

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getTwitterId = (url: string) => {
    if (!url) return null;
    const match = url.match(/status\/(\d+)/);
    return match ? match[1] : null;
  };

  const postUrl = publishedLog?.post_url || publishedLog?.video_url;
  const youTubeId =
    platform.toLowerCase() === "youtube" ? getYouTubeId(postUrl) : null;
  const twitterId =
    platform.toLowerCase() === "twitter" || platform.toLowerCase() === "x"
      ? getTwitterId(postUrl)
      : null;

  const renderMedia = () => {
    const mediaFiles = publication.media || publication.media_files || [];
    if (mediaFiles.length === 0) return null;

    return (
      <div
        className={`mt-3 rounded-lg overflow-hidden border ${
          theme === "dark" ? "border-neutral-700" : "border-gray-200"
        }`}
      >
        <div className="grid grid-cols-1 gap-1">
          {mediaFiles.map((m: any, idx: number) => {
            const url =
              m.file_path ||
              m.preview ||
              (m.media_file && m.media_file.file_path);
            const isVideo =
              m.file_type === "video" ||
              (m.media_file && m.media_file.file_type === "video");

            if (!url) return null;

            const fullUrl = url.startsWith("http") ? url : `/storage/${url}`;

            return (
              <div
                key={idx}
                className="relative aspect-video bg-black flex items-center justify-center"
              >
                {isVideo ? (
                  <video src={fullUrl} className="max-h-full" muted />
                ) : (
                  <img
                    src={fullUrl}
                    alt="Preview"
                    className="max-h-full object-contain"
                  />
                )}
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                      <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTwitterPreview = () => {
    const isThread = settings.twitter?.type === "thread";
    const isPoll = settings.twitter?.type === "poll";

    if (twitterId) {
      return (
        <div className="space-y-4">
          <div
            className={`rounded-lg border border-dashed overflow-hidden ${
              theme === "dark"
                ? "bg-black border-primary-500/30"
                : "bg-white border-primary-500/30"
            }`}
          >
            <div className="p-2 bg-primary-500/10 flex items-center justify-between">
              <span className="text-xs font-bold text-primary-500 flex items-center gap-1">
                <Eye className="w-3 h-3" />{" "}
                {t("publications.modal.preview.real")}
              </span>
              <a
                href={postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-gray-400 hover:text-primary-500 flex items-center gap-1"
              >
                {t("common.viewOnPlatform")}{" "}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div
              className={`w-full flex justify-center py-4 rounded-lg ${
                theme === "dark" ? "bg-black" : "bg-white"
              }`}
            >
              <iframe
                frameBorder="0"
                height="500"
                width="100%"
                src={`https://platform.twitter.com/embed/Tweet.html?id=${twitterId}&theme=${theme}`}
              ></iframe>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div
          className={`p-4 rounded-lg border ${
            theme === "dark"
              ? "bg-black border-neutral-800"
              : "bg-white border-gray-100 shadow-sm"
          }`}
        >
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
              <Eye className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span
                    className={`font-bold text-[15px] ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    User Name
                  </span>
                  <span className="text-gray-500 text-sm">
                    @username · Just now
                  </span>
                </div>
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </div>

              <div
                className={`text-[15px] leading-normal whitespace-pre-wrap ${
                  theme === "dark" ? "text-neutral-200" : "text-gray-900"
                }`}
              >
                {publication.description}
              </div>

              {renderMedia()}

              {isPoll && settings.twitter?.poll_options && (
                <div className="mt-3 space-y-2">
                  {settings.twitter.poll_options
                    .filter((o: string) => o)
                    .map((option: string, i: number) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg border text-sm font-medium ${
                          theme === "dark"
                            ? "border-neutral-700 text-sky-400"
                            : "border-sky-100 text-sky-600 bg-sky-50/30"
                        }`}
                      >
                        {option}
                      </div>
                    ))}
                  <div className="text-xs text-gray-500 mt-1">
                    {settings.twitter.poll_duration || 1440} minutes remaining
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-3 max-w-sm pt-1">
                <MessageCircle className="w-4.5 h-4.5 text-gray-500" />
                <Share2 className="w-4.5 h-4.5 text-gray-500" />
                <Heart className="w-4.5 h-4.5 text-gray-500" />
                <Share2 className="w-4.5 h-4.5 text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {isThread && (
          <div className="pl-14 relative">
            <div className="absolute left-[34px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-neutral-800" />
            <div className="text-sm text-sky-500 font-medium py-2">
              Thread continued...
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInstagramPreview = () => {
    return (
      <div
        className={`max-w-[400px] mx-auto rounded-lg border ${
          theme === "dark"
            ? "bg-black border-neutral-800"
            : "bg-white border-gray-100 shadow-sm"
        } overflow-hidden`}
      >
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2px]">
              <div
                className={`w-full h-full rounded-full border-2 ${
                  theme === "dark"
                    ? "bg-black border-black"
                    : "bg-white border-white"
                } flex items-center justify-center bg-gray-200`}
              />
            </div>
            <span
              className={`text-sm font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              username
            </span>
          </div>
          <MoreHorizontal className="w-5 h-5 text-gray-500" />
        </div>

        {renderMedia()}

        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <Heart
                className={`w-6 h-6 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              />
              <MessageCircle
                className={`w-6 h-6 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              />
              <Share2
                className={`w-6 h-6 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              />
            </div>
            <Share2
              className={`w-6 h-6 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            />
          </div>

          <div
            className={`text-sm ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            <span className="font-bold mr-2">username</span>
            <span className="whitespace-pre-wrap">
              {publication.description}
            </span>
            <div className="text-sky-600 mt-1">{publication.hashtags}</div>
          </div>

          <div className="text-[10px] text-gray-500 uppercase mt-1">
            {format(new Date(), "MMMM d")}
          </div>
        </div>
      </div>
    );
  };

  const renderFacebookPreview = () => {
    return (
      <div
        className={`rounded-lg border ${
          theme === "dark"
            ? "bg-[#242526] border-neutral-700"
            : "bg-white border-gray-200 shadow-sm"
        } overflow-hidden`}
      >
        <div className="p-3 flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1">
            <div
              className={`font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              User Name
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              Just now · <Clock className="w-3 h-3" />
            </div>
          </div>
          <MoreHorizontal className="w-5 h-5 text-gray-500" />
        </div>

        <div
          className={`px-3 pb-2 text-[15px] whitespace-pre-wrap ${
            theme === "dark" ? "text-neutral-200" : "text-gray-900"
          }`}
        >
          {publication.description}
        </div>

        {renderMedia()}

        <div className="px-3 py-2 flex items-center justify-between border-b border-gray-100 dark:border-neutral-800">
          <div className="flex items-center -space-x-1">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center border border-white dark:border-neutral-800">
              <Heart className="w-2.5 h-2.5 text-white" />
            </div>
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center border border-white dark:border-neutral-800">
              <Heart className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div className="text-xs text-gray-500">0 comments · 0 shares</div>
        </div>

        <div className="p-1 flex items-center">
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-colors ${
              theme === "dark"
                ? "text-gray-400 hover:bg-neutral-700"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Heart className="w-4 h-4" /> Like
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-colors ${
              theme === "dark"
                ? "text-gray-400 hover:bg-neutral-700"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <MessageCircle className="w-4 h-4" /> Comment
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-colors ${
              theme === "dark"
                ? "text-gray-400 hover:bg-neutral-700"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>
    );
  };

  const renderYouTubePreview = () => {
    if (youTubeId) {
      return (
        <div
          className={`rounded-lg border border-dashed overflow-hidden ${
            theme === "dark"
              ? "bg-[#0f0f0f] border-primary-500/30"
              : "bg-white border-primary-500/30"
          }`}
        >
          <div className="p-2 bg-primary-500/10 flex items-center justify-between">
            <span className="text-xs font-bold text-primary-500 flex items-center gap-1">
              <Eye className="w-3 h-3" /> {t("publications.modal.preview.real")}
            </span>
            <a
              href={postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-gray-400 hover:text-primary-500 flex items-center gap-1"
            >
              {t("common.viewOnPlatform")} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <LiteYouTube videoId={youTubeId} title={publication.title} />
          <div className="p-3 flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <h3
                className={`font-bold line-clamp-2 leading-tight ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {publication.title}
              </h3>
              <div className="text-xs text-gray-500">
                Channel Name · 0 views · Just now
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`rounded-lg border overflow-hidden ${
          theme === "dark"
            ? "bg-[#0f0f0f] border-neutral-800"
            : "bg-white border-gray-100 shadow-sm"
        }`}
      >
        <div className="relative aspect-video bg-black">{renderMedia()}</div>
        <div className="p-3 flex gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-1">
            <h3
              className={`font-bold line-clamp-2 leading-tight ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {publication.title}
            </h3>
            <div className="text-xs text-gray-500">
              Channel Name · 0 views · Just now
            </div>
          </div>
          <MoreHorizontal className="w-5 h-5 text-gray-500" />
        </div>
      </div>
    );
  };

  const renderTikTokPreview = () => {
    return (
      <div className="max-w-[300px] mx-auto aspect-[9/16] bg-black rounded-lg overflow-hidden relative border-4 border-neutral-800 shadow-2xl">
        <div className="absolute inset-0 flex items-center justify-center">
          {renderMedia()}
        </div>

        {/* TikTok UI Overlay */}
        <div className="absolute right-3 bottom-24 space-y-4 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white" />
          <div className="flex flex-col items-center gap-1">
            <Heart className="w-8 h-8 text-white fill-white" />
            <span className="text-[10px] text-white font-bold text-shadow">
              0
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <MessageCircle className="w-8 h-8 text-white fill-white" />
            <span className="text-[10px] text-white font-bold text-shadow">
              0
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Share2 className="w-8 h-8 text-white fill-white" />
            <span className="text-[10px] text-white font-bold text-shadow">
              0
            </span>
          </div>
        </div>

        <div className="absolute bottom-6 left-3 right-12 space-y-2">
          <div className="text-white font-bold text-sm">@username</div>
          <div className="text-white text-xs whitespace-pre-wrap line-clamp-3">
            {publication.description}
            <span className="font-bold ml-1">{publication.hashtags}</span>
          </div>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="text-white text-[10px] animate-slide-left whitespace-nowrap">
              ♫ Original sound - UserName
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isPublishing) {
      return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
          <p className="text-lg font-medium text-gray-400 uppercase tracking-wider">
            {t("common.processing")}
          </p>
          <p className="text-sm text-gray-400 text-center">
            Your post is being uploaded to {platform}. <br /> This may take a
            few minutes.
          </p>
        </div>
      );
    }

    if (isFailed) {
      return (
        <div
          className={`p-6 rounded-lg border-2 border-red-500/20 bg-red-500/5 ${
            theme === "dark" ? "bg-red-900/10" : ""
          }`}
        >
          <div className="flex items-center gap-3 mb-4 text-red-500">
            <AlertCircle className="w-6 h-6" />
            <h3 className="font-bold text-lg">Publication Failed</h3>
          </div>
          <div
            className={`p-4 rounded-lg bg-black/5 dark:bg-black/40 font-mono text-xs break-words whitespace-pre-wrap ${
              theme === "dark" ? "text-red-400" : "text-red-600"
            }`}
          >
            {latestLog?.error_message ||
              "Unknown error occurred during publication."}
          </div>
          <p className="mt-4 text-[10px] text-gray-500 italic">
            {latestLog?.created_at &&
              format(new Date(latestLog.created_at), "PPP p")}
          </p>
        </div>
      );
    }

    switch (platform.toLowerCase()) {
      case "facebook":
        return renderFacebookPreview();
      case "instagram":
        return renderInstagramPreview();
      case "twitter":
      case "x":
        return renderTwitterPreview();
      case "youtube":
        return renderYouTubePreview();
      case "tiktok":
        return renderTikTokPreview();
      default:
        return (
          <div className="p-8 text-center text-gray-500">
            {t("publications.modal.preview.notAvailable")}
          </div>
        );
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} maxWidth="lg">
      <div className="p-6">
        <div className="custom-scrollbar max-h-[85vh] overflow-y-auto px-1 pb-4 pr-2">
          <h2
            className={`text-xl font-bold mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {`${t("publications.modal.preview.title")}: ${platform}`}
          </h2>
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              theme === "dark" ? "bg-neutral-900/50" : "bg-gray-50"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                theme === "dark" ? "bg-neutral-800" : "bg-white shadow-sm"
              }`}
            >
              {getPlatformIcon()}
            </div>
            <div>
              <div
                className={`font-bold capitalize ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {platform}
              </div>
              <div className="text-xs text-gray-500">
                {publishedLog
                  ? t("publications.modal.preview.realInfo")
                  : t("publications.modal.preview.simulated")}
              </div>
            </div>
            {publishedLog && (
              <div className="ml-auto">
                <a
                  href={postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-bold hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t("common.viewOnPlatform")}
                </a>
              </div>
            )}
          </div>
          {renderContent()}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${
              theme === "dark"
                ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            {t("common.close") || "Close"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PlatformPreviewModal;
