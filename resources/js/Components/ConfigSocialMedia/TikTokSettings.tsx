import OptionCard from "@/Components/ConfigSocialMedia/OptionCard";
import SectionHeader from "@/Components/ConfigSocialMedia/SectionHeader";
import Switch from "@/Components/common/Modern/Switch";
import { Globe, Lock, Users2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TikTokSettingsProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

export default function TikTokSettings({
  settings = {},
  onSettingsChange,
}: TikTokSettingsProps) {
  const { t } = useTranslation();

  const handleChange = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const toggleInteraction = (action: string) => {
    handleChange(`disable_${action}`, !settings?.[`disable_${action}`]);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="space-y-4">
          <SectionHeader title={t("platformSettings.tiktok.privacy")} />
          <div className="grid grid-cols-1 gap-3">
            {[
              {
                value: "public",
                icon: Globe,
                label: t("platformSettings.tiktok.public"),
                description: t("platformSettings.tiktok.publicDescription"),
              },
              {
                value: "friends",
                icon: Users2,
                label: t("platformSettings.tiktok.friends"),
                description: t("platformSettings.tiktok.friendsDescription"),
              },
              {
                value: "private",
                icon: Lock,
                label: t("platformSettings.tiktok.private"),
                description: t("platformSettings.tiktok.privateDescription"),
              },
            ].map(({ value, icon: Icon, label, description }) => (
              <OptionCard
                key={value}
                value={value}
                label={label}
                description={description}
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
          <SectionHeader title={t("platformSettings.tiktok.interactions")} />
          <div className="space-y-3 p-4 border border-gray-200 dark:border-neutral-700 rounded-lg">
            <Switch
              id="tt_comment"
              label={t("platformSettings.tiktok.comments")}
              description={t("platformSettings.tiktok.commentsDescription")}
              checked={!settings?.disable_comment}
              onChange={(checked) => handleChange("disable_comment", !checked)}
            />
            <Switch
              id="tt_duet"
              label={t("platformSettings.tiktok.duets")}
              description={t("platformSettings.tiktok.duetsDescription")}
              checked={!settings?.disable_duet}
              onChange={(checked) => handleChange("disable_duet", !checked)}
            />
            <Switch
              id="tt_stitch"
              label={t("platformSettings.tiktok.stitchs")}
              description={t("platformSettings.tiktok.stitchsDescription")}
              checked={!settings?.disable_stitch}
              onChange={(checked) => handleChange("disable_stitch", !checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
