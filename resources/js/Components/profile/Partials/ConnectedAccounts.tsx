import IconFacebook from "@/../assets/Icons/facebook.svg";
import IconTiktok from "@/../assets/Icons/tiktok.svg";
import IconTwitter from "@/../assets/Icons/x.svg";
import IconYoutube from "@/../assets/Icons/youtube.svg";
import { Link } from "@inertiajs/react";
import axios from "axios";
import { Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function ConnectedAccounts({ className = "", header = true }) {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      platform: "facebook",
      name: "Facebook",
      logo: IconFacebook,
      isConnected: false,
    },
    // {
    //   id: 2,
    //   platform: "instagram",
    //   name: "Instagram",
    //   logo: IconInstagram,
    //   isConnected: false,
    // },
    {
      id: 3,
      platform: "tiktok",
      name: "TikTok",
      logo: IconTiktok,
      isConnected: false,
    },
    {
      id: 4,
      platform: "twitter",
      name: "Twitter",
      logo: IconTwitter,
      isConnected: false,
    },
    {
      id: 5,
      platform: "youtube",
      name: "YouTube",
      logo: IconYoutube,
      isConnected: false,
    },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  const fetchConnectedAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/social-accounts");
      if (response.data && response.data.accounts) {
        updateAccountsStatus(response.data.accounts);
      }
    } catch (error) {
      console.error("Error loading social accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateAccountsStatus = (connectedAccounts: any[]) => {
    if (!connectedAccounts || connectedAccounts.length === 0) {
      return;
    }

    setAccounts((prevAccounts) =>
      prevAccounts.map((account) => {
        const connectedAccount = connectedAccounts.find(
          (ca: any) =>
            ca.platform.toLowerCase() === account.platform.toLowerCase(),
        );

        return {
          ...account,
          isConnected: !!connectedAccount,
          details: connectedAccount || null,
        };
      }),
    );
  };

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t("profile.connectedAccounts.title")}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("profile.connectedAccounts.description")}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`
                flex items-center p-4 rounded-lg border
                ${
                  account.isConnected
                    ? "bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800/30"
                    : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 opacity-60"
                }
              `}
            >
              <div className="p-2 bg-white dark:bg-neutral-700 rounded-lg mr-4">
                <img
                  src={account.logo}
                  alt={account.name}
                  className="w-6 h-6"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                  {account.name}
                </h4>
                <p
                  className={`text-xs ${
                    account.isConnected
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-500 dark:text-gray-500"
                  }`}
                >
                  {account.isConnected
                    ? t("profile.connectedAccounts.connected")
                    : t("profile.connectedAccounts.notConnected")}
                </p>
              </div>

              {account.isConnected && (
                <div className="flex items-center gap-2">
                  <Link
                    href={route("settings.social")}
                    className="p-1.5 rounded-lg bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-neutral-600"
                    title={t("platformSettings.title")}
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-neutral-700 flex justify-center">
        <a
          href="/settings/social"
          className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          {t("profile.connectedAccounts.manageLink")} →
        </a>
      </div>
    </div>
  );
}
