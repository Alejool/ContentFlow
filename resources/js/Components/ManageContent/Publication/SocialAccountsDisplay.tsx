import { getPlatformConfig } from "@/Constants/socialPlatforms";
import { validateVideoDuration } from "@/Utils/validationUtils";
import { Publication } from "@/types/Publication";
import { AlertTriangle } from "lucide-react";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

interface SocialAccountsDisplayProps {
  publication?: Publication | null;
  connectedAccounts?: any[];
  compact?: boolean;
  showCount?: boolean;
  publishingPlatforms?: number[];
  t?: any;
}

const SocialAccountsDisplay = memo(
  ({
    publication,
    connectedAccounts = [],
    compact = true, // Defaulting to compact for better performance in lists
    showCount = false,
    publishingPlatforms = [],
    t: propsT,
  }: SocialAccountsDisplayProps) => {
    const { t: hookT } = useTranslation();
    const t = propsT || hookT;

    const displayItems = useMemo(() => {
      if (!publication) return [];
      const scheduledPosts = Array.isArray(publication.scheduled_posts)
        ? publication.scheduled_posts
        : [];
      const postLogs = Array.isArray(publication.social_post_logs)
        ? publication.social_post_logs
        : [];

      if (scheduledPosts.length === 0 && postLogs.length === 0) return [];

      const combined = new Map<number, any>();
      scheduledPosts.forEach((p) => {
        if (p && p.social_account_id) combined.set(p.social_account_id, p);
      });
      postLogs.forEach((l) => {
        if (l && l.social_account_id && l.status === "published")
          combined.set(l.social_account_id, l);
      });

      return Array.from(combined.values());
    }, [publication?.scheduled_posts, publication?.social_post_logs]); // Stable dependencies

    const connectedIds = useMemo(
      () => new Set(connectedAccounts.map((a) => a.id)),
      [connectedAccounts],
    );

    if (displayItems.length === 0) {
      return <span className="text-gray-400 text-[10px] italic">No props</span>;
    }

    if (showCount) {
      return (
        <span className="text-xs font-bold text-gray-500">
          {displayItems.length} IDs
        </span>
      );
    }

    return (
      <div className="flex flex-wrap gap-1.5 items-center">
        {displayItems.slice(0, 4).map((item) => {
          const account = item.social_account;
          const platform = (
            account?.platform ||
            item.platform ||
            "social"
          ).toLowerCase();
          const config = getPlatformConfig(platform);
          const isConnected = item.social_account_id
            ? connectedIds.has(item.social_account_id)
            : false;
          const isPublishing = publishingPlatforms.includes(
            item.social_account_id,
          );

          return (
            <div
              key={`${item.id}-${platform}`}
              className={`
              relative w-6 h-6 rounded flex items-center justify-center text-[10px] font-black uppercase transition-all
              ${config.bgClass} ${config.textColor} ${config.borderColor}
              ${config.darkColor} ${config.darkTextColor} ${config.darkBorderColor}
              ${isConnected ? "opacity-100 ring-1 ring-emerald-500/20" : "opacity-40 grayscale scale-95"}
            `}
              title={
                isPublishing
                  ? `Publicando en ${account?.account_name || platform}...`
                  : account?.account_name || "Social Account"
              }
            >
              {platform.slice(0, 1)}
              {isPublishing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded animate-pulse">
                  <svg
                    className="w-4 h-4 text-white animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              )}
              {(() => {
                const video = publication?.media_files?.find(
                  (m) => m.file_type === "video",
                );
                if (!video) return null;
                const duration = video.metadata?.duration || 0;
                const validation = validateVideoDuration(platform, duration);
                if (!validation.isValid) {
                  return (
                    <div className="absolute -top-1 -right-1 bg-red-600 rounded-full border border-white dark:border-neutral-800 animate-pulse">
                      <AlertTriangle className="w-2 h-2 text-white" />
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          );
        })}
        {displayItems.length > 4 && (
          <span className="text-[10px] font-bold text-gray-400">
            +{displayItems.length - 4}
          </span>
        )}
      </div>
    );
  },
);

export default SocialAccountsDisplay;
