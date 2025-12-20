import IconFacebook from "@/../assets/Icons/facebook.svg";
import IconInstagram from "@/../assets/Icons/instagram.svg";
import IconTiktok from "@/../assets/Icons/tiktok.svg";
import IconTwitter from "@/../assets/Icons/x.svg";
import IconYoutube from "@/../assets/Icons/youtube.svg";
import Modal from "@/Components/common/ui/Modal";

import { format } from "date-fns";
import {
  AlertCircle,
  Clock,
  ExternalLink,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Play,
  Share2,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";

interface PlatformPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: string;
  publication: any;
  settings?: Record<string, any>;
  theme: "dark" | "light";
}

interface MediaFile {
  file_path?: string;
  preview?: string;
  file_type?: string;
  media_file?: {
    file_path?: string;
    file_type?: string;
  };
}

interface SocialPostLog {
  platform?: string;
  status?: string;
  created_at?: string;
  post_url?: string;
  video_url?: string;
  error_message?: string;
}

const LiteYouTube: React.FC<{ videoId: string; title?: string }> = ({
  videoId,
  title = "YouTube video player",
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  if (isLoaded) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg bg-black group"
      onClick={handleLoad}
      role="button"
      tabIndex={0}
      aria-label={`Play YouTube video: ${title}`}
      onKeyDown={(e) => e.key === "Enter" && handleLoad()}
    >
      <img
        src={thumbnailUrl}
        alt={title}
        className="h-full w-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent">
        <div className="relative w-16 h-12 rounded-lg bg-red-600 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:bg-red-700 shadow-lg">
          <Play className="w-8 h-8 text-white" />
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

  const { latestLog, isPublished, isPublishing, isFailed } = useMemo(() => {
    const logs = (publication?.social_post_logs || []).filter(
      (log: SocialPostLog) =>
        log?.platform?.toLowerCase() === platform.toLowerCase()
    );

    const latest = logs.sort(
      (a: SocialPostLog, b: SocialPostLog) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    )[0];

    return {
      latestLog: latest,
      isPublished:
        latest?.status === "published" || latest?.status === "success",
      isPublishing: latest?.status === "publishing",
      isFailed: latest?.status === "failed",
    };
  }, [publication, platform]);

  const postUrl = latestLog?.post_url || latestLog?.video_url;

  const getYouTubeId = useCallback((url?: string): string | null => {
    if (!url) return null;
    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }, []);

  const getTwitterId = useCallback((url?: string): string | null => {
    if (!url) return null;
    const match = url.match(/status\/(\d+)/);
    return match ? match[1] : null;
  }, []);

  const youTubeId = useMemo(
    () => (platform.toLowerCase() === "youtube" ? getYouTubeId(postUrl) : null),
    [platform, postUrl, getYouTubeId]
  );

  const twitterId = useMemo(
    () =>
      platform.toLowerCase() === "twitter" || platform.toLowerCase() === "x"
        ? getTwitterId(postUrl)
        : null,
    [platform, postUrl, getTwitterId]
  );

  const getPlatformIcon = useCallback(() => {
    const platformLower = platform.toLowerCase();
    const iconProps = { className: "w-5 h-5" };

    switch (platformLower) {
      case "facebook":
        return <img src={IconFacebook} alt="Facebook" {...iconProps} />;
      case "instagram":
        return <img src={IconInstagram} alt="Instagram" {...iconProps} />;
      case "twitter":
      case "x":
        return <img src={IconTwitter} alt="X (Twitter)" {...iconProps} />;
      case "youtube":
        return <img src={IconYoutube} alt="YouTube" {...iconProps} />;
      case "tiktok":
        return <img src={IconTiktok} alt="TikTok" {...iconProps} />;
      default:
        return <Share2 {...iconProps} />;
    }
  }, [platform]);

  const mediaFiles = useMemo((): MediaFile[] => {
    return publication?.media || publication?.media_files || [];
  }, [publication]);

  const renderMedia = useCallback(() => {
    if (mediaFiles.length === 0) return null;

    return (
      <div
        className={`mt-3 overflow-hidden rounded-lg border ${
          theme === "dark" ? "border-neutral-700" : "border-gray-200"
        }`}
      >
        <div className="grid grid-cols-1 gap-1">
          {mediaFiles.map((m: MediaFile, idx: number) => {
            const url = m.file_path || m.preview || m.media_file?.file_path;
            const isVideo =
              m.file_type === "video" || m.media_file?.file_type === "video";

            if (!url) return null;

            const fullUrl = url.startsWith("http") ? url : `/storage/${url}`;

            return (
              <div
                key={`media-${idx}`}
                className="relative flex aspect-video items-center justify-center bg-black"
              >
                {isVideo ? (
                  <video
                    src={fullUrl}
                    className="max-h-full"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={fullUrl}
                    alt="Preview"
                    className="max-h-full object-contain"
                    loading="lazy"
                  />
                )}
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="h-12 w-12 rounded-full border border-white/30 bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <div className="ml-1 h-0 w-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [mediaFiles, theme]);

  const renderTwitterPreview = useCallback(() => {
    const isThread = settings.twitter?.type === "thread";
    const isPoll = settings.twitter?.type === "poll";

    if (twitterId) {
      return (
        <div className="space-y-4">
          <div
            className={`overflow-hidden rounded-lg border border-dashed ${
              theme === "dark"
                ? "border-primary-500/30 bg-black"
                : "border-primary-500/30 bg-white"
            }`}
          >
            <div className="flex items-center justify-between bg-primary-500/10 p-2">
              <span className="flex items-center gap-1 text-xs font-bold text-primary-500">
                <Eye className="h-3 w-3" />
                {t("publications.modal.preview.real")}
              </span>
              <a
                href={postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-primary-500"
              >
                {t("common.viewOnPlatform")}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div
              className={`flex w-full justify-center rounded-lg py-4 ${
                theme === "dark" ? "bg-black" : "bg-white"
              }`}
            >
              <iframe
                frameBorder="0"
                height="500"
                width="100%"
                src={`https://platform.twitter.com/embed/Tweet.html?id=${twitterId}&theme=${theme}`}
                title="Twitter Embed"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div
          className={`rounded-lg border p-4 ${
            theme === "dark"
              ? "border-neutral-800 bg-black"
              : "border-gray-100 bg-white shadow-sm"
          }`}
        >
          <div className="flex gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
              <Eye className="h-6 w-6 text-gray-400" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span
                    className={`text-[15px] font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    User Name
                  </span>
                  <span className="text-sm text-gray-500">
                    @username · Just now
                  </span>
                </div>
                <MoreHorizontal className="h-5 w-5 text-gray-500" />
              </div>

              <div
                className={`whitespace-pre-wrap text-[15px] leading-normal ${
                  theme === "dark" ? "text-neutral-200" : "text-gray-900"
                }`}
              >
                {publication?.description}
              </div>

              {renderMedia()}

              {isPoll && settings.twitter?.poll_options && (
                <div className="mt-3 space-y-2">
                  {settings.twitter.poll_options
                    .filter((o: string) => o.trim())
                    .map((option: string, i: number) => (
                      <div
                        key={`poll-${i}`}
                        className={`rounded-lg border p-2.5 text-sm font-medium ${
                          theme === "dark"
                            ? "border-neutral-700 text-sky-400"
                            : "border-sky-100 bg-sky-50/30 text-sky-600"
                        }`}
                      >
                        {option}
                      </div>
                    ))}
                  <div className="mt-1 text-xs text-gray-500">
                    {settings.twitter.poll_duration || 1440} minutes remaining
                  </div>
                </div>
              )}

              <div className="mt-3 flex max-w-sm items-center justify-between pt-1">
                {[MessageCircle, Share2, Heart, Share2].map((Icon, index) => (
                  <Icon
                    key={`action-${index}`}
                    className="h-4.5 w-4.5 text-gray-500"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {isThread && (
          <div className="relative pl-14">
            <div className="absolute left-[34px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-neutral-800" />
            <div className="py-2 text-sm font-medium text-sky-500">
              Thread continued...
            </div>
          </div>
        )}
      </div>
    );
  }, [theme, settings, publication, renderMedia, twitterId, postUrl, t]);

  const renderInstagramPreview = useCallback(() => {
    return (
      <div
        className={`mx-auto max-w-[400px] overflow-hidden rounded-lg border ${
          theme === "dark"
            ? "border-neutral-800 bg-black"
            : "border-gray-100 bg-white shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2px]">
              <div
                className={`h-full w-full rounded-full border-2 ${
                  theme === "dark"
                    ? "border-black bg-black"
                    : "border-white bg-white"
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
          <MoreHorizontal className="h-5 w-5 text-gray-500" />
        </div>

        {renderMedia()}

        <div className="space-y-2 p-3">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {[Heart, MessageCircle, Share2].map((Icon, index) => (
                <Icon
                  key={`ig-action-${index}`}
                  className={`h-6 w-6 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                />
              ))}
            </div>
            <Share2
              className={`h-6 w-6 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            />
          </div>

          <div
            className={`text-sm ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            <span className="mr-2 font-bold">username</span>
            <span className="whitespace-pre-wrap">
              {publication?.description}
            </span>
            <div className="mt-1 text-sky-600">{publication?.hashtags}</div>
          </div>

          <div className="mt-1 text-[10px] uppercase text-gray-500">
            {format(new Date(), "MMMM d")}
          </div>
        </div>
      </div>
    );
  }, [theme, publication, renderMedia]);

  const renderFacebookPreview = useCallback(() => {
    return (
      <div
        className={`overflow-hidden rounded-lg border ${
          theme === "dark"
            ? "border-neutral-700 bg-[#242526]"
            : "border-gray-200 bg-white shadow-sm"
        }`}
      >
        <div className="flex gap-3 p-3">
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200" />
          <div className="flex-1">
            <div
              className={`font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              User Name
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              Just now · <Clock className="h-3 w-3" />
            </div>
          </div>
          <MoreHorizontal className="h-5 w-5 text-gray-500" />
        </div>

        <div
          className={`whitespace-pre-wrap px-3 pb-2 text-[15px] ${
            theme === "dark" ? "text-neutral-200" : "text-gray-900"
          }`}
        >
          {publication?.description}
        </div>

        {renderMedia()}

        <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2 dark:border-neutral-800">
          <div className="flex items-center -space-x-1">
            {["blue-500", "red-500"].map((color, index) => (
              <div
                key={`reaction-${index}`}
                className={`h-4 w-4 rounded-full bg-${color} flex items-center justify-center border border-white dark:border-neutral-800`}
              >
                <Heart className="h-2.5 w-2.5 text-white" />
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500">0 comments · 0 shares</div>
        </div>

        <div className="flex items-center p-1">
          {["Like", "Comment", "Share"].map((label, index) => {
            const icons = [Heart, MessageCircle, Share2];
            const Icon = icons[index];

            return (
              <button
                key={`fb-action-${index}`}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold transition-colors ${
                  theme === "dark"
                    ? "text-gray-400 hover:bg-neutral-700"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }, [theme, publication, renderMedia]);

  const renderYouTubePreview = useCallback(() => {
    if (youTubeId) {
      return (
        <div
          className={`overflow-hidden rounded-lg border border-dashed ${
            theme === "dark"
              ? "border-primary-500/30 bg-gray-800/10"
              : "border-primary-500/30 bg-white/10"
          }`}
        >
          <div className="flex items-center justify-between bg-primary-500/10 p-2">
            <span className="flex items-center gap-1 text-xs font-bold text-primary-500">
              <Eye className="h-3 w-3" />
              {t("publications.modal.preview.real")}
            </span>
            <a
              href={postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-primary-500"
            >
              {t("common.viewOnPlatform")} <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="aspect-video w-full">
            <LiteYouTubeEmbed
              id={youTubeId}
              title={publication?.title || "Video"}
              poster="hqdefault"
              noCookie={true}
              activatedClass="lyt-activated"
              wrapperClass="yt-lite"
              playerClass="lty-playbtn"
              iframeClass="lty-iframe"
            />
          </div>
        </div>
      );
    }

    // Fallback preview when no YouTube ID
    return (
      <div
        className={`rounded-lg border p-6 text-center ${
          theme === "dark"
            ? "border-neutral-700 bg-gray-900/70 backdrop-blur-sm"
            : "border-gray-200 bg-white/70 backdrop-blur-sm"
        }`}
      >
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <img
                src={IconYoutube}
                alt="YouTube"
                className="mx-auto mb-4 h-12 w-12 opacity-50"
              />
              <p
                className={`${
                  theme === "dark" ? "text-neutral-400" : "text-gray-600"
                }`}
              >
                YouTube preview will appear after publication
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }, [theme, youTubeId, publication, postUrl, t]);

  const renderTikTokPreview = useCallback(() => {
    return (
      <div className="relative mx-auto aspect-[9/16] max-w-[300px] overflow-hidden rounded-lg border-4 border-neutral-800 bg-black shadow-2xl">
        <div className="absolute inset-0 flex items-center justify-center">
          {renderMedia()}
        </div>

        <div className="absolute bottom-24 right-3 flex flex-col items-center space-y-4">
          <div className="h-10 w-10 rounded-full border-2 border-white bg-gray-200" />
          {[
            { Icon: Heart, label: "0" },
            { Icon: MessageCircle, label: "0" },
            { Icon: Share2, label: "0" },
          ].map(({ Icon, label }, index) => (
            <div
              key={`tt-action-${index}`}
              className="flex flex-col items-center gap-1"
            >
              <Icon className="h-8 w-8 fill-white text-white" />
              <span className="text-shadow text-[10px] font-bold text-white">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-6 left-3 right-12 space-y-2">
          <div className="text-sm font-bold text-white">@username</div>
          <div className="line-clamp-3 whitespace-pre-wrap text-xs text-white">
            {publication?.description}
            <span className="ml-1 font-bold">{publication?.hashtags}</span>
          </div>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="animate-slide-left whitespace-nowrap text-[10px] text-white">
              ♫ Original sound - UserName
            </div>
          </div>
        </div>
      </div>
    );
  }, [publication, renderMedia]);

  const renderContent = useCallback(() => {
    if (isPublishing) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 p-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
          <p className="text-lg font-medium uppercase tracking-wider text-gray-400">
            {t("common.processing")}
          </p>
          <p className="text-center text-sm text-gray-400">
            Your post is being uploaded to {platform}. <br /> This may take a
            few minutes.
          </p>
        </div>
      );
    }

    if (isFailed) {
      return (
        <div
          className={`rounded-lg border-2 border-red-500/20 bg-red-500/5 p-6 ${
            theme === "dark" ? "bg-red-900/10" : ""
          }`}
        >
          <div className="mb-4 flex items-center gap-3 text-red-500">
            <AlertCircle className="h-6 w-6" />
            <h3 className="text-lg font-bold">Publication Failed</h3>
          </div>
          <div
            className={`break-words whitespace-pre-wrap rounded-lg p-4 font-mono text-xs ${
              theme === "dark"
                ? "bg-black/40 text-red-400"
                : "bg-black/5 text-red-600"
            }`}
          >
            {latestLog?.error_message ||
              "Unknown error occurred during publication."}
          </div>
          <p className="mt-4 text-[10px] italic text-gray-500">
            {latestLog?.created_at &&
              format(new Date(latestLog.created_at), "PPP p")}
          </p>
        </div>
      );
    }

    const platformRenderers: Record<string, () => JSX.Element | null> = {
      facebook: renderFacebookPreview,
      instagram: renderInstagramPreview,
      twitter: renderTwitterPreview,
      x: renderTwitterPreview,
      youtube: renderYouTubePreview,
      tiktok: renderTikTokPreview,
    };

    const renderer = platformRenderers[platform.toLowerCase()];

    return renderer ? (
      renderer()
    ) : (
      <div className="p-8 text-center text-gray-500">
        {t("publications.modal.preview.notAvailable")}
      </div>
    );
  }, [
    isPublishing,
    isFailed,
    theme,
    platform,
    latestLog,
    t,
    renderFacebookPreview,
    renderInstagramPreview,
    renderTwitterPreview,
    renderYouTubePreview,
    renderTikTokPreview,
  ]);

  const statusInfo = useMemo(() => {
    if (isPublished) return t("publications.modal.preview.realInfo");
    if (isPublishing) return t("common.processing");
    if (isFailed) return t("common.failed");
    return t("publications.modal.preview.simulated");
  }, [isPublished, isPublishing, isFailed, t]);

  return (
    <Modal show={isOpen} onClose={onClose} maxWidth="lg">
      <div className="p-6">
        <div className="custom-scrollbar max-h-[85vh] overflow-y-auto px-1 pb-4 pr-2">
          <h2
            className={`mb-4 text-xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {`${t("publications.modal.preview.title")}: ${platform}`}
          </h2>

          <div
            className={`mb-6 flex items-center gap-3 rounded-lg p-4 ${
              theme === "dark" ? "bg-neutral-900/30" : "bg-gray-50"
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg `}
            >
              {getPlatformIcon()}
            </div>
            <div className="flex-1">
              <div
                className={`font-bold capitalize ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {platform}
              </div>
              <div className="text-xs text-gray-500">{statusInfo}</div>
            </div>

            {isPublished && postUrl && (
              <div className="ml-auto">
                <a
                  href={postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-primary-500/20 transition-colors hover:bg-primary-600"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
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
            className={`rounded-lg px-6 py-2 font-bold transition-all ${
              theme === "dark"
                ? "bg-neutral-700 text-white hover:bg-neutral-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            aria-label={t("common.close") || "Close"}
          >
            {t("common.close") || "Close"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PlatformPreviewModal;
