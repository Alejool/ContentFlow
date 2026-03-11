import { CheckCircle, Key, Mail, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import PlatformFeatureTag from "./PlatformFeatureTag";

export default function ForgotPasswordSection() {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-4 text-left">
        <PlatformFeatureTag
          titleKey="auth.forgot-password.tags.1.title"
          subtitleKey="auth.forgot-password.tags.1.subtitle"
          icon={Mail}
        />

        <PlatformFeatureTag
          titleKey="auth.forgot-password.tags.2.title"
          subtitleKey="auth.forgot-password.tags.2.subtitle"
          icon={Key}
        />

        <PlatformFeatureTag
          titleKey="auth.forgot-password.tags.step3"
          subtitleKey="auth.forgot-password.tags.step3.subtitle"
          icon={CheckCircle}
        />
      </div>

      <div className="mt-8 p-4 rounded-lg bg-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-4 h-4 " />
          <p className="text-sm font-medium">
            {t(`auth.forgot-password.tags.secureProcess`)}
          </p>
        </div>
        <p className="text-sm opacity-80">
          {t(`auth.forgot-password.tags.privacyPolicy`)}
        </p>
      </div>
    </>
  );
}
