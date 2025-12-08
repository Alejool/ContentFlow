import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ForgotPasswordSection() {
  const { t } = useTranslation();
  return (
    <>
      <div className="space-y-4 text-left">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="font-bold">1</span>
          </div>

          <div>
            <p className="font-semibold">
              {t(`auth.forgot-password.tags.1.title`)}
            </p>
            <span className="text-sm opacity-80">
              {t(`auth.forgot-password.tags.1.subtitle`)}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="font-bold">2</span>
          </div>
          <div>
            <p className="font-semibold">
              {t(`auth.forgot-password.tags.1.title`)}
            </p>
            <span className="text-sm opacity-80">
              {t(`auth.forgot-password.tags.1.subtitle`)}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="font-bold">3</span>
          </div>
          <div>
            <p className="font-semibold">
              {t(`auth.forgot-password.tags.step3`)}
            </p>
            <span className="text-sm opacity-80">
              {t(`auth.forgot-password.tags.step3.subtitle`)}
            </span>
          </div>
        </div>
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
