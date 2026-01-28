import OptionCard from "@/Components/ConfigSocialMedia/OptionCard";
import SectionHeader from "@/Components/ConfigSocialMedia/SectionHeader";
import Switch from "@/Components/common/Modern/Switch";
import { Globe, Link2, Lock, Video } from "lucide-react";
import { useTranslation } from "react-i18next";

interface YoutubeSettingsProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

const RotatedVideo = ({ className }: { className?: string }) => (
  <Video className={`${className} rotate-90`} />
);

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
          <SectionHeader title={t("platformSettings.youtube.contentType")} />
          <div className="space-y-3">
            <OptionCard
              value="video"
              label={t("platformSettings.youtube.video")}
              description={t("platformSettings.youtube.videoStandard")}
              icon={Video}
              iconColor="text-red-500"
              iconBgColor="bg-red-100 dark:bg-red-900/20"
              selected={settings?.type === "video"}
              onSelect={(val) => handleChange("type", val)}
            />
            <OptionCard
              value="short"
              label={t("platformSettings.youtube.short")}
              description={t("platformSettings.youtube.shortVertical")}
              icon={RotatedVideo}
              iconColor="text-red-500"
              iconBgColor="bg-red-100 dark:bg-red-900/20"
              selected={settings?.type === "short"}
              onSelect={(val) => handleChange("type", val)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader title={t("platformSettings.youtube.privacy")} />
          <div className="grid grid-cols-1  gap-2">
            {[
              {
                value: "public",
                icon: Globe,
                label: t("platformSettings.youtube.public"),
              },
              {
                value: "private",
                icon: Lock,
                label: t("platformSettings.youtube.private"),
              },
              {
                value: "unlisted",
                icon: Link2,
                label: t("platformSettings.youtube.unlisted"),
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
            <Switch
              id="yt_kids"
              label={t("platformSettings.youtube.madeForKids")}
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
