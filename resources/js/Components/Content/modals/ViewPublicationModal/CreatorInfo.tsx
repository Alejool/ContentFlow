import { Avatar } from '@/Components/common/Avatar';
import { useTranslation } from 'react-i18next';

interface CreatorInfoProps {
  user?: {
    photo_url?: string;
    name: string;
  };
}

export default function CreatorInfo({ user }: CreatorInfoProps) {
  const { t } = useTranslation();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4 dark:bg-neutral-900/50">
      <Avatar src={user.photo_url} name={user.name} size="md" className="flex-shrink-0" />
      <div>
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.creator')}</p>
      </div>
    </div>
  );
}
