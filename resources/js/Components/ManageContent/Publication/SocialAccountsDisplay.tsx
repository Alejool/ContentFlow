import { Publication } from "@/types/Publication";
import { useTranslation } from "react-i18next";

interface SocialAccountsDisplayProps {
  publication: Publication;
  connectedAccounts: any[];
  compact?: boolean;
  showCount?: boolean;
}

export default function SocialAccountsDisplay({
  publication,
  connectedAccounts,
  compact = false,
  showCount = false,
}: SocialAccountsDisplayProps) {
  const { t } = useTranslation();
  const scheduledPosts = publication.scheduled_posts || [];
  const postLogs = publication.social_post_logs || [];

  const combined = new Map<number, any>();

  scheduledPosts.forEach((p) => {
    if (p.social_account_id) combined.set(p.social_account_id, p);
  });

  postLogs.forEach((l) => {
    if (l.social_account_id && l.status === "published")
      combined.set(l.social_account_id, l);
  });

  const displayItems = Array.from(combined.values());

  if (displayItems.length === 0) {
    if (compact) {
      return <span className="text-gray-400 text-xs">-</span>;
    }
    return (
      <div className="text-center py-2">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {t("publications.table.noPlatforms")}
        </span>
      </div>
    );
  }

  if (showCount) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-gray-900 dark:text-white">
          {displayItems.length}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          platform{displayItems.length !== 1 ? "s" : ""}
        </span>
      </div>
    );
  }

  if (compact) {
    const uniquePlatforms = Array.from(
      new Set(
        displayItems.map((item) => {
          const account = item.social_account;
          return account?.platform || item.platform || "social";
        })
      )
    );

    return (
      <div className="flex flex-wrap gap-1">
        {uniquePlatforms.map((platform, index) => {
          const platformColor = getPlatformColor(platform);

          return (
            <div
              key={index}
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${platformColor}`}
              title={platform.charAt(0).toUpperCase() + platform.slice(1)}
            >
              {platform.charAt(0).toUpperCase()}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {displayItems.slice(0, 3).map((item) => {
        const account = item.social_account;
        const accountName =
          account?.account_name || item.account_name || "Unknown";
        const platform = account?.platform || item.platform || "Social";
        const metadata = account?.account_metadata || {};
        const email = metadata.email;
        const username = metadata.username;
        const secondary = email || (username ? `@${username}` : null);
        const isConnected = connectedAccounts.some(
          (acc) => acc.id === item.social_account_id
        );

        return (
          <div
            key={`${item.id}-${platform}`}
            className="flex items-start gap-2"
          >
            <div
              className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${isConnected ? "bg-green-500" : "bg-red-500 animate-pulse"
                }`}
              title={isConnected ? "Connected" : "Disconnected"}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPlatformColor(
                    platform
                  )}`}
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </span>
                <span
                  className="text-xs font-medium truncate text-gray-700 dark:text-gray-200"
                >
                  {accountName}
                </span>
              </div>

              {secondary && (
                <span className="text-xs text-gray-400 font-mono truncate block mt-0.5">
                  {secondary}
                </span>
              )}

              {!isConnected && (
                <span className="text-[10px] text-red-500 font-medium uppercase tracking-wider mt-0.5">
                  Disconnected
                </span>
              )}
            </div>
          </div>
        );
      })}

      {displayItems.length > 3 && (
        <div className="text-center pt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            +{displayItems.length - 3} more
          </span>
        </div>
      )}
    </div>
  );
}

function getPlatformColor(platform: string): string {
  switch (platform.toLowerCase()) {
    case "youtube":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
    case "facebook":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "instagram":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800";
    case "twitter":
      return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800";
    case "tiktok":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800";
    case "linkedin":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800";
  }
}
