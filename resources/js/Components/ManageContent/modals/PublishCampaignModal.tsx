import IconFacebook from "@/../assets/Icons/facebook.svg";
import IconInstagram from "@/../assets/Icons/instagram.svg";
import IconTiktok from "@/../assets/Icons/tiktok.svg";
import IconTwitter from "@/../assets/Icons/x.svg";
import IconYoutube from "@/../assets/Icons/youtube.svg";
import { useTheme } from "@/Hooks/useTheme";
import { Campaign } from "@/types/Campaign";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import axios from "axios";
import { CheckCircle, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useAccountsStore } from "@/stores/socialAccountsStore";

interface PublishCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
}


export default function PublishCampaignModal({
  isOpen,
  onClose,
  campaign,
}: PublishCampaignModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [miniature, setMiniature] = useState<boolean>(false);

  const { accounts: socialAccounts, fetchAccounts: fetchSocialAccounts } =
    useAccountsStore();

    useEffect(() => {
      if (isOpen) {
        socialAccounts.filter((acc) => acc.is_active)
      }
    }, [isOpen]);



  const togglePlatform = (accountId: number) => {
    setSelectedPlatforms((prev) =>
      prev.includes(accountId)
    ? prev.filter((id) => id !== accountId)
    : [...prev, accountId]
  );

  const account = socialAccounts.find((acc) => acc.id === accountId);
  const selectedAccount = selectedPlatforms.find((id) => id === accountId);

  (account?.platform === "youtube" && selectedAccount) ? setMiniature(true) : setMiniature(false);

  };

  const selectAll = () => {
    setSelectedPlatforms(socialAccounts.map((acc) => acc.id));
  };

  const deselectAll = () => {
    setSelectedPlatforms([]);
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    if (!campaign) return;

    setPublishing(true);
    try {
      await axios.post(`/campaigns/${campaign.id}/publish`, {
        platforms: selectedPlatforms,
      });
      toast.success("Campaign published successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error publishing campaign");
    } finally {
      setPublishing(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: any = {
      facebook: IconFacebook,
      twitter: IconTwitter,
      instagram: IconInstagram,
      tiktok: IconTiktok,
      youtube: IconYoutube,
    };
    return icons[platform.toLowerCase()];
  };

  const getPlatformGradient = (platform: string) => {
    const gradients: any = { 
      facebook: "from-blue-500 to-blue-700",
      twitter: "from-neutral-800 to-neutral-900",
      instagram: "from-pink-500 to-purple-700",
      tiktok: "from-neutral-900 via-neutral-800 to-rose-900",
      youtube: "from-primary-600 to-primary-800",
    };
    return gradients[platform.toLowerCase()] || "from-gray-500 to-gray-700";
  };

  if (!campaign) return null;

  return (
    <>
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className={`w-full max-w-2xl rounded-lg p-8 shadow-2xl
            ${
              theme === "dark"
                ? "bg-neutral-800 border border-neutral-700"
                : "bg-white"
            }
          `}
        >
          <div className="flex items-center justify-between mb-6">
            <DialogTitle
              className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-primary-500 to-pink-500 rounded-lg">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                Publish Campaign
              </div>
            </DialogTitle>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark"
                  ? "hover:bg-neutral-700 text-gray-400"
                  : "hover:bg-gray-100 text-gray-500"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className={`mb-6 p-4 rounded-lg ${
              theme === "dark" ? "bg-neutral-900/50" : "bg-gray-50"
            }`}
          >
            <h3
              className={`font-semibold mb-1 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {campaign.title}
            </h3>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {campaign.description}
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4
                className={`font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Select Platforms
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                >
                  Select All
                </button>
                <span
                  className={
                    theme === "dark" ? "text-gray-600" : "text-gray-400"
                  }
                >
                  |
                </span>
                <button
                  onClick={deselectAll}
                  className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              </div>
            ) : socialAccounts.length === 0 ? (
              <div
                className={`text-center py-8 rounded-lg ${
                  theme === "dark" ? "bg-neutral-900/50" : "bg-gray-50"
                }`}
              >
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  No connected social media accounts found.
                  <br />
                  Please connect your accounts first.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {socialAccounts.map((account) => {
                  const iconSrc = getPlatformIcon(account.platform);
                  const gradient = getPlatformGradient(account.platform);
                  const isSelected = selectedPlatforms.includes(account.id);

                  return (
                    <button
                      key={account.id}
                      onClick={() => togglePlatform(account.id)}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                          : theme === "dark"
                          ? "border-neutral-700 hover:border-neutral-600 bg-neutral-900/30"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}
                      >
                        <img
                          src={iconSrc}
                          alt={account.platform}
                          className="w-5 h-5"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p
                          className={`font-medium capitalize ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {account.platform}
                        </p>
                        <p
                          className={`text-xs ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {account.account_name}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-primary-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                theme === "dark"
                  ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing || selectedPlatforms.length === 0}
              className="flex-1 px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {publishing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Publishing...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Publish to {selectedPlatforms.length} Platform
                  {selectedPlatforms.length !== 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>

    {miniature && (
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div>Neceista miniatura</div>
      </div>
    ) }
    </>
  );
}
