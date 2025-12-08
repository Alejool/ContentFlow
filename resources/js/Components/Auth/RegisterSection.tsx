
import { Check, Key, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function RegisterSection() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Check className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold">
            {t(`auth.register.tags.freeForever.title`)}
          </p>
          <p className="text-sm opacity-80">
            {t(`auth.register.tags.freeForever.subtitle`)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Key className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold">
            {t(`auth.register.tags.secureByDefault.title`)}
          </p>
          <p className="text-sm opacity-80">
            {t(`auth.register.tags.secureByDefault.subtitle`)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold">
            {t(`auth.register.tags.syncEverywhere.title`)}
          </p>
          <p className="text-sm opacity-80">
            {t(`auth.register.tags.syncEverywhere.subtitle`)}
          </p>
        </div>
      </div>
    </div>
  );
}
