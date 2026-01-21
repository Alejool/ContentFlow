import IconFacebook from "@/../assets/Icons/facebook.svg";
import IconTiktok from "@/../assets/Icons/tiktok.svg";
import IconTwitter from "@/../assets/Icons/x.svg";
import IconYoutube from "@/../assets/Icons/youtube.svg";
import PlatformSettingsModal from "@/Components/ConfigSocialMedia/PlatformSettingsModal";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { CheckCircle, Save, Settings2, XCircle } from "lucide-react";
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
    bgColor: "bg-red-50 dark:bg-red-900/10",
    borderColor: "border-red-100 dark:border-red-900/20",
    buttonColor: "bg-red-500 hover:bg-red-600",
    ringColor: "ring-red-200 dark:ring-red-900/30",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: IconFacebook,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/10",
    borderColor: "border-blue-100 dark:border-blue-900/20",
    buttonColor: "bg-blue-500 hover:bg-blue-600",
    ringColor: "ring-blue-200 dark:ring-blue-900/30",
  },
  // {
  //   id: "instagram",
  //   name: "Instagram",
  //   icon: IconInstagram,
  //   color: "text-pink-600",
  //   bgColor: "bg-pink-50 dark:bg-pink-900/10",
  //   borderColor: "border-pink-100 dark:border-pink-900/20",
  //   buttonColor:
  //     "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
  //   ringColor: "ring-pink-200 dark:ring-pink-900/30",
  // },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: IconTwitter,
    color: "text-gray-900 dark:text-white",
    bgColor: "bg-gray-50 dark:bg-gray-800/20",
    borderColor: "border-gray-100 dark:border-gray-800/30",
    buttonColor:
      "bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900",
    ringColor: "ring-gray-200 dark:ring-gray-800/30",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: IconTiktok,
    color: "text-gray-900 dark:text-white",
    bgColor: "bg-gray-100 dark:bg-neutral-800/30",
    borderColor: "border-gray-200 dark:border-neutral-700/30",
    buttonColor:
      "bg-gradient-to-r from-gray-900 via-gray-800 to-pink-900 hover:from-gray-900 hover:via-gray-700 hover:to-pink-800",
    ringColor: "ring-gray-300 dark:ring-neutral-700/30",
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
          toast.success(t("platformSettings.success"));
          setIsSaving(false);
        },
        onError: () => {
          toast.error(t("platformSettings.error"));
          setIsSaving(false);
        },
      },
    );
  };

  const hasChanges =
    JSON.stringify(initialSettings) !== JSON.stringify(globalSettings);

  return (
    <AuthenticatedLayout
      header={
        <div className="flex flex-col mt-10 sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary-50 dark:bg-primary-500/10 rounded-lg">
                <Settings2 className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t("platformSettings.title")}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("platformSettings.subtitle")}
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <Head title={t("platformSettings.title")} />

      <div className="px-4 sm:px-6 mb-6">
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`
              inline-flex items-center gap-3 px-6 py-3
              rounded-lg font-semibold transition-all
              ${
                hasChanges
                  ? "bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/30 hover:shadow-xl"
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <Save className={`w-5 h-5 ${isSaving ? "animate-spin" : ""}`} />
            <span className="whitespace-nowrap">
              {isSaving ? t("common.processing") : t("platformSettings.save")}
            </span>
            {hasChanges && (
              <span className="ml-2 px-2 py-1 text-xs font-bold bg-white/20 rounded-full">
                {t("common.new")}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6">
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-gray-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("platformSettings.configured")}
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {
                    platforms.filter(
                      (p) =>
                        Object.keys(globalSettings[p.id.toLowerCase()] || {})
                          .length > 0,
                    ).length
                  }
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    /{platforms.length}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-gray-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                <Settings2 className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("common.totalSettings")}
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {Object.values(globalSettings).reduce(
                    (acc, settings) => acc + Object.keys(settings || {}).length,
                    0,
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-gray-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <div className="w-5 h-5 flex items-center justify-center">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      hasChanges
                        ? "bg-primary-500 animate-pulse"
                        : "bg-green-500"
                    }`}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("platformSettings.status")}
                </p>
                <p
                  className={`text-sm font-bold ${
                    hasChanges ? "text-primary-500" : "text-green-500"
                  }`}
                >
                  {hasChanges
                    ? t("common.unsavedChanges")
                    : t("common.allSaved")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {platforms.map((platform) => {
            const platformSettings =
              globalSettings[platform.id.toLowerCase()] || {};
            const hasSettings = Object.keys(platformSettings).length > 0;
            const settingsCount = Object.keys(platformSettings).length;

            return (
              <div
                key={platform.id}
                onClick={() => handleOpenSettings(platform.id)}
                className="group cursor-pointer"
              >
                <div
                  className={`
                  bg-white dark:bg-neutral-900
                  rounded-lg border ${platform.borderColor}
                  p-5 transition-all duration-200
                  hover:shadow-lg hover:-translate-y-0.5
                  hover:border-opacity-50 dark:hover:border-opacity-50
                  h-full flex flex-col
                  ${hasSettings ? `ring-1 ${platform.ringColor}` : ""}
                `}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                        p-2.5 rounded-lg
                        transition-transform group-hover:scale-105
                      `}
                      >
                        <img
                          src={platform.icon}
                          alt={platform.name}
                          className="w-6 h-6"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {platform.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              hasSettings
                                ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400"
                            }`}
                          >
                            {hasSettings
                              ? t("common.configured")
                              : t("common.notConfigured")}
                          </span>
                        </div>
                      </div>
                    </div>
                    {hasSettings && (
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {settingsCount}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 mb-4">
                    {hasSettings ? (
                      <div className="space-y-2">
                        {Object.entries(platformSettings)
                          .slice(0, 2)
                          .map(([key, value]) => {
                            const label = t(
                              `modal.platformSettings.labels.${key}`,
                              { defaultValue: key.replace(/_/g, " ") },
                            );

                            let displayValue = String(value);
                            if (typeof value === "boolean") {
                              displayValue = value
                                ? t("common.yes")
                                : t("common.no");
                            } else if (typeof value === "string") {
                              const platformTranslation = t(
                                `modal.platformSettings.${platform.id}.${value}`,
                              );
                              if (
                                platformTranslation !==
                                `modal.platformSettings.${platform.id}.${value}`
                              ) {
                                displayValue = platformTranslation;
                              }
                            }

                            return (
                              <div
                                key={key}
                                className="flex items-center justify-between"
                              >
                                <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[60%]">
                                  {label}:
                                </span>
                                <span className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[40%] text-right">
                                  {displayValue}
                                </span>
                              </div>
                            );
                          })}
                        {settingsCount > 2 && (
                          <div className="pt-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              +{settingsCount - 2} {t("common.more")}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-4">
                        <div className="p-2 bg-gray-50 dark:bg-neutral-800 rounded-lg mb-2">
                          <XCircle className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          {t("platformSettings.clickToConfigure")}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenSettings(platform.id);
                    }}
                    className={`
                      w-full py-2 px-3 rounded-lg text-xs font-medium
                      transition-all flex items-center justify-center gap-1
                      ${platform.buttonColor} text-white
                      hover:scale-[1.02] active:scale-[0.98]
                    `}
                  >
                    {hasSettings ? t("common.edit") : t("common.configure")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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
