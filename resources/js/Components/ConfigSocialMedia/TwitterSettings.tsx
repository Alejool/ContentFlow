import PlatformCard from "@/Components/ConfigSocialMedia/PlatformCard";
import PollOptions from "@/Components/ConfigSocialMedia/PollOptions";
import SectionHeader from "@/Components/ConfigSocialMedia/SectionHeader";
import { List, PieChart, Twitter } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TwitterSettingsProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

export default function TwitterSettings({
  settings = {},
  onSettingsChange,
}: TwitterSettingsProps) {
  const { t } = useTranslation();

  const handleChange = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handlePollOptionsChange = (options: string[]) => {
    handleChange("poll_options", options);
  };

  const handlePollDurationChange = (duration: number) => {
    handleChange("poll_duration", duration);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SectionHeader
          title={t("publications.modal.platformSettings.twitter.type")}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PlatformCard
            value="tweet"
            label={t("publications.modal.platformSettings.twitter.tweet")}
            icon={Twitter}
            iconColor="text-sky-500"
            iconBgColor="bg-sky-100 dark:bg-sky-900/20"
            selected={settings?.type === "tweet"}
            onSelect={(val) => handleChange("type", val)}
          />
          <PlatformCard
            value="thread"
            label={t("publications.modal.platformSettings.twitter.thread")}
            icon={List}
            iconColor="text-sky-500"
            iconBgColor="bg-sky-100 dark:bg-sky-900/20"
            selected={settings?.type === "thread"}
            onSelect={(val) => handleChange("type", val)}
          />
          <PlatformCard
            value="poll"
            label={t("publications.modal.platformSettings.twitter.poll")}
            icon={PieChart}
            iconColor="text-sky-500"
            iconBgColor="bg-sky-100 dark:bg-sky-900/20"
            selected={settings?.type === "poll"}
            onSelect={(val) => handleChange("type", val)}
          />
        </div>
      </div>

      {settings?.type === "poll" && (
        <PollOptions
          pollOptions={settings?.poll_options || []}
          pollDuration={settings?.poll_duration || 1440}
          onOptionsChange={handlePollOptionsChange}
          onDurationChange={handlePollDurationChange}
        />
      )}
    </div>
  );
}
