import FacebookSettings from "@/Components/ConfigSocialMedia/FacebookSettings";
import InstagramSettings from "@/Components/ConfigSocialMedia/InstagramSettings";
import TikTokSettings from "@/Components/ConfigSocialMedia/TikTokSettings";
import TwitterSettings from "@/Components/ConfigSocialMedia/TwitterSettings";
import YoutubeSettings from "@/Components/ConfigSocialMedia/YoutubeSettings";
import Button from "@/Components/common/Modern/Button";
import Modal from "@/Components/common/ui/Modal";
import { useTheme } from "@/Hooks/useTheme";
import {
  Facebook,
  Instagram,
  Settings2,
  Twitter,
  Video,
  X,
  Youtube,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface PlatformSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  platform: string;
  settings: any;
  onSettingsChange: (newSettings: any) => void;
}

export default function PlatformSettingsModal({
  isOpen,
  onClose,
  onSave,
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
        return (
          <Video className="w-6 h-6 text-neutral-950 dark:text-neutral-50" />
        );
      case "twitter":
        return <Twitter className="w-6 h-6 text-sky-500" />;
      case "instagram":
        return <Instagram className="w-6 h-6 text-pink-500" />;
      default:
        return <Settings2 className="w-6 h-6 text-primary-500" />;
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} maxWidth="2xl">
      <div
        className={`relative overflow-hidden ${
          theme === "dark"
            ? "bg-neutral-900 text-white"
            : "bg-white text-neutral-900"
        }`}
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="p-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-5">
              <div
                className={`p-4 rounded-lg shadow-sm ${
                  theme === "dark"
                    ? "bg-neutral-800 border border-neutral-700/50"
                    : "bg-neutral-50 border border-neutral-100"
                }`}
              >
                {getPlatformIcon()}
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase">
                  {platform && platform.trim()
                    ? t(`platformSettings.${platform.toLowerCase()}.title`) ||
                      `${platform} Defaults`
                    : "Platform Defaults"}
                </h2>
                <p
                  className={`text-sm mt-1 font-medium ${
                    theme === "dark" ? "text-neutral-400" : "text-neutral-500"
                  }`}
                >
                  {t("common.adjustOptions") ||
                    "Personaliza las opciones predeterminadas"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-all duration-200 ${
                theme === "dark"
                  ? "hover:bg-neutral-800 text-neutral-400"
                  : "hover:bg-neutral-100 text-neutral-500"
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div
            className={`
            max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar
            ${theme === "dark" ? "scrollbar-dark" : "scrollbar-light"}
          `}
          >
            <div
              className={`
              space-y-8 py-2
              animate-in fade-in slide-in-from-bottom-2 duration-300
            `}
            >
              {renderContent()}
            </div>
          </div>

          <div
            className={`mt-8 flex justify-end pt-8 border-t ${
              theme === "dark" ? "border-neutral-800" : "border-neutral-100"
            }`}
          >
            <Button
              onClick={onSave || onClose}
              variant="primary"
              fullWidth
              size="lg"
              id="save-button"
              type="button"
            >
              {t("platformSettings.button.save") || "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          border-radius: 10px;
        }
        .scrollbar-dark::-webkit-scrollbar-thumb {
          background: #333;
        }
        .scrollbar-light::-webkit-scrollbar-thumb {
          background: #e5e5e5;
        }
      `}</style>
    </Modal>
  );
}
