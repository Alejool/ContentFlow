import PlatformSettingsModal from "@/Components/ConfigSocialMedia/PlatformSettingsModal";
import Button from "@/Components/common/Modern/Button";
import { SOCIAL_PLATFORMS } from "@/Constants/socialPlatformsConfig";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Save, Settings2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { useKeyboardClick } from "@/Hooks/useKeyboardClick";

interface SocialConfigProps {
  settings: Record<string, any>;
}

// Filtrar solo las plataformas activas
const activePlatforms = Object.values(SOCIAL_PLATFORMS).filter(
  (platform) => platform.active
);

export default function SocialConfig({
  settings: initialSettings,
}: SocialConfigProps) {
  const { t } = useTranslation();
  const [globalSettings, setGlobalSettings] = useState(initialSettings || {});
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.patch(route("api.v1.profile.social-settings.update"), {
        settings: globalSettings,
      });
      toast.success(t("platformSettings.success") || "Configuración guardada");
      setIsSaving(false);
    } catch (error) {
      toast.error(t("platformSettings.error") || "Error al guardar");
      setIsSaving(false);
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <Settings2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("platformSettings.title")}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("platformSettings.subtitle")}
            </p>
          </div>
        </div>
      }
    >
      <Head title={t("platformSettings.title")} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            loading={isSaving}
            icon={Save}
            loadingText={t("common.saving")}
            className="shadow-md hover:shadow-lg"
            size="lg"
          >
            {t("common.save")}
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {activePlatforms.map((platform) => {
            const platformSettings =
              globalSettings[platform.key.toLowerCase()] || {};
            const hasSettings = Object.keys(platformSettings).length > 0;
            const keyboardProps = useKeyboardClick(() => handleOpenSettings(platform.key));

            return (
              <div
                key={platform.key}
                {...keyboardProps}
                className="bg-white dark:bg-neutral-900 rounded-lg border-2 border-gray-200 dark:border-neutral-700 p-6 cursor-pointer hover:border-primary-500 dark:hover:border-primary-600 hover:shadow-lg transition-all flex flex-col h-full"
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-800 dark:to-neutral-700 rounded-lg shadow-sm">
                    <img
                      src={platform.logo}
                      alt={platform.name}
                      className="w-8 h-8"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2 truncate">
                      {platform.name}
                    </h3>
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                        hasSettings
                          ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          hasSettings ? "bg-primary-600" : "bg-amber-500"
                        }`}
                      />
                      {hasSettings
                        ? t("common.configured")
                        : t("common.notConfigured")}
                    </div>
                  </div>
                </div>
                <div className="flex-1 mb-5">
                  {hasSettings ? (
                    <div className="space-y-3">
                      {Object.entries(platformSettings)
                        .slice(0, 3)
                        .map(([key, value]) => {
                          const label = t(
                            `modal.platformSettings.labels.${key}`,
                            { defaultValue: key.replace(/_/g, " ") },
                          );

                          let displayValue = String(value);
                          
                          // Traducir valores booleanos
                          if (typeof value === "boolean") {
                            displayValue = value
                              ? t("common.yes")
                              : t("common.no");
                          } 
                          // Traducir valores específicos de plataforma
                          else if (typeof value === "string") {
                            const translationKey = `platformSettings.${platform.key}.${value}`;
                            const translated = t(translationKey);
                            // Solo usar la traducción si existe (no devuelve la key)
                            if (translated !== translationKey) {
                              displayValue = translated;
                            }
                          }

                          return (
                            <div
                              key={key}
                              className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-neutral-800/50"
                            >
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                                {label}
                              </span>
                              <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {displayValue}
                              </span>
                            </div>
                          );
                        })}
                      {Object.keys(platformSettings).length > 3 && (
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center pt-1">
                          +{Object.keys(platformSettings).length - 3} más
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[120px] p-4 rounded-lg border-2 border-dashed border-amber-200 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-900/10">
                      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
                        <Settings2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 text-center mb-1">
                        {t("common.notConfigured")}
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-500 text-center">
                        {t("platformSettings.clickToConfigure")}
                      </p>
                    </div>
                  )}
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenSettings(platform.key);
                  }}
                  className="w-full shadow-sm hover:shadow-md"
                  size="md"
                >
                  {hasSettings ? t("common.edit") : t("common.configure")}
                </Button>
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
