import PlatformCard from "@/Components/ConfigSocialMedia/PlatformCard";
import SectionHeader from "@/Components/ConfigSocialMedia/SectionHeader";
import { Facebook, Video } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FacebookSettingsProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

export default function FacebookSettings({
  settings = {},
  onSettingsChange,
}: FacebookSettingsProps) {
  const { t } = useTranslation();

  const handleChange = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SectionHeader
          title={t("platformSettings.facebook.type")}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PlatformCard
            value="feed"
            label={t("platformSettings.facebook.feed")}
            description={t("platformSettings.facebook.feedDescription")}
            icon={Facebook}
            iconColor="text-blue-500"
            iconBgColor="bg-blue-100 dark:bg-blue-900/20"
            selected={settings?.type === "feed"}
            onSelect={(val) => handleChange("type", val)}
          />
          <PlatformCard
            value="reel"
            label={t("platformSettings.facebook.reel")}
            description={t("platformSettings.facebook.reelDescription")}
            icon={Video}
            iconColor="text-blue-500"
            iconBgColor="bg-blue-100 dark:bg-blue-900/20"
            selected={settings?.type === "reel"}
            onSelect={(val) => handleChange("type", val)}
          />
        </div>
      </div>
    </div>
  );
}
