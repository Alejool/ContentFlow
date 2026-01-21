import PlatformSettingsModal from "@/Components/ConfigSocialMedia/PlatformSettingsModal";
import DisconnectWarningModal from "@/Components/ManageContent/modals/DisconnectWarningModal";
import { SOCIAL_PLATFORMS } from "@/Constants/socialPlatforms";
import { useSocialMediaAuth } from "@/Hooks/useSocialMediaAuth";
import { getPlatformSchema } from "@/schemas/platformSettings";
import { Link, router, usePage } from "@inertiajs/react";
import axios from "axios";
import {
  AlertCircle,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Settings,
  Shield,
  X,
  Zap,
} from "lucide-react";
import { memo, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface Account {
  id: number; // For connected accounts, this is the DB ID. For unconnected, it might be platform index.
  platform: string;
  name: string;
  logo: any;
  isConnected: boolean;
  accountId: number | string | null;
  accountDetails?: any;
  color: string;
  gradient: string;
  connectedBy?: string;
}

const SocialMediaAccounts = memo(() => {
  const { t } = useTranslation();
  const { isLoading, connectAccount, disconnectAccount } = useSocialMediaAuth();
  const user = usePage<any>().props.auth.user;
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState<any>({});

  useEffect(() => {
    if (user?.global_platform_settings) {
      setLocalSettings(user.global_platform_settings);
    }
  }, [user?.global_platform_settings]);

  const handleOpenSettings = (platform: string) => {
    setActivePlatform(platform);
  };

  const handleCloseSettings = () => {
    setActivePlatform(null);
  };

  const handleSettingsChange = (newSettings: any) => {
    if (!activePlatform) return;
    const updated = {
      ...localSettings,
      [activePlatform.toLowerCase()]: newSettings,
    };
    setLocalSettings(updated);
  };

  const saveSettings = () => {
    if (!activePlatform) return;

    const schema = getPlatformSchema(activePlatform);
    const settingsToSave = localSettings[activePlatform.toLowerCase()] || {};
    const result = schema.safeParse(settingsToSave);

    if (!result.success) {
      result.error.issues.forEach((issue: any) => {
        toast.error(t(issue.message));
      });
      return;
    }

    router.patch(
      route("settings.social.update"),
      {
        settings: localSettings,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          const message =
            t("platformSettings.messages.success") +
            " " +
            activePlatform.toLowerCase();
          toast.success(message);
          handleCloseSettings();
        },
        onError: () => {
          toast.error(t("common.error") || "Error al guardar");
        },
      },
    );
  };

  const [isExpanded, setIsExpanded] = useState(false);

  const disconnectSocialMedia = (
    platform: string,
    id: number | null,
    force: boolean = false,
  ) => {
    if (!id) return { success: false };
    return disconnectAccount(id, force);
  };

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectedAccountsCount, setConnectedAccountsCount] = useState(0);

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
    const count = connectedAccounts?.length || 0;
    setConnectedAccountsCount(count);

    const platformCards: Account[] = [];

    Object.entries(SOCIAL_PLATFORMS).forEach(([key, config]) => {
      const filtered = connectedAccounts.filter(
        (ca) => ca.platform.toLowerCase() === key.toLowerCase(),
      );

      if (filtered.length === 0) {
        // Not connected: Add one placeholder card
        platformCards.push({
          id: config.id, // Using config ID as a stable key for placeholder
          platform: key,
          name: config.name,
          logo: config.logo,
          isConnected: false,
          accountId: null,
          color: config.color,
          gradient: config.gradient,
        });
      } else {
        // Connected: Add a card for each connected account
        filtered.forEach((ca) => {
          platformCards.push({
            id: ca.id, // Real DB ID
            platform: key,
            name: config.name,
            logo: config.logo,
            isConnected: true,
            accountId: ca.id,
            accountDetails: ca,
            color: config.color,
            gradient: config.gradient,
            connectedBy: ca.user?.name,
          });
        });
      }
    });

    setAccounts(platformCards);
  };

  const [blockerModalData, setBlockerModalData] = useState<{
    account: any;
    posts: any[];
  } | null>(null);

  const handleConnectionToggle = async (account: Account) => {
    if (blockerModalData?.account?.id === account.id) {
      setBlockerModalData(null);
    }

    if (account.isConnected) {
      try {
        const result: any = await disconnectSocialMedia(
          account.platform,
          account.accountId as number,
        );

        if (result && result.success) {
          fetchConnectedAccounts(); // Refresh to regroup
          setConnectedAccountsCount((prev) => prev - 1);
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

  const handleForceDisconnect = async (account: Account) => {
    const result = await disconnectSocialMedia(
      account.platform,
      account.accountId as number,
      true,
    );

    if (result && result.success) {
      fetchConnectedAccounts(); // Refresh
      setConnectedAccountsCount((prev) => prev - 1);
      setBlockerModalData(null);
      toast.success(
        `${account.name} ${t(
          "manageContent.socialMedia.messages.disconnectSuccess",
        )}`,
      );
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:shadow-sm bg-white border-gray-200 hover:border-gray-300 dark:bg-black/70 dark:border-black/50 dark:hover:border-neutral-600"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-black/50">
            <BarChart3 className="w-5 h-5 text-primary-500" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {t("manageContent.socialMedia.title")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {connectedAccountsCount} {t("manageContent.socialMedia.accounts")}{" "}
              {t("manageContent.socialMedia.connected")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href={route("profile.edit")}
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg transition-all bg-primary-50 text-primary-600 hover:bg-primary-100 hover:text-primary-700 dark:bg-neutral-800 dark:text-primary-400 dark:hover:bg-neutral-700 dark:hover:text-primary-300"
            title={t("nav.profile") || "Perfil"}
          >
            <Settings className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-2">
            {isExpanded ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t("manageContent.socialMedia.hide")}
                </span>
                <ChevronUp className="w-5 h-5 text-gray-500" />
              </>
            ) : (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t("manageContent.socialMedia.seeAccounts")}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </>
            )}
          </div>
        </div>
      </button>

      <div
        className={`transition-all duration-300 overflow-hidden ${
          isExpanded ? "max-h-[2000px] opacity-100 mt-4" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-8">
          <div className="rounded-lg p-4 sm:p-8 border transition-colors duration-300 bg-gradient-to-br from-primary-50/80 to-pink-50/80 border-primary-100 dark:from-neutral-900/80 dark:to-neutral-800/80 dark:border-neutral-700/50">
            <div className="flex items-start gap-4">
              <div>
                <h3 className="text-lg font-bold mb-3 text-primary-900 dark:text-gray-100">
                  {t("manageContent.socialMedia.whyConnect")}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {[
                    {
                      icon: Zap,
                      title: t(
                        "manageContent.socialMedia.benefits.autoPublish",
                      ),
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
                      className="flex items-center gap-3 p-3.5 rounded-lg bg-white/60 border border-primary-100 dark:bg-neutral-800/30 dark:border-neutral-700/30 transition-transform hover:scale-[1.02]"
                    >
                      <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 shadow-sm flex-shrink-0">
                        <item.icon
                          className={`w-4 h-4 sm:w-5 sm:h-5 ${item.color}`}
                        />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 leading-tight">
                        {item.title}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] sm:text-xs p-3 rounded-lg inline-flex bg-white/60 text-primary-600/80 border border-primary-100 dark:bg-neutral-800/40 dark:text-gray-400 dark:border-neutral-700/40 group">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="font-bold uppercase tracking-wider">
                      {t("common.note")}:
                    </span>
                    <span className="font-medium">
                      {t("manageContent.socialMedia.disclaimer")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl border transition-colors duration-300 bg-white border-gray-100 dark:bg-neutral-800/50 dark:border-neutral-700/50">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-600 dark:text-primary-400" />
              <p className="font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-widest">
                {t("common.loading")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {accounts.map((account) => (
                <div
                  key={`${account.platform}-${account.id}`}
                  className={`group relative rounded-2xl p-4 sm:p-5 border transition-all duration-300
                    hover:shadow-xl bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 hover:border-primary-100 dark:hover:border-primary-900/30
                    ${
                      account.isConnected
                        ? "ring-1 ring-emerald-500/10 dark:ring-emerald-500/5"
                        : "opacity-90 hover:opacity-100"
                    }`}
                >
                  <div className="absolute top-4 right-4 z-10">
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight transition-colors border
                        ${
                          account.isConnected
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/80"
                            : "bg-gray-50 text-gray-500 border-gray-100 dark:bg-neutral-800 dark:text-gray-400 dark:border-neutral-700"
                        }`}
                    >
                      {account.isConnected ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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

                  <div className="flex flex-col items-center text-center mb-5 pt-3">
                    <div className="relative mb-4 group-hover:scale-110 transition-transform duration-300">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center p-0.5 border border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800 overflow-hidden shadow-inner">
                        {account.isConnected &&
                        account.accountDetails?.account_metadata?.avatar ? (
                          <img
                            src={account.accountDetails.account_metadata.avatar}
                            alt={
                              account.accountDetails.account_name ||
                              account.name
                            }
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="p-3 w-full h-full">
                            <img
                              src={account.logo}
                              alt={`${account.name} Logo`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </div>

                      {account.isConnected && (
                        <div className="absolute -bottom-1 -right-1 p-1 rounded-full border-2 shadow-lg bg-emerald-500 border-white dark:border-neutral-900">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate w-full px-2 leading-tight">
                      {account.isConnected &&
                      account.accountDetails?.account_name
                        ? account.accountDetails.account_name
                        : account.name}
                    </h3>

                    {account.isConnected && account.accountDetails ? (
                      <div className="flex flex-col gap-1 items-center mt-1.5">
                        <p className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 dark:bg-neutral-800 dark:text-gray-400 border border-gray-100 dark:border-neutral-700/50">
                          {account.accountDetails.account_metadata?.username
                            ? `@${account.accountDetails.account_metadata.username}`
                            : `ID: ${account.accountDetails.account_id}`}
                        </p>
                        {account.connectedBy && (
                          <p className="text-[9px] text-primary-500 font-bold uppercase tracking-wider">
                            {t("manageContent.socialMedia.connectedBy") ||
                              "Conectado por"}
                            : {account.connectedBy}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("manageContent.socialMedia.status.connectToShare")}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => handleConnectionToggle(account)}
                      disabled={isLoading}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2
                        transition-all duration-200 relative overflow-hidden group/btn
                        ${
                          isLoading
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-neutral-700/50"
                            : account.isConnected
                              ? "bg-gradient-to-r from-primary-50 to-primary-50 text-primary-600 border border-primary-200 hover:bg-primary-100 dark:bg-gradient-to-r dark:from-primary-900/10 dark:to-primary-800/10 dark:text-primary-400 dark:border-primary-900/30 dark:hover:bg-primary-900/20"
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
                      {!isLoading && (
                        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5"></div>
                      )}
                    </button>

                    {account.isConnected && (
                      <button
                        onClick={() => handleOpenSettings(account.platform)}
                        className="p-3 rounded-lg border transition-all flex items-center justify-center bg-white border-gray-200 text-primary-600 hover:bg-gray-50 hover:border-gray-300 shadow-sm dark:bg-neutral-800 dark:border-neutral-700 dark:text-primary-400 dark:hover:bg-neutral-700 dark:hover:border-neutral-600"
                        title={t("platformSettings.title")}
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {blockerModalData && (
            <DisconnectWarningModal
              isOpen={!!blockerModalData}
              onClose={() => setBlockerModalData(null)}
              onConfirm={() =>
                handleForceDisconnect(blockerModalData.account.id)
              }
              accountName={blockerModalData.account.name}
              posts={blockerModalData.posts}
              isLoading={isLoading}
            />
          )}

          {activePlatform && (
            <PlatformSettingsModal
              isOpen={!!activePlatform}
              onClose={handleCloseSettings}
              onSave={saveSettings}
              platform={activePlatform}
              settings={localSettings[activePlatform.toLowerCase()] || {}}
              onSettingsChange={handleSettingsChange}
            />
          )}
        </div>
      </div>
    </div>
  );
});

export default SocialMediaAccounts;
