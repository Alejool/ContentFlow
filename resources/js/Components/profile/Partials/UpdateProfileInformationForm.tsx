import IconFacebook from "@/../assets/Icons/facebook.svg";
import IconTiktok from "@/../assets/Icons/tiktok.svg";
import IconTwitter from "@/../assets/Icons/x.svg";
import IconYoutube from "@/../assets/Icons/youtube.svg";
import PlatformSettingsModal from "@/Components/ConfigSocialMedia/PlatformSettingsModal";
import Button from "@/Components/common/Modern/Button";
import ModernCard from "@/Components/common/Modern/Card";
import Input from "@/Components/common/Modern/Input";
import Textarea from "@/Components/common/Modern/Textarea";
import LanguageSwitcher from "@/Components/common/ui/LanguageSwitcher";
import { useTheme } from "@/Hooks/useTheme";
import { useUser } from "@/Hooks/useUser";
import { Link } from "@inertiajs/react";
import {
  AlertTriangle,
  CheckCircle,
  Globe,
  Mail,
  MailWarning,
  MessageSquare,
  Phone,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

// List of supported countries (LatAm + US)
const SUPPORTED_COUNTRIES = [
  "AR",
  "BO",
  "BR",
  "CL",
  "CO",
  "CR",
  "CU",
  "DO",
  "EC",
  "SV",
  "GT",
  "HT",
  "HN",
  "MX",
  "NI",
  "PA",
  "PY",
  "PE",
  "PR",
  "UY",
  "VE",
  "US",
];

interface UpdateProfileInformationProps {
  mustVerifyEmail: boolean;
  status: string | null | undefined;
  className?: string;
}

export default function UpdateProfileInformation({
  mustVerifyEmail,
  status,
  className = "",
}: UpdateProfileInformationProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();

  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    hasChanges,
    isChangingLanguage,
    user,
    watchedValues,
    setValue,
    control,
  } = useUser(null);

  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  const platforms = [
    { id: "youtube", name: "YouTube", icon: IconYoutube },
    { id: "facebook", name: "Facebook", icon: IconFacebook },
    { id: "twitter", name: "X (Twitter)", icon: IconTwitter },
    { id: "tiktok", name: "TikTok", icon: IconTiktok },
  ];

  const handleOpenSettings = (platformId: string) => {
    setActivePlatform(platformId);
  };

  const handleSettingsChange = (newSettings: any) => {
    if (!activePlatform) return;
    const currentSettings = watchedValues.global_platform_settings || {};
    setValue("global_platform_settings", {
      ...currentSettings,
      [activePlatform.toLowerCase()]: newSettings,
    });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      if (hash && platforms.some((p) => p.id === hash)) {
        setActivePlatform(hash);
        // Desplazamiento suave a la sección
        setTimeout(() => {
          const section = document.getElementById("platform-defaults-section");
          if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <ModernCard
      title={t("profile.information.title")}
      description={t("profile.information.description")}
      icon={UserIcon}
      headerColor="orange"
      className={className}
    >
      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Sección: Información Personal */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 pb-3 mb-8 border-b border-gray-100 dark:border-neutral-800/50">
            <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t("profile.information.sections.personal")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Input
              id="name"
              label={t("profile.information.nameLabel")}
              placeholder={t("profile.information.namePlaceholder")}
              register={register}
              error={errors.name?.message}
              sizeType="lg"
              variant="filled"
              icon={UserIcon}
              required
            />

            <div className="relative">
              <Input
                id="email"
                label={t("profile.information.emailLabel")}
                type="email"
                register={register}
                error={errors.email?.message}
                placeholder={t("profile.information.emailPlaceholder")}
                sizeType="lg"
                variant="filled"
                icon={Mail}
                disabled
                required
              />

              {user?.email_verified_at && (
                <div className="absolute right-0 top-6 flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {t("profile.statistics.verified")}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <div className="flex items-center gap-3 pb-3 mb-8 border-b border-gray-100 dark:border-neutral-800/50">
            <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t("profile.information.sections.contact")}
            </h3>
          </div>

          <div className="max-w-md">
            <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {t("profile.information.phoneLabel")}
            </label>
            <div
              className={`relative transition-all duration-300 rounded-xl border bg-gray-50 dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50 hover:border-primary-400/50 dark:hover:border-primary-600/50 focus-within:ring-4 focus-within:ring-primary-500/10 focus-within:border-primary-500 ${errors.phone ? "border-primary-500" : ""
                }`}
            >
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    {...field}
                    value={field.value || undefined}
                    international
                    defaultCountry="CO"
                    countries={SUPPORTED_COUNTRIES as any}
                    placeholder={t("profile.information.phonePlaceholder")}
                    disabled={isSubmitting}
                    className="modern-phone-input p-3 dark:text-white"
                  />
                )}
              />
            </div>
            {errors.phone && (
              <div className="mt-2 text-primary-600 text-sm flex items-center gap-2">
                <TriangleAlert className="w-4 h-4 flex-shrink-0" />
                <span>{errors.phone.message}</span>
              </div>
            )}

            <style>{`
              .modern-phone-input {
                --PhoneInputCountryFlag-height: 1.25em;
                --PhoneInputCountrySelect-marginRight: 0.5em;
                --PhoneInputCountrySelectArrow-display: none;
                --PhoneInputCountrySelect-width: 3em;
                display: flex;
                align-items: center;
              }
              .modern-phone-input input {
                flex: 1;
                background: transparent;
                border: none;
                outline: none;
                color: inherit;
                font-size: 1rem;
                padding: 0 0.5rem;
              }
              .modern-phone-input.dark-theme input::placeholder { color: #9ca3af; }
              .modern-phone-input.light-theme input::placeholder { color: #6b7280; }
              .dark .modern-phone-input input::placeholder { color: #525252; }
              .modern-phone-input input::placeholder { color: #a3a3a3; }
              .PhoneInputCountrySelect {
                cursor: pointer;
              }
              .PhoneInputCountryIcon--border {
                box-shadow: none;
                border-radius: 2px;
              }
            `}</style>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <div className="flex items-center gap-3 pb-3 mb-8 border-b border-gray-100 dark:border-neutral-800/50">
            <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t("profile.information.sections.bio")}
            </h3>
          </div>

          <Textarea
            id="bio"
            label={t("profile.information.bioLabel")}
            placeholder={t("profile.information.bioPlaceholder")}
            register={register}
            name="bio"
            error={errors.bio?.message}
            rows={5}
            variant="filled"
          />
        </div>

        {/* Sección: Preferencias de Plataformas */}
        <div
          id="platform-defaults-section"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400 relative"
        >
          {/* Decorative background for the section */}
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 pb-3 mb-8 border-b border-gray-100 dark:border-neutral-800/50">
            <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t("platformSettings.title") || "Valores Predeterminados"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {platforms.map((platform) => {
              const platformSettings =
                watchedValues.global_platform_settings?.[
                platform.id.toLowerCase()
                ] || {};
              const hasSettings = Object.keys(platformSettings).length > 0;

              return (
                <div
                  key={platform.id}
                  onClick={() => handleOpenSettings(platform.id)}
                  className={`
                    group cursor-pointer p-6 rounded-2xl border transition-all duration-500
                    bg-white dark:bg-neutral-800/40 border-gray-100 dark:border-neutral-700/50 hover:border-primary-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 hover:shadow-xl dark:shadow-none hover:shadow-primary-500/10
                    ${hasSettings ? "ring-2 ring-primary-500/20" : ""}
                    hover:-translate-y-1 relative overflow-hidden
                  `}
                >
                  <div
                    className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-colors pointer-events-none`}
                  />
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 dark:bg-neutral-800 rounded-lg group-hover:scale-110 transition-transform">
                      <img
                        src={platform.icon}
                        alt={platform.name}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold truncate">
                        {platform.name}
                      </div>
                      <div
                        className={`text-[10px] font-medium uppercase tracking-wider ${hasSettings ? "text-green-500" : "text-gray-500"
                          }`}
                      >
                        {hasSettings
                          ? t("common.configured")
                          : t("common.notConfigured")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {activePlatform && (
          <PlatformSettingsModal
            isOpen={!!activePlatform}
            onClose={() => setActivePlatform(null)}
            platform={activePlatform}
            settings={
              watchedValues.global_platform_settings?.[
              activePlatform.toLowerCase()
              ] || {}
            }
            onSettingsChange={handleSettingsChange}
          />
        )}

        {mustVerifyEmail && user?.email_verified_at === null && (
          <div className="rounded-2xl p-6 space-y-4 shadow-inner bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
            <div className="flex items-center gap-3 font-bold text-amber-800 dark:text-amber-300">
              <div className="p-2 rounded-xl bg-amber-500/20">
                <MailWarning className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-lg">
                {t("profile.statistics.emailStatus")}:{" "}
                {t("profile.statistics.unverified")}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <p className="text-sm flex-1 leading-relaxed text-amber-700 dark:text-amber-200/70 font-medium">
                {t("profile.information.emailUnverified")}
              </p>
              <Link
                href={route("verification.send")}
                method="post"
                as="button"
                className="px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 bg-primary-600 hover:bg-primary-500 text-white border-0"
              >
                <Send className="w-4 h-4" />
                {t("profile.information.sendVerification")}
              </Link>
            </div>

            {status === "verification-link-sent" && (
              <div className="mt-4 text-sm font-bold flex items-center gap-2 p-4 rounded-xl bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                <CheckCircle className="w-5 h-5" />
                {t("profile.information.verificationSent")}
              </div>
            )}
          </div>
        )}

        <div className="pt-10 border-t border-gray-100 dark:border-neutral-800/50">
          <div className="flex items-center gap-3 pb-3 mb-8 border-b border-gray-100 dark:border-neutral-800/50">
            <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t("profile.information.sections.language")}
            </h3>
          </div>

          <div className="p-8 rounded-2xl border bg-white dark:bg-neutral-800/40 border-gray-200 dark:border-neutral-700/50 transition-all duration-300 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
                  {t("profile.information.applicationLanguage")}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-md">
                  {t("profile.information.languageDescription")}
                </div>
              </div>

              <div className="flex-shrink-0">
                {isChangingLanguage ? (
                  <div className="flex items-center gap-2 text-sm font-medium text-primary-500">
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    {t("common.changing")}
                  </div>
                ) : (
                  <LanguageSwitcher />
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-neutral-700/30 text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-gray-400 dark:text-gray-500">
              <Sparkles className="w-3.5 h-3.5" />
              {t("profile.information.currentLanguage")}:{" "}
              <span className="text-gray-800 dark:text-gray-200">
                {i18n.language === "en" ? "English" : "Español"}
              </span>
            </div>
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-gray-100 dark:border-neutral-800/50 transition-all duration-300">
          <div className="hidden sm:block">
            {hasChanges && !isSubmitting && (
              <div className="flex items-center gap-3 text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-800/50">
                <AlertTriangle className="w-4 h-4" />
                {t("profile.messages.unsavedChanges")}
              </div>
            )}
          </div>

          <Button
            disabled={isSubmitting || !hasChanges}
            icon={Save}
            loading={isSubmitting}
            loadingText={t("common.saving")}
            className={`w-full sm:w-auto min-w-[200px] transition-all duration-300 rounded-xl shadow-xl font-bold uppercase tracking-wider ${!hasChanges
                ? "opacity-50 grayscale"
                : "hover:scale-[1.05] active:scale-[0.95] bg-primary-600 hover:bg-primary-500 text-white border-0 shadow-primary-500/25"
              }`}
            type="submit"
            size="lg"
          >
            {t("profile.actions.saveChanges")}
          </Button>
        </div>
      </form>
    </ModernCard>
  );
}
