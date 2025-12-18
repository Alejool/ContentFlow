import OptionCard from "@/Components/ConfigSocialMedia/OptionCard";
import SectionHeader from "@/Components/ConfigSocialMedia/SectionHeader";
import ToggleSwitch from "@/Components/ConfigSocialMedia/ToggleSwitch";
import { Globe, Link2, Lock, Video } from "lucide-react";
import { useTranslation } from "react-i18next";

interface YoutubeSettingsProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

export default function YoutubeSettings({
  settings = {},
  onSettingsChange,
}: YoutubeSettingsProps) {
  const { t } = useTranslation();

  const handleChange = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="space-y-4">
          <SectionHeader
            title={t("publications.modal.platformSettings.youtube.contentType")}
          />
          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-neutral-700 rounded-lg hover:border-primary-500 cursor-pointer transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white block">
                    {t("publications.modal.platformSettings.youtube.video")}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t("publications.modal.platformSettings.youtube.videoStandard")}
                  </span>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  settings?.type === "video"
                    ? "border-primary-500 bg-primary-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                {settings?.type === "video" && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <input
                type="radio"
                name="yt_type"
                value="video"
                checked={settings?.type === "video"}
                onChange={() => handleChange("type", "video")}
                className="hidden"
              />
            </label>

            <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-neutral-700 rounded-lg hover:border-primary-500 cursor-pointer transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-red-500 rotate-90" />
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white block">
                    {t("publications.modal.platformSettings.youtube.short")}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t("publications.modal.platformSettings.youtube.shortVertical")}
                  </span>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  settings?.type === "short"
                    ? "border-primary-500 bg-primary-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                {settings?.type === "short" && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <input
                type="radio"
                name="yt_type"
                value="short"
                checked={settings?.type === "short"}
                onChange={() => handleChange("type", "short")}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader
            title={t("publications.modal.platformSettings.youtube.privacy")}
          />
          <div className="grid grid-cols-1  gap-2">
            {[
              {
                value: "public",
                icon: Globe,
                label: t("publications.modal.platformSettings.youtube.public"),
              },
              {
                value: "private",
                icon: Lock,
                label: t("publications.modal.platformSettings.youtube.private"),
              },
              {
                value: "unlisted",
                icon: Link2,
                label: t(
                  "publications.modal.platformSettings.youtube.unlisted"
                ),
              },
            ].map(({ value, icon: Icon, label }) => (
              <OptionCard
                key={value}
                value={value}
                label={label}
                icon={Icon}
                selected={settings?.privacy === value}
                onSelect={(val) => handleChange("privacy", val)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <SectionHeader title="Configuración adicional" />
          <div className="p-4 border border-gray-200 dark:border-neutral-700 rounded-lg">
            <ToggleSwitch
              id="yt_kids"
              label={t(
                "publications.modal.platformSettings.youtube.madeForKids"
              )}
              description="Contenido para audiencia infantil"
              checked={settings?.made_for_kids || false}
              onChange={(checked) => handleChange("made_for_kids", checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
