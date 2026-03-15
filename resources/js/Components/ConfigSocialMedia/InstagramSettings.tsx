import PlatformCard from '@/Components/ConfigSocialMedia/PlatformCard';
import SectionHeader from '@/Components/ConfigSocialMedia/SectionHeader';
import { Instagram, Video } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface InstagramSettingsProps {
  settings: Record<string, unknown>;
  onSettingsChange: (settings: Record<string, unknown>) => void;
}

const EMPTY_SETTINGS = {};

export default function InstagramSettings({
  settings = EMPTY_SETTINGS,
  onSettingsChange,
}: InstagramSettingsProps) {
  const { t } = useTranslation();
  const isInitialized = useRef(false);

  // Establecer valores por defecto si no existen
  const defaultSettings = {
    type: settings?.type || 'reel',
  };

  // Si los settings están vacíos, inicializar con valores por defecto
  useEffect(() => {
    if (Object.keys(settings).length === 0 && !isInitialized.current) {
      isInitialized.current = true;
      onSettingsChange(defaultSettings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (key: string, value: unknown) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SectionHeader title={t('platformSettings.instagram.type')} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PlatformCard
            value="feed"
            label={t('platformSettings.instagram.feed')}
            icon={Instagram}
            iconColor="text-pink-500"
            iconBgColor="bg-pink-100 dark:bg-pink-900/20"
            selected={settings?.type === 'feed'}
            onSelect={(val) => handleChange('type', val)}
          />
          <PlatformCard
            value="reel"
            label={t('platformSettings.instagram.reel')}
            icon={Video}
            iconColor="text-pink-500"
            iconBgColor="bg-pink-100 dark:bg-pink-900/20"
            selected={
              settings?.type === 'reel' || (!settings?.type && defaultSettings.type === 'reel')
            }
            onSelect={(val) => handleChange('type', val)}
          />
          <PlatformCard
            value="story"
            label={t('platformSettings.instagram.story')}
            icon={Instagram}
            iconColor="text-pink-500"
            iconBgColor="bg-pink-100 dark:bg-pink-900/20"
            selected={settings?.type === 'story'}
            onSelect={(val) => handleChange('type', val)}
          />
        </div>
      </div>
    </div>
  );
}
