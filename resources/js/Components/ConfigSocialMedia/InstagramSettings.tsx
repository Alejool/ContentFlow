import PlatformCard from "@/Components/ConfigSocialMedia/PlatformCard";
import SectionHeader from "@/Components/ConfigSocialMedia/SectionHeader";
import { Instagram, Video } from "lucide-react";
import { useTranslation } from "react-i18next";

interface InstagramSettingsProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

export default function InstagramSettings({
  settings = {},
  onSettingsChange,
}: InstagramSettingsProps) {
  const { t } = useTranslation();

  const handleChange = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SectionHeader title={t("platformSettings.instagram.type")} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PlatformCard
            value="feed"
            label={t("platformSettings.instagram.feed")}
            icon={Instagram}
            iconColor="text-pink-500"
            iconBgColor="bg-pink-100 dark:bg-pink-900/20"
            selected={settings?.type === "feed"}
            onSelect={(val) => handleChange("type", val)}
          />
          <PlatformCard
            value="reel"
            label={t("platformSettings.instagram.reel")}
            icon={Video}
            iconColor="text-pink-500"
            iconBgColor="bg-pink-100 dark:bg-pink-900/20"
            selected={settings?.type === "reel"}
            onSelect={(val) => handleChange("type", val)}
          />
          <PlatformCard
            value="story"
            label={t("platformSettings.instagram.story")}
            icon={Instagram}
            iconColor="text-pink-500"
            iconBgColor="bg-pink-100 dark:bg-pink-900/20"
            selected={settings?.type === "story"}
            onSelect={(val) => handleChange("type", val)}
          />
        </div>
      </div>
    </div>
  );
}
