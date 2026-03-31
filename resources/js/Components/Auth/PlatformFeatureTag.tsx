import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PlatformFeatureTagProps {
  titleKey: string;
  subtitleKey: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function PlatformFeatureTag({
  titleKey,
  subtitleKey,
  icon: Icon = Globe,
}: PlatformFeatureTagProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3 backdrop-blur-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-full">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold">{t(titleKey)}</p>
        <p className="text-sm opacity-80">{t(subtitleKey)}</p>
      </div>
    </div>
  );
}
