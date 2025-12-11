import IconFacebook from "@/../assets/Icons/facebook.svg";
import IconTiktok from "@/../assets/Icons/tiktok.svg";
import IconTwitter from "@/../assets/Icons/x.svg";
import IconYoutube from "@/../assets/Icons/youtube.svg";
import { useSocialMediaAuth } from "@/Hooks/useSocialMediaAuth";
import { useTheme } from "@/Hooks/useTheme";
import axios from "axios";
import {
  AlertCircle,
  BarChart3,
  Check,
  ExternalLink,
  Loader2,
  Shield,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface Account {
  id: number;
  platform: string;
  name: string;
  logo: any;
  isConnected: boolean;
  accountId: number | null;
  accountDetails?: any;
  color: string;
  gradient: string;
}

import DisconnectWarningModal from "@/Components/ManageContent/modals/DisconnectWarningModal";

export default function SocialMediaAccounts() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { isLoading, connectAccount, disconnectAccount } = useSocialMediaAuth();
  const disconnectSocialMedia = (
    platform: string,
    id: number | null,
    force: boolean = false
  ) => {
    if (!id) return { success: false };
    return disconnectAccount(id, force);
  };
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: 1,
      platform: "facebook",
      name: "Facebook",
      logo: IconFacebook,
      isConnected: false,
      accountId: null,
      color: theme === "dark" ? "bg-blue-700" : "bg-blue-600",
      gradient: "from-blue-500 to-blue-700",
    },
    {
      id: 3,
      platform: "tiktok",
      name: "TikTok",
      logo: IconTiktok,
      isConnected: false,
      accountId: null,
      color: theme === "dark" ? "bg-neutral-900" : "bg-black",
      gradient: "from-neutral-900 via-neutral-800 to-rose-900",
    },
    {
      id: 4,
      platform: "twitter",
      name: "Twitter",
      logo: IconTwitter,
      isConnected: false,
      accountId: null,
      color: theme === "dark" ? "bg-neutral-800" : "bg-gray-900",
      gradient: "from-neutral-800 to-neutral-900",
    },
    {
      id: 5,
      platform: "youtube",
      name: "YouTube",
      logo: IconYoutube,
      isConnected: false,
      accountId: null,
      color: theme === "dark" ? "bg-primary-700" : "bg-primary-600",
      gradient: "from-primary-600 to-primary-800",
    },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnectedAccounts();

    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "social_auth_callback") {
        if (event.data.success) {
          fetchConnectedAccounts();
        }
      }
    };

    window.addEventListener("message", handleAuthMessage);

    return () => {
      window.removeEventListener("message", handleAuthMessage);
    };
  }, []);

  useEffect(() => {
    setAccounts((prev) =>
      prev.map((account) => ({
        ...account,
        color:
          theme === "dark"
            ? {
                facebook: "bg-blue-700",
                tiktok: "bg-neutral-900",
                twitter: "bg-neutral-800",
                youtube: "bg-primary-700",
              }[account.platform] || "bg-gray-500"
            : {
                facebook: "bg-blue-600",
                tiktok: "bg-black",
                twitter: "bg-gray-900",
                youtube: "bg-primary-600",
              }[account.platform] || "bg-gray-400",
      }))
    );
  }, [theme]);

  const fetchConnectedAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/social-accounts", {
        headers: {
          "X-CSRF-TOKEN": document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content"),
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      if (response.data && response.data.accounts) {
        updateAccountsStatus(response.data.accounts);
      }
    } catch (error: any) {
      console.error("Error loading social accounts:", error);
      if (error.response?.status === 401) {
        toast.error(t("manageContent.socialMedia.messages.unauthorized"));
      } else {
        toast.error(t("manageContent.socialMedia.messages.loadError"));
      }
    } finally {
      setLoading(false);
    }
  };

  const updateAccountsStatus = (connectedAccounts: any[]) => {
    if (!connectedAccounts || connectedAccounts.length === 0) {
      setAccounts((prevAccounts) =>
        prevAccounts.map((account) => ({
          ...account,
          isConnected: false,
          accountId: null,
          accountDetails: null,
        }))
      );
      return;
    }

    setAccounts((prevAccounts) =>
      prevAccounts.map((account) => {
        const connectedAccount = connectedAccounts.find(
          (ca) => ca.platform.toLowerCase() === account.platform.toLowerCase()
        );

        return {
          ...account,
          isConnected: !!connectedAccount,
          accountId: connectedAccount ? connectedAccount.id : null,
          accountDetails: connectedAccount || null,
        };
      })
    );
  };

  const [blockerModalData, setBlockerModalData] = useState<{
    account: any;
    posts: any[];
  } | null>(null);

  const handleConnectionToggle = async (accountId: number) => {
    const account = accounts.find((acc) => acc.id === accountId);

    if (!account) return;

    if (blockerModalData?.account?.id === accountId) {
      setBlockerModalData(null);
    }

    if (account.isConnected) {
      try {
        const result: any = await disconnectSocialMedia(
          account.platform,
          account.accountId
        );

        if (result && result.success) {
          setAccounts((prevAccounts) =>
            prevAccounts.map((acc) =>
              acc.id === accountId
                ? {
                    ...acc,
                    isConnected: false,
                    accountId: null,
                    accountDetails: null,
                  }
                : acc
            )
          );
        } else if (result && !result.success && result.posts) {
          setBlockerModalData({
            account,
            posts: result.posts,
          });
        }
      } catch (error: any) {
        console.error("Disconnect error", error);
      }
    } else {
      try {
        await connectAccount(account.platform);
      } catch (error: any) {
        console.error("Error connecting to social network:", error);
      }
    }
  };

  const handleForceDisconnect = async (accountId: number) => {
    const account = accounts.find((acc) => acc.id === accountId);
    if (!account) return;

    const result = await disconnectSocialMedia(
      account.platform,
      account.accountId,
      true
    );

    if (result && result.success) {
      setAccounts((prevAccounts) =>
        prevAccounts.map((acc) =>
          acc.id === accountId
            ? {
                ...acc,
                isConnected: false,
                accountId: null,
                accountDetails: null,
              }
            : acc
        )
      );
      setBlockerModalData(null);
      toast.success(
        `${account.name} ${t(
          "manageContent.socialMedia.messages.disconnectSuccess"
        )}`
      );
    }
  };

  return (
    <div className="space-y-8">
      <div
        className={`rounded-lg p-8 border transition-colors duration-300
        ${
          theme === "dark"
            ? "bg-gradient-to-br from-neutral-900/80 to-neutral-800/80 border-neutral-700/50"
            : "bg-gradient-to-br from-primary-50/80 to-pink-50/80 border-primary-100"
        }`}
      >
        <div className="flex items-start gap-4">
          <div>
            <h3
              className={`text-lg font-bold mb-3
              ${theme === "dark" ? "text-gray-100" : "text-primary-900"}`}
            >
              {t("manageContent.socialMedia.whyConnect")}
            </h3>

            <div className="grid sm:grid-cols-3 gap-6 mb-6">
              {[
                {
                  icon: Zap,
                  title: t("manageContent.socialMedia.benefits.autoPublish"),
                  color: "text-primary-500",
                },
                {
                  icon: BarChart3,
                  title: t("manageContent.socialMedia.benefits.manageAll"),
                  color: "text-blue-500",
                },
                {
                  icon: Shield,
                  title: t("manageContent.socialMedia.benefits.control"),
                  color: "text-green-500",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex flex-col lg:flex-row items-center gap-3 p-4 rounded-lg
                  ${
                    theme === "dark"
                      ? "bg-neutral-800/30 border border-neutral-700/30"
                      : "bg-white/60 border border-primary-100"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      theme === "dark" ? "bg-neutral-800" : "bg-white"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <p
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {item.title}
                  </p>
                </div>
              ))}
            </div>

            <div
              className={`text-sm p-4 rounded-lg inline-block
              ${
                theme === "dark"
                  ? "bg-neutral-800/40 text-gray-400 border border-neutral-700/40"
                  : "bg-white/60 text-primary-600/80 border border-primary-100"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-semibold">{t("common.note")}:</span>
              </div>
              {t("manageContent.socialMedia.disclaimer")}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div
          className={`flex flex-col items-center justify-center py-12 rounded-lg border transition-colors duration-300
          ${
            theme === "dark"
              ? "bg-neutral-800/50 border-neutral-700/50"
              : "bg-white border-gray-100"
          }`}
        >
          <Loader2
            className={`w-10 h-10 animate-spin mb-4 ${
              theme === "dark" ? "text-primary-400" : "text-primary-600"
            }`}
          />
          <p
            className={`font-medium ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {t("common.loading")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4  gap-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`group relative rounded-lg p-6 border transition-all duration-300 
                hover:shadow-xl 
                ${
                  theme === "dark"
                    ? "bg-neutral-800/70 backdrop-blur-sm border-neutral-700/70 hover:border-neutral-600"
                    : "bg-white/70 backdrop-blur-sm border-gray-100/70 hover:border-gray-200"
                }
                ${
                  account.isConnected
                    ? `ring-1 ${
                        theme === "dark"
                          ? "ring-green-500/20"
                          : "ring-green-100"
                      }`
                    : ""
                }`}
            >
              <div className="absolute top-4 right-4 z-10">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors border
                    ${
                      account.isConnected
                        ? theme === "dark"
                          ? "bg-green-900/30 text-green-400 border-green-900/80"
                          : "bg-green-50 text-green-700 border-green-100"
                        : theme === "dark"
                        ? "bg-neutral-800 text-gray-400 border-neutral-700"
                        : "bg-gray-50 text-gray-500 border-gray-100"
                    }`}
                >
                  {account.isConnected ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                      {t("manageContent.socialMedia.status.connected")}
                    </>
                  ) : (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      {t("manageContent.socialMedia.status.notConnected")}
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center text-center mb-6 pt-2">
                <div className="relative mb-4">
                  <div
                    className={`w-20 h-12 rounded-lg flex items-center justify-center pt-6 
                   `}
                  >
                    <div
                      className={`w-12 h-12 rounded-lg overflow-hidden
                      ${
                        account.isConnected &&
                        account.accountDetails?.account_metadata?.avatar
                          ? ""
                          : "p-2"
                      }
                      `}
                    >
                      {account.isConnected &&
                      account.accountDetails?.account_metadata?.avatar ? (
                        <img
                          src={account.accountDetails.account_metadata.avatar}
                          alt={
                            account.accountDetails.account_name || account.name
                          }
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <img
                          src={account.logo}
                          alt={`${account.name} Logo`}
                          className={`w-full h-full object-contain transition-all duration-300
                             `}
                        />
                      )}
                    </div>
                  </div>

                  {account.isConnected && (
                    <div
                      className={`absolute -bottom-2 -right-2 p-1 rounded-full border-2 shadow-lg
                      ${
                        theme === "dark"
                          ? "bg-gradient-to-r from-green-600 to-green-800 border-neutral-800"
                          : "bg-gradient-to-r from-green-500 to-green-600 border-white"
                      }`}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <h3
                  className={`text-xl font-bold mb-1
                  ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}
                >
                  {account.isConnected && account.accountDetails?.account_name
                    ? account.accountDetails.account_name
                    : account.name}
                </h3>
                {account.isConnected && account.accountDetails ? (
                  <p
                    className={`text-xs font-mono font-bold px-2 py-1 rounded
                    ${
                      theme === "dark"
                        ? "bg-neutral-800 text-gray-400"
                        : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {account.accountDetails.account_metadata?.username
                      ? `@${account.accountDetails.account_metadata.username}`
                      : `ID: ${account.accountDetails.account_id}`}
                  </p>
                ) : (
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {t("manageContent.socialMedia.status.connectToShare")}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleConnectionToggle(account.id)}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 
                  transition-all duration-200 relative overflow-hidden group/btn
                  ${
                    isLoading
                      ? theme === "dark"
                        ? "bg-neutral-700/50 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : account.isConnected
                      ? theme === "dark"
                        ? "bg-gradient-to-r from-primary-900/30 to-primary-800/30 text-primary-300 border border-primary-700/30 hover:from-primary-800/40 hover:to-primary-700/40"
                        : "bg-gradient-to-r from-primary-50 to-primary-50 text-primary-600 border border-primary-200 hover:from-primary-50 hover:to-primary-50"
                      : `bg-gradient-to-r ${account.gradient} text-white shadow-lg hover:shadow-xl hover:scale-[1.02]`
                  }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("manageContent.socialMedia.actions.processing")}
                    </>
                  ) : account.isConnected ? (
                    <>
                      <X className="w-4 h-4" />
                      {t("manageContent.socialMedia.actions.disconnect")}
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      {t("manageContent.socialMedia.actions.connect")}
                    </>
                  )}
                </span>
                <div
                  className={`absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700
                  ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      : "bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  }`}
                ></div>
              </button>
            </div>
          ))}
        </div>
      )}

      {blockerModalData && (
        <DisconnectWarningModal
          isOpen={!!blockerModalData}
          onClose={() => setBlockerModalData(null)}
          onConfirm={() => handleForceDisconnect(blockerModalData.account.id)}
          accountName={blockerModalData.account.name}
          posts={blockerModalData.posts}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
