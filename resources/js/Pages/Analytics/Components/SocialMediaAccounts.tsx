import { useTranslation } from "react-i18next";

interface SocialMediaAccount {
  platform: string;
  followers: number;
  engagement_rate: number;
  reach: number;
  follower_growth_30d: number;
}

interface SocialMediaAccountsProps {
  accounts: SocialMediaAccount[];
  theme?: "light" | "dark";
}

export default function SocialMediaAccounts({
  accounts,
  theme = "light",
}: SocialMediaAccountsProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`rounded-lg p-6 transition-colors duration-300
            ${
              theme === "dark"
                ? "bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50"
                : "bg-white shadow-lg border border-gray-100"
            }`}
    >
      <h2
        className={`text-xl font-bold mb-6
                ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}
      >
        {t("analytics.socialMedia.title")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div
            key={account.platform}
            className={`rounded-lg p-6 transition-all duration-300 hover:scale-[1.02]
                            ${
                              theme === "dark"
                                ? "bg-neutral-800/30 border border-neutral-700/30 hover:border-neutral-600/50"
                                : "border border-gray-200 hover:border-gray-300 hover:shadow-md"
                            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-lg font-semibold capitalize
                                ${
                                  theme === "dark"
                                    ? "text-gray-100"
                                    : "text-gray-900"
                                }`}
              >
                {account.platform}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium
                                ${
                                  account.follower_growth_30d > 0
                                    ? theme === "dark"
                                      ? "bg-green-900/30 text-green-300"
                                      : "bg-green-100 text-green-800"
                                    : theme === "dark"
                                    ? "bg-primary-900/30 text-primary-300"
                                    : "bg-primary-100 text-primary-800"
                                }`}
              >
                {account.follower_growth_30d > 0 ? "+" : ""}
                {account.follower_growth_30d}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span
                  className={
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }
                >
                  {t("analytics.socialMedia.followers")}
                </span>
                <span
                  className={`font-semibold ${
                    theme === "dark" ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {account.followers.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span
                  className={
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }
                >
                  {t("analytics.socialMedia.engagementRate")}
                </span>
                <span
                  className={`font-semibold ${
                    theme === "dark" ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {account.engagement_rate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span
                  className={
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }
                >
                  {t("analytics.socialMedia.reach")}
                </span>
                <span
                  className={`font-semibold ${
                    theme === "dark" ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {account.reach.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
