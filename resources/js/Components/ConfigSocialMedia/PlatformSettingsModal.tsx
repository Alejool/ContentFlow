import FacebookSettings from "@/Components/ConfigSocialMedia/FacebookSettings";
import InstagramSettings from "@/Components/ConfigSocialMedia/InstagramSettings";
import TikTokSettings from "@/Components/ConfigSocialMedia/TikTokSettings";
import TwitterSettings from "@/Components/ConfigSocialMedia/TwitterSettings";
import YoutubeSettings from "@/Components/ConfigSocialMedia/YoutubeSettings";
import Modal from "@/Components/common/ui/Modal";
import { useTheme } from "@/Hooks/useTheme";
import { Facebook, Instagram, Twitter, Video, X, Youtube } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PlatformSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: string;
  settings: any;
  onSettingsChange: (newSettings: any) => void;
}

export default function PlatformSettingsModal({
  isOpen,
  onClose,
  platform,
  settings,
  onSettingsChange,
}: PlatformSettingsModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const renderContent = () => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return (
          <YoutubeSettings
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
        );
      case "facebook":
        return (
          <FacebookSettings
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
        );
      case "instagram":
        return (
          <InstagramSettings
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
        );
      case "tiktok":
        return (
          <TikTokSettings
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
        );
      case "twitter":
        return (
          <TwitterSettings
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
        );
      default:
        return null;
    }
  };

  const getPlatformIcon = () => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return <Youtube className="w-6 h-6 text-red-500" />;
      case "facebook":
        return <Facebook className="w-6 h-6 text-blue-500" />;
      case "tiktok":
        return <Video className="w-6 h-6 text-black dark:text-white" />;
      case "twitter":
        return <Twitter className="w-6 h-6 text-sky-500" />;
      case "instagram":
        return <Instagram className="w-6 h-6 text-pink-500" />;
      default:
        return null;
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} maxWidth="2xl">
      <div
        className={`p-6 ${
          theme === "dark"
            ? "bg-neutral-800 text-white"
            : "bg-white text-gray-900"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl ${
                theme === "dark" ? "bg-neutral-700" : "bg-gray-100"
              }`}
            >
              {getPlatformIcon()}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {platform && platform.trim()
                  ? t(
                      `publications.modal.platformSettings.${platform.toLowerCase()}.title`
                    ) || `${platform} Settings`
                  : "Platform Settings"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("common.adjustOptions")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
          <div className="py-4 space-y-6">{renderContent()}</div>
        </div>

        <div className="mt-8 flex justify-end border-t border-gray-200 dark:border-neutral-700 pt-6">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-all active:scale-95 text-sm shadow-md hover:shadow-lg"
          >
            {t("common.done") || "Listo"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
