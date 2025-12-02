import { useState, useEffect, useRef } from "react";
import IconFacebook from "@/../assets/Icons/facebook.svg";
import IconInstagram from "@/../assets/Icons/instagram.svg";
import IconTiktok from "@/../assets/Icons/tiktok.svg";
import IconTwitter from "@/../assets/Icons/x.svg";
import IconYoutube from "@/../assets/Icons/youtube.svg";
import { useSocialMediaAuth } from "@/Hooks/useSocialMediaAuth";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Check,
  X,
  ExternalLink,
  AlertCircle,
  Loader2,
  Link2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SocialMediaAccounts() {
  const { t } = useTranslation();
  const { isAuthenticating, connectSocialMedia, disconnectSocialMedia } =
    useSocialMediaAuth();
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      platform: "facebook",
      name: "Facebook",
      logo: IconFacebook,
      isConnected: false,
      accountId: null,
      color: "bg-blue-600",
    },
    {
      id: 2,
      platform: "instagram",
      name: "Instagram",
      logo: IconInstagram,
      isConnected: false,
      accountId: null,
      color: "bg-pink-600",
    },
    {
      id: 3,
      platform: "tiktok",
      name: "TikTok",
      logo: IconTiktok,
      isConnected: false,
      accountId: null,
      color: "bg-black",
    },
    {
      id: 4,
      platform: "twitter",
      name: "Twitter",
      logo: IconTwitter,
      isConnected: false,
      accountId: null,
      color: "bg-gray-900",
    },
    {
      id: 5,
      platform: "youtube",
      name: "YouTube",
      logo: IconYoutube,
      isConnected: false,
      accountId: null,
      color: "bg-red-600",
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [authInProgress, setAuthInProgress] = useState(false);
  const authWindowRef = useRef(null);
  const authCheckIntervalRef = useRef(null);

  // Load connected accounts when the component starts
  useEffect(() => {
    fetchConnectedAccounts();

    // Configure message listener for authentication
    const handleAuthMessage = (event) => {
      console.log("Message received in SocialMediaAccounts:", event.data);

      if (event.data && event.data.type === "social_auth_callback") {
        setAuthInProgress(false);

        if (event.data.success) {
          toast.success(t("manageContent.socialMedia.messages.connectSuccess"));
          fetchConnectedAccounts(); // Reload accounts after successful authentication
        } else {
          toast.error(
            `${t("manageContent.socialMedia.messages.authError")}: ${
              event.data.message || "Unknown error"
            }`
          );
        }

        // Clear verification interval if it exists
        if (authCheckIntervalRef.current) {
          clearInterval(authCheckIntervalRef.current);
          authCheckIntervalRef.current = null;
        }
      }
    };

    window.addEventListener("message", handleAuthMessage);

    return () => {
      window.removeEventListener("message", handleAuthMessage);
      // Clear verification interval on unmount
      if (authCheckIntervalRef.current) {
        clearInterval(authCheckIntervalRef.current);
      }
    };
  }, []);

  // Function to get connected accounts from the backend
  const fetchConnectedAccounts = async () => {
    try {
      setLoading(true);
      // Ensure the request includes credentials and CSRF token
      const response = await axios.get("/api/social-accounts", {
        headers: {
          "X-CSRF-TOKEN": document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content"),
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        withCredentials: true, // Important for Sanctum
      });

      if (response.data && response.data.accounts) {
        // Update account status with server information
        updateAccountsStatus(response.data.accounts);
      }
    } catch (error) {
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

  // Update account status with server information
  const updateAccountsStatus = (connectedAccounts) => {
    // If there are no connected accounts or the array is empty, keep all default values
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

    // If there are connected accounts, update only those that match by platform
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

  const handleConnectionToggle = async (accountId) => {
    const account = accounts.find((acc) => acc.id === accountId);

    if (!account) return;

    if (account.isConnected) {
      // Disconnect account
      try {
        const success = await disconnectSocialMedia(
          account.platform,
          account.accountId
        );
        if (success) {
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
          toast.success(
            `${account.name} ${t(
              "manageContent.socialMedia.messages.disconnectSuccess"
            )}`
          );
        }
      } catch (error) {
        toast.error(
          `${t("manageContent.socialMedia.messages.disconnectError")} ${
            account.name
          }: ${error.message}`
        );
      }
    } else {
      // Connect account - Improved implementation
      try {
        setAuthInProgress(true);

        // Get authentication URL
        const response = await axios.get(
          `/api/social-accounts/auth-url/${account.platform}`,
          {
            headers: {
              "X-CSRF-TOKEN": document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content"),
              Accept: "application/json",
            },
            withCredentials: true,
          }
        );

        if (response.data.success && response.data.url) {
          // Close any previous authentication window that might be open
          if (authWindowRef.current && !authWindowRef.current.closed) {
            authWindowRef.current.close();
          }

          // Open popup window for authentication
          authWindowRef.current = window.open(
            response.data.url,
            `${account.platform}Auth`,
            "width=600,height=700,left=200,top=100"
          );

          if (!authWindowRef.current) {
            setAuthInProgress(false);
            toast.error(t("manageContent.socialMedia.messages.popupBlocked"));
            return;
          }

          // Check if the window was closed manually
          authCheckIntervalRef.current = setInterval(() => {
            if (authWindowRef.current.closed) {
              clearInterval(authCheckIntervalRef.current);
              authCheckIntervalRef.current = null;
              setAuthInProgress(false);

              // Check if the account connected correctly after a short delay
              setTimeout(() => {
                fetchConnectedAccounts();
              }, 1000);
            }
          }, 500);
        } else {
          setAuthInProgress(false);
          toast.error(t("manageContent.socialMedia.messages.urlError"));
        }
      } catch (error) {
        setAuthInProgress(false);
        console.error("Error connecting to social network:", error);
        toast.error(
          `${t("manageContent.socialMedia.messages.connectError")} ${
            account.name
          }: ${error.response?.data?.message || error.message}`
        );
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Link2 className="w-6 h-6 text-indigo-600" />
            {t("manageContent.socialMedia.title")}
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            {t("manageContent.socialMedia.description")}
          </p>
        </div>
      </div>

      {/* Accounts Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-gray-100">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">{t("common.loading")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`group relative bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                account.isConnected
                  ? "border-green-100 ring-1 ring-green-50"
                  : "border-gray-100 hover:border-indigo-100"
              }`}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    account.isConnected
                      ? "bg-green-50 text-green-700 border border-green-100"
                      : "bg-gray-50 text-gray-500 border border-gray-100"
                  }`}
                >
                  {account.isConnected ? (
                    <>
                      <Check className="w-3 h-3" />
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

              {/* Logo & Name */}
              <div className="flex flex-col items-center text-center mb-6 pt-2">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-2xl mt-3 flex items-center justify-center p-3 transition-transform group-hover:scale-110 duration-300">
                    <img
                      src={account.logo}
                      alt={`${account.name} Logo`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {account.isConnected && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-full border-2 border-white">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {account.name}
                </h3>
                {account.isConnected && account.accountDetails ? (
                  <p className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                    ID: {account.accountDetails.account_id}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    {t("manageContent.socialMedia.status.connectToShare")}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleConnectionToggle(account.id)}
                disabled={isAuthenticating || authInProgress}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                  isAuthenticating || authInProgress
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : account.isConnected
                    ? "bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    : "bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-200 hover:shadow-gray-300"
                }`}
              >
                {isAuthenticating || authInProgress ? (
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
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-8 border border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600 hidden sm:block">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-indigo-900 mb-3">
              {t("manageContent.socialMedia.whyConnect")}
            </h3>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 mb-4">
              <ul className="space-y-2">
                {[
                  t("manageContent.socialMedia.benefits.autoPublish"),
                  t("manageContent.socialMedia.benefits.manageAll"),
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-indigo-800 text-sm"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <ul className="space-y-2">
                {[
                  t("manageContent.socialMedia.benefits.schedule"),
                  t("manageContent.socialMedia.benefits.control"),
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-indigo-800 text-sm"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-indigo-600/80 bg-white/50 p-3 rounded-lg inline-block">
              {t("manageContent.socialMedia.disclaimer")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
