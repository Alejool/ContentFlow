import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

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
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
      <div className="w-10 h-10 rounded-full  flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold">{t(titleKey)}</p>
        <p className="text-sm opacity-80">{t(subtitleKey)}</p>
      </div>
    </div>
  );
}
