import OptionCard from "@/Components/ConfigSocialMedia/OptionCard";
import SectionHeader from "@/Components/ConfigSocialMedia/SectionHeader";
import ToggleSwitch from "@/Components/ConfigSocialMedia/ToggleSwitch";
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
          <SectionHeader
            title={t("publications.modal.platformSettings.tiktok.privacy")}
          />
          <div className="grid grid-cols-1 gap-3">
            {[
              {
                value: "public",
                icon: Globe,
                label: t("publications.modal.platformSettings.tiktok.public"),
                description: t("publications.modal.platformSettings.tiktok.publicDescription"),
              },
              {
                value: "friends",
                icon: Users2,
                label: t("publications.modal.platformSettings.tiktok.friends"),
                description: t("publications.modal.platformSettings.tiktok.friendsDescription"),
              },
              {
                value: "private",
                icon: Lock,
                label: t("publications.modal.platformSettings.tiktok.private"),
                description: t("publications.modal.platformSettings.tiktok.privateDescription"),
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
          <SectionHeader
            title={t("publications.modal.platformSettings.tiktok.interactions")}
          />
          <div className="space-y-3 p-4 border border-gray-200 dark:border-neutral-700 rounded-lg">
            <ToggleSwitch
              id="tt_comment"
              label={t("publications.modal.platformSettings.tiktok.comments")}
              description={t("publications.modal.platformSettings.tiktok.commentsDescription")}
              checked={!settings?.disable_comment}
              onChange={(checked) => handleChange("disable_comment", !checked)}
            />
            <ToggleSwitch
              id="tt_duet"
              label={t("publications.modal.platformSettings.tiktok.duets")}
              description={t("publications.modal.platformSettings.tiktok.duetsDescription")}
              checked={!settings?.disable_duet}
              onChange={(checked) => handleChange("disable_duet", !checked)}
            />
            <ToggleSwitch
              id="tt_stitch"
              label={t("publications.modal.platformSettings.tiktok.stitchs")}
              description={t("publications.modal.platformSettings.tiktok.stitchsDescription")}
              checked={!settings?.disable_stitch}
              onChange={(checked) => handleChange("disable_stitch", !checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
