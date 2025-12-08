import { CheckCircle2, Globe, Shield, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Loglogin() {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold">
            {t(`auth.login.tags.secureAccess.title`)}
          </p>
          <p className="text-sm opacity-80">
            {t(`auth.login.tags.endToEndEncryption.subtitle`)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold">
            {t(`auth.login.tags.globalPlatform.title`)}
          </p>
          <p className="text-sm opacity-80">
            {t(`auth.login.tags.globalPlatform.subtitle`)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold">
            {t(`auth.login.tags.mobileFriendly.title`)}
          </p>
          <p className="text-sm opacity-80">
            {t(`auth.login.tags.mobileFriendly.subtitle`)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold">
            {t(`auth.login.tags.endToEndEncryption.title`)}
          </p>
          <p className="text-sm opacity-80">
            {t(`auth.login.tags.endToEndEncryption.subtitle`)}
          </p>
        </div>
      </div>
    </div>
  );
}
