import { CheckCircle2, Globe, Shield, Smartphone } from "lucide-react";
import PlatformFeatureTag from "@/Components/Auth/PlatformFeatureTag";

export default function Loglogin() {
  return (
    <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
      <PlatformFeatureTag
        titleKey="auth.login.tags.secureAccess.title"
        subtitleKey="auth.login.tags.endToEndEncryption.subtitle"
        icon={Shield}
      />

      <PlatformFeatureTag
        titleKey="auth.login.tags.globalPlatform.title"
        subtitleKey="auth.login.tags.globalPlatform.subtitle"
        icon={Globe}
      />

      <PlatformFeatureTag
        titleKey="auth.login.tags.mobileFriendly.title"
        subtitleKey="auth.login.tags.mobileFriendly.subtitle"
        icon={Smartphone}
      />

      <PlatformFeatureTag
        titleKey="auth.login.tags.endToEndEncryption.title"
        subtitleKey="auth.login.tags.endToEndEncryption.subtitle"
        icon={CheckCircle2}
      />
    </div>
  );
}
