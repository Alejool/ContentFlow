import React, { useState, useEffect } from "react";
import axios from "axios";
import ModernCard from "@/Components/Modern/ModernCard";
import IconFacebook from "@/../assets/Icons/facebook.svg";
import IconInstagram from "@/../assets/Icons/instagram.svg";
import IconTiktok from "@/../assets/Icons/tiktok.svg";
import IconTwitter from "@/../assets/Icons/x.svg";
import IconYoutube from "@/../assets/Icons/youtube.svg";

const ShareIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
    />
  </svg>
);

export default function ConnectedAccounts({ className = "" }) {
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      platform: "facebook",
      name: "Facebook",
      logo: IconFacebook,
      isConnected: false,
    },
    {
      id: 2,
      platform: "instagram",
      name: "Instagram",
      logo: IconInstagram,
      isConnected: false,
    },
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
      const response = await axios.get("/api/social-accounts");
      if (response.data && response.data.accounts) {
        updateAccountsStatus(response.data.accounts);
      }
    } catch (error) {
      console.error("Error loading social accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateAccountsStatus = (connectedAccounts) => {
    if (!connectedAccounts || connectedAccounts.length === 0) {
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
          details: connectedAccount || null,
        };
      })
    );
  };

  return (
    <ModernCard
      title="Connected Social Accounts"
      description="Manage your connected social media profiles for content publishing."
      icon={ShareIcon}
      headerColor="purple"
      className={className}
    >
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`flex items-center p-3 rounded-xl border transition-all duration-200 ${
                account.isConnected
                  ? "bg-purple-50 border-purple-200 shadow-sm"
                  : "bg-gray-50 border-gray-100 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
              }`}
            >
              <img
                src={account.logo}
                alt={account.name}
                className="w-8 h-8 mr-3"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 text-sm">
                  {account.name}
                </h4>
                <p
                  className={`text-xs font-medium ${
                    account.isConnected ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {account.isConnected ? "Connected" : "Not Connected"}
                </p>
              </div>
              {account.isConnected && (
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-center">
        <a
          href="/manage-content"
          className="text-sm text-purple-600 hover:text-purple-800 font-medium hover:underline"
        >
          Manage connections in Content Manager &rarr;
        </a>
      </div>
    </ModernCard>
  );
}
