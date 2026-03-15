import PlatformCard from "@/Components/ConfigSocialMedia/PlatformCard";
import PollOptions from "@/Components/ConfigSocialMedia/PollOptions";
import SectionHeader from "@/Components/ConfigSocialMedia/SectionHeader";
import { List, PieChart, Twitter } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

interface TwitterSettingsProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

const EMPTY_SETTINGS = {};

export default function TwitterSettings({
  settings = EMPTY_SETTINGS,
  onSettingsChange,
}: TwitterSettingsProps) {
  const { t } = useTranslation();
  const isInitialized = useRef(false);

  // Establecer valores por defecto si no existen
  const defaultSettings = {
    type: settings?.type || "tweet",
  };

  // Si los settings están vacíos, inicializar con valores por defecto
  useEffect(() => {
    if (Object.keys(settings).length === 0 && !isInitialized.current) {
      isInitialized.current = true;
      onSettingsChange(defaultSettings);
    }
  }, []);

  const handleChange = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handlePollOptionsChange = (options: string[]) => {
    handleChange("poll_options", options);
  };

  const handlePollDurationChange = (duration: number) => {
    // Convert minutes to hours for consistency with backend
    handleChange("poll_duration_hours", duration / 60);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SectionHeader title={t("platformSettings.twitter.type")} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PlatformCard
            value="tweet"
            label={t("platformSettings.twitter.tweet")}
            icon={Twitter}
            iconColor="text-sky-500"
            iconBgColor="bg-sky-100 dark:bg-sky-900/20"
            selected={
              settings?.type === "tweet" || (!settings?.type && defaultSettings.type === "tweet")
            }
            onSelect={(val) => handleChange("type", val)}
          />
          <PlatformCard
            value="thread"
            label={t("platformSettings.twitter.thread")}
            icon={List}
            iconColor="text-sky-500"
            iconBgColor="bg-sky-100 dark:bg-sky-900/20"
            selected={settings?.type === "thread"}
            onSelect={(val) => handleChange("type", val)}
          />
          <PlatformCard
            value="poll"
            label={t("platformSettings.twitter.poll")}
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
          pollDuration={settings?.poll_duration_hours ? settings.poll_duration_hours * 60 : 1440}
          onOptionsChange={handlePollOptionsChange}
          onDurationChange={handlePollDurationChange}
        />
      )}
    </div>
  );
}
