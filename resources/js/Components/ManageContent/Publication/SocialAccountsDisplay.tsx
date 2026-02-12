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
  t?: any;
}

const SocialAccountsDisplay = memo(
  ({
    publication,
    connectedAccounts = [],
    compact = true, // Defaulting to compact for better performance in lists
    showCount = false,
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

          return (
            <div
              key={`${item.id}-${platform}`}
              className={`
              w-6 h-6 rounded flex items-center justify-center text-[10px] font-black uppercase transition-all
              ${config.bgClass} ${config.textColor} ${config.borderColor}
              ${config.darkColor} ${config.darkTextColor} ${config.darkBorderColor}
              ${isConnected ? "opacity-100 ring-1 ring-emerald-500/20" : "opacity-40 grayscale scale-95"}
            `}
              title={account?.account_name || "Social Account"}
            >
              {platform.slice(0, 1)}
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
