import IconFacebook from "@/../assets/Icons/facebook.svg";
import IconTiktok from "@/../assets/Icons/tiktok.svg";
import IconTwitter from "@/../assets/Icons/x.svg";
import IconYoutube from "@/../assets/Icons/youtube.svg";
import ModernCard from "@/Components/common/Modern/Card";
import { Link } from "@inertiajs/react";
import axios from "axios";
import { Settings, Share2 } from "lucide-react";
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
    <ModernCard
      title={t("profile.connectedAccounts.title")}
      description={t("profile.connectedAccounts.description")}
      icon={Share2}
      headerColor="purple"
      className={className}
      header={header}
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`
                group relative flex items-center p-4 rounded-lg border transition-all duration-300
                ${
                  account.isConnected
                    ? "bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/30 shadow-sm"
                    : "bg-gray-50/50 dark:bg-neutral-800/40 border-gray-100 dark:border-neutral-700/50 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 dark:opacity-40 dark:hover:opacity-100"
                }
                hover:shadow-md hover:scale-[1.02]
              `}
            >
              <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm group-hover:scale-110 transition-transform mr-4">
                <img
                  src={account.logo}
                  alt={account.name}
                  className="w-6 h-6"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate uppercase tracking-tight">
                  {account.name}
                </h4>
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider ${
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
                    className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-purple-100 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors shadow-sm"
                    title={t("platformSettings.title")}
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-neutral-800/50 flex justify-center">
        <a
          href="/ManageContent"
          className="group flex items-center gap-2 text-sm font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors uppercase tracking-widest"
        >
          {t("profile.connectedAccounts.manageLink")}
          <span className="group-hover:translate-x-1 transition-transform">
            &rarr;
          </span>
        </a>
      </div>
    </ModernCard>
  );
}
