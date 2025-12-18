import PlatformSettingsModal from "@/Components/ManageContent/modals/common/PlatformSettingsModal";

import IconFacebook from "@/../assets/Icons/facebook.svg";
import IconInstagram from "@/../assets/Icons/instagram.svg";
import IconTiktok from "@/../assets/Icons/tiktok.svg";
import IconTwitter from "@/../assets/Icons/x.svg";
import IconYoutube from "@/../assets/Icons/youtube.svg";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface SocialConfigProps {
  settings: Record<string, any>;
}

const platforms = [
  {
    id: "youtube",
    name: "YouTube",
    icon: IconYoutube,
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: IconFacebook,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: IconInstagram,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
  },
  {
    id: "twitter",
    name: "Twitter",
    icon: IconTwitter,
    color: "text-sky-500",
    bgColor: "bg-sky-50",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: IconTiktok,
    color: "text-black dark:text-white",
    bgColor: "bg-gray-100 dark:bg-neutral-800",
  },
];

export default function SocialConfig({
  settings: initialSettings,
}: SocialConfigProps) {
  const { t } = useTranslation();
  const [globalSettings, setGlobalSettings] = useState(initialSettings || {});
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setGlobalSettings(initialSettings || {});
  }, [initialSettings]);

  const handleOpenSettings = (platformId: string) => {
    setActivePlatform(platformId);
  };

  const handleSettingsChange = (newSettings: any) => {
    if (!activePlatform) return;
    setGlobalSettings((prev) => ({
      ...prev,
      [activePlatform.toLowerCase()]: newSettings,
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    router.patch(
      route("settings.social.update"),
      {
        settings: globalSettings,
      },
      {
        onSuccess: () => {
          toast.success(t("settings.social.success"));
          setIsSaving(false);
        },
        onError: () => {
          toast.error(t("settings.social.error"));
          setIsSaving(false);
        },
      }
    );
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-primary-500" />
              {t("settings.social.title")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              {t("settings.social.subtitle")}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary-500/20 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSaving ? t("common.processing") : t("settings.social.save")}
          </button>
        </div>
      }
    >
      <Head title={t("settings.social.title")} />

      <div className="grid grid-cols-1 mx-8 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((platform) => {
          const platformSettings =
            globalSettings[platform.id.toLowerCase()] || {};
          return (
            <div
              key={platform.id}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-6 flex flex-col hover:shadow-xl transition-all group"
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`p-3 rounded-xl ${platform.bgColor} transition-transform group-hover:scale-110`}
                >
                  {/* <platform.icon className={`w-8 h-8 ${platform.color}`} /> */}
                  <img src={platform.icon} alt={platform.name} className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold dark:text-white capitalize">
                    {platform.name}
                  </h3>
                  <span className="text-xs text-gray-400 dark:text-neutral-500 font-medium">
                    {t("common.adjustOptions")}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                {Object.keys(platformSettings).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(platformSettings).map(([key, value]) => {
                      const label = t(
                        `publications.modal.platformSettings.labels.${key}`,
                        { defaultValue: key.replace(/_/g, " ") }
                      );

                      let displayValue = String(value);
                      if (typeof value === "boolean") {
                        displayValue = value ? t("common.yes") : t("common.no");
                      } else if (typeof value === "string") {
                        const platformTranslation = t(
                          `publications.modal.platformSettings.${platform.id}.${value}`
                        );
                        if (
                          platformTranslation !==
                          `publications.modal.platformSettings.${platform.id}.${value}`
                        ) {
                          displayValue = platformTranslation;
                        }
                      }

                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-500 dark:text-neutral-500 capitalize">
                            {label}:
                          </span>
                          <span className="font-semibold dark:text-neutral-300">
                            {displayValue}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-neutral-600 italic">
                    {t("common.noSettings") || "No defaults configured"}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleOpenSettings(platform.id)}
                className="mt-6 w-full py-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors text-sm font-semibold dark:text-white"
              >
                {t("common.configure") || "Configure"}
              </button>
            </div>
          );
        })}
      </div>

      {activePlatform && (
        <PlatformSettingsModal
          isOpen={!!activePlatform}
          onClose={() => setActivePlatform(null)}
          platform={activePlatform}
          settings={globalSettings[activePlatform.toLowerCase()] || {}}
          onSettingsChange={handleSettingsChange}
        />
      )}
    </AuthenticatedLayout>
  );
}
