import Button from "@/Components/common/Modern/Button";
import { SOCIAL_PLATFORMS } from "@/Constants/socialPlatformsConfig";
import { Settings2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PlatformModalHeaderProps {
  platform: string;
  isAllPlatforms: boolean;
  onClose: () => void;
}

export default function PlatformModalHeader({
  platform,
  isAllPlatforms,
  onClose,
}: PlatformModalHeaderProps) {
  const { t } = useTranslation();

  const getPlatformIcon = () => {
    const platformKey = platform.toLowerCase();
    const platformConfig =
      SOCIAL_PLATFORMS[platformKey as keyof typeof SOCIAL_PLATFORMS];

    if (platformConfig && platformConfig.logo) {
      return (
        <img
          src={platformConfig.logo}
          alt={platformConfig.name}
          className="w-8 h-8"
        />
      );
    }

    if (platformKey === "all") {
      return <Settings2 className="w-6 h-6 text-primary-500" />;
    }

    return <Settings2 className="w-6 h-6 text-primary-500" />;
  };

  return (
    <div className="flex items-center justify-between py-8">
      <div className="flex items-center gap-5">
        <div className="p-2">{getPlatformIcon()}</div>
        <div>
          <h2 className="text-xl font-black tracking-tight uppercase">
            {isAllPlatforms
              ? t("platformSettings.all.title") || "All Platforms"
              : platform && platform.trim()
                ? t(`platformSettings.${platform.toLowerCase()}.title`) ||
                  `${platform} Defaults`
                : "Platform Defaults"}
          </h2>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {t("common.adjustOptions") ||
              "Personaliza las opciones predeterminadas"}
          </p>
        </div>
      </div>
      <Button
        onClick={onClose}
        variant="ghost"
        buttonStyle="icon"
        icon={X}
        size="md"
        className="hover:bg-neutral-100 dark:hover:bg-neutral-800"
        aria-label={t("common.close") || "Cerrar"}
      >
        <span className="sr-only">{t("common.close") || "Cerrar"}</span>
      </Button>
    </div>
  );
}
