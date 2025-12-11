import { Publication } from "@/types/Publication";

interface SocialAccountsDisplayProps {
  publication: Publication;
  connectedAccounts: any[];
  theme: string;
}

export default function SocialAccountsDisplay({
  publication,
  connectedAccounts,
  theme,
}: SocialAccountsDisplayProps) {
  const scheduledPosts = publication.scheduled_posts || [];
  const postLogs = publication.social_post_logs || [];

  // Combine entries, preferring logs (actual status) over scheduled
  const combined = new Map<number, any>();

  // Add scheduled first
  scheduledPosts.forEach((p) => {
    if (p.social_account_id) combined.set(p.social_account_id, p);
  });

  // Add logs (overwriting scheduled if same account)
  postLogs.forEach((l) => {
    if (l.social_account_id && l.status !== "deleted")
      combined.set(l.social_account_id, l);
  });

  const displayItems = Array.from(combined.values());

  if (displayItems.length === 0)
    return <span className="text-gray-400 text-xs">-</span>;

  return (
    <div className="flex flex-col gap-3">
      {displayItems.map((item) => {
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
              className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                isConnected ? "bg-green-500" : "bg-red-500 animate-pulse"
              }`}
              title={isConnected ? "Connected" : "Disconnected"}
            />
            <div className="flex flex-col">
              <span
                className={`text-sm font-medium leading-tight ${
                  theme === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
              >
                {platform && (
                  <span className="capitalize text-xs text-primary-500/80 mr-1.5 font-bold">
                    {platform}
                  </span>
                )}
                {accountName}
              </span>
              {secondary && (
                <span className="text-xs text-gray-400 font-mono mt-0.5">
                  {secondary}
                </span>
              )}
              {!isConnected && (
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-0.5">
                  Disconnected
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
