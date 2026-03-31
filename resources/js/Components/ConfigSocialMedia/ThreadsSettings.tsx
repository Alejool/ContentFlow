import PlatformCard from '@/Components/ConfigSocialMedia/PlatformCard';
import SectionHeader from '@/Components/ConfigSocialMedia/SectionHeader';
import { Image, MessageCircle, Video } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ThreadsSettingsProps {
  settings: Record<string, unknown>;
  onSettingsChange: (settings: Record<string, unknown>) => void;
}

const EMPTY_SETTINGS = {};

export default function ThreadsSettings({
  settings = EMPTY_SETTINGS,
  onSettingsChange,
}: ThreadsSettingsProps) {
  const { t } = useTranslation();
  const isInitialized = useRef(false);

  const defaultSettings = {
    type: settings?.type || 'text',
    reply_control: settings?.reply_control || 'everyone',
  };

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
      {/* Content type */}
      <div className="space-y-4">
        <SectionHeader title={t('platformSettings.threads.type', 'Tipo de publicación')} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PlatformCard
            value="text"
            label={t('platformSettings.threads.text', 'Texto')}
            icon={MessageCircle}
            iconColor="text-gray-700"
            iconBgColor="bg-gray-100 dark:bg-gray-800"
            selected={
              settings?.type === 'text' || (!settings?.type && defaultSettings.type === 'text')
            }
            onSelect={(val) => handleChange('type', val)}
          />
          <PlatformCard
            value="image"
            label={t('platformSettings.threads.image', 'Imagen')}
            icon={Image}
            iconColor="text-gray-700"
            iconBgColor="bg-gray-100 dark:bg-gray-800"
            selected={settings?.type === 'image'}
            onSelect={(val) => handleChange('type', val)}
          />
          <PlatformCard
            value="video"
            label={t('platformSettings.threads.video', 'Video')}
            icon={Video}
            iconColor="text-gray-700"
            iconBgColor="bg-gray-100 dark:bg-gray-800"
            selected={settings?.type === 'video'}
            onSelect={(val) => handleChange('type', val)}
          />
        </div>
      </div>

      {/* Reply control */}
      <div className="space-y-4">
        <SectionHeader
          title={t('platformSettings.threads.replyControl', '¿Quién puede responder?')}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PlatformCard
            value="everyone"
            label={t('platformSettings.threads.everyone', 'Todos')}
            icon={MessageCircle}
            iconColor="text-green-600"
            iconBgColor="bg-green-100 dark:bg-green-900/20"
            selected={
              settings?.reply_control === 'everyone' ||
              (!settings?.reply_control && defaultSettings.reply_control === 'everyone')
            }
            onSelect={(val) => handleChange('reply_control', val)}
          />
          <PlatformCard
            value="accounts_you_follow"
            label={t('platformSettings.threads.accountsYouFollow', 'Cuentas que sigues')}
            icon={MessageCircle}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100 dark:bg-blue-900/20"
            selected={settings?.reply_control === 'accounts_you_follow'}
            onSelect={(val) => handleChange('reply_control', val)}
          />
          <PlatformCard
            value="mentioned_only"
            label={t('platformSettings.threads.mentionedOnly', 'Solo mencionados')}
            icon={MessageCircle}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100 dark:bg-purple-900/20"
            selected={settings?.reply_control === 'mentioned_only'}
            onSelect={(val) => handleChange('reply_control', val)}
          />
        </div>
      </div>
    </div>
  );
}
