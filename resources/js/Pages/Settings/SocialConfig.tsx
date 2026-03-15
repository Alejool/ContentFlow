import PlatformSettingsModal from '@/Components/ConfigSocialMedia/PlatformSettingsModal';
import Button from '@/Components/common/Modern/Button';
import { SOCIAL_PLATFORMS } from '@/Constants/socialPlatformsConfig';
import { useKeyboardClick } from '@/Hooks/useKeyboardClick';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Save, Settings2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface SocialConfigProps {
  settings: Record<string, any>;
}

// Filtrar solo las plataformas activas
const activePlatforms = Object.values(SOCIAL_PLATFORMS).filter((platform) => platform.active);

// Componente extraído para usar hooks correctamente
interface PlatformCardProps {
  platform: any;
  platformSettings: any;
  hasSettings: boolean;
  onOpenSettings: (key: string) => void;
  t: any;
}

function PlatformCard({
  platform,
  platformSettings,
  hasSettings,
  onOpenSettings,
  t,
}: PlatformCardProps) {
  const keyboardProps = useKeyboardClick(() => onOpenSettings(platform.key));

  return (
    <div
      key={platform.key}
      {...keyboardProps}
      className="flex h-full cursor-pointer flex-col rounded-lg border-2 border-gray-200 bg-white p-6 transition-all hover:border-primary-500 hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-primary-600"
    >
      <div className="mb-5 flex items-start gap-4">
        <div className="rounded-lg p-3">
          <img src={platform.logo} alt={platform.name} className="h-8 w-8" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="mb-2 truncate text-base font-bold text-gray-900 dark:text-white">
            {platform.name}
          </h3>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
              hasSettings
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full ${hasSettings ? 'bg-primary-600' : 'bg-amber-500'}`}
            />
            {hasSettings ? t('common.configured') : t('common.notConfigured')}
          </div>
        </div>
      </div>
      <div className="mb-5 flex-1">
        {hasSettings ? (
          <div className="space-y-3">
            {Object.entries(platformSettings)
              .slice(0, 3)
              .map(([key, value]) => {
                const label = t(`modal.platformSettings.labels.${key}`, {
                  defaultValue: key.replace(/_/g, ' '),
                });

                let displayValue = String(value);

                // Traducir valores booleanos
                if (typeof value === 'boolean') {
                  displayValue = value ? t('common.yes') : t('common.no');
                }
                // Traducir valores específicos de plataforma
                else if (typeof value === 'string') {
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
                    className="flex items-start justify-between gap-2 rounded-lg bg-gray-50 p-2.5 dark:bg-neutral-800/50"
                  >
                    <span className="truncate text-xs font-medium text-gray-600 dark:text-gray-400">
                      {label}
                    </span>
                    <span className="truncate text-xs font-bold text-gray-900 dark:text-white">
                      {displayValue}
                    </span>
                  </div>
                );
              })}
            {Object.keys(platformSettings).length > 3 && (
              <div className="pt-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                +{Object.keys(platformSettings).length - 3} más
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800/30 dark:bg-amber-900/10">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Settings2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="mb-1 text-center text-sm font-semibold text-amber-700 dark:text-amber-400">
              {t('common.notConfigured')}
            </p>
            <p className="text-center text-xs text-amber-600 dark:text-amber-500">
              {t('platformSettings.clickToConfigure')}
            </p>
          </div>
        )}
      </div>
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onOpenSettings(platform.key);
        }}
        className="w-full shadow-sm hover:shadow-md"
        size="md"
      >
        {hasSettings ? t('common.edit') : t('common.configure')}
      </Button>
    </div>
  );
}

export default function SocialConfig({ settings: initialSettings }: SocialConfigProps) {
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
      await axios.patch(route('api.v1.profile.social-settings.update'), {
        settings: globalSettings,
      });
      toast.success(t('platformSettings.success') || 'Configuración guardada');
      setIsSaving(false);
    } catch (error) {
      toast.error(t('platformSettings.error') || 'Error al guardar');
      setIsSaving(false);
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex w-full flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
              <Settings2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight text-gray-900 dark:text-white">
                {t('platformSettings.title')}
              </h2>
              <p className="text-xs font-medium text-gray-500 dark:text-neutral-500">
                {t('platformSettings.subtitle')}
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            loading={isSaving}
            icon={Save}
            loadingText={t('common.saving')}
            className="shadow-md hover:shadow-lg"
            size="md"
          >
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <Head title={t('platformSettings.title')} />

      <div className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-gray-50/30 dark:bg-neutral-900/10">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activePlatforms.map((platform) => {
              const platformSettings = globalSettings[platform.key.toLowerCase()] || {};
              const hasSettings = Object.keys(platformSettings).length > 0;

              return (
                <PlatformCard
                  key={platform.key}
                  platform={platform}
                  platformSettings={platformSettings}
                  hasSettings={hasSettings}
                  onOpenSettings={handleOpenSettings}
                  t={t}
                />
              );
            })}
          </div>
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
