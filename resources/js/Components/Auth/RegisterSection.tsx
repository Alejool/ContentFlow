import { Check, Key, Smartphone } from "lucide-react";
import PlatformFeatureTag from "@/Components/Auth/PlatformFeatureTag";


export default function RegisterSection() {
  return (
    <div className="space-y-4 text-left">
      <PlatformFeatureTag
        titleKey="auth.register.tags.freeForever.title"
        subtitleKey="auth.register.tags.freeForever.subtitle"
        icon={Check}
      />

      <PlatformFeatureTag
        titleKey="auth.register.tags.secureByDefault.title"
        subtitleKey="auth.register.tags.secureByDefault.subtitle"
        icon={Key}
      />

      <PlatformFeatureTag
        titleKey="auth.register.tags.syncEverywhere.title"
        subtitleKey="auth.register.tags.syncEverywhere.subtitle"
        icon={Smartphone}
      />
    </div>
  );
}
