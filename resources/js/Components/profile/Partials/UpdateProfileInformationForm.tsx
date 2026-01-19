import IconFacebook from "@/../assets/Icons/facebook.svg";
import IconTiktok from "@/../assets/Icons/tiktok.svg";
import IconTwitter from "@/../assets/Icons/x.svg";
import IconYoutube from "@/../assets/Icons/youtube.svg";
import PlatformSettingsModal from "@/Components/ConfigSocialMedia/PlatformSettingsModal";
import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import Textarea from "@/Components/common/Modern/Textarea";
import LanguageSwitcher from "@/Components/common/ui/LanguageSwitcher";
import { useTheme } from "@/Hooks/useTheme";
import { useUser } from "@/Hooks/useUser";
import { Link } from "@inertiajs/react";
import {
  AlertTriangle,
  CheckCircle,
  Mail,
  MailWarning,
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
    <div className={className}>
      <form onSubmit={handleSubmit} className="">
        {/* Sección: Información Personal */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2.5 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {t("profile.information.title")}
                  </h2>
                  {user?.email_verified_at && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                      <ShieldCheck className="w-3 h-3" />
                      {t("profile.statistics.verified")}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-neutral-400">
                  {t("profile.information.description")}
                </p>
              </div>
            </div>
          </header>
          <div className="flex items-center gap-3 pb-2 ">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
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
            </div>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <div className="flex items-center gap-3 pb-2 border-t border-gray-50 dark:border-neutral-800/50 pt-8 md:pt-10">
            <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
              {t("profile.information.sections.contact")}
            </h3>
          </div>

          <div className="max-w-md">
            <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {t("profile.information.phoneLabel")}
            </label>
            <div
              className={`relative transition-all duration-300 rounded-lg border bg-gray-50 dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50 hover:border-primary-400/50 dark:hover:border-primary-600/50 focus-within:ring-4 focus-within:ring-primary-500/10 focus-within:border-primary-500 ${
                errors.phone ? "border-primary-500" : ""
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

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 border-t border-gray-50 dark:border-neutral-800/50 pt-8 md:pt-10">
          <div className="flex items-center gap-3 pb-2">
            <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
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
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400 relative border-t border-gray-50 dark:border-neutral-800/50 pt-8 md:pt-10"
        >
          {/* Decorative background for the section */}
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 pb-2">
            <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
              {t("platformSettings.title") ||
                "Ajustes de Publicación Predeterminados"}
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
                    group cursor-pointer p-5 rounded-lg border transition-all duration-300
                    bg-white dark:bg-neutral-800/40 border-gray-200 dark:border-neutral-700 hover:border-primary-500 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-lg
                    ${hasSettings ? "ring-2 ring-primary-500/20" : ""}
                    hover:-translate-y-1 relative overflow-hidden
                  `}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-gray-100 dark:bg-neutral-700 rounded-lg group-hover:scale-110 group-hover:bg-primary-500/10 group-hover:text-primary-600 transition-all">
                      <img
                        src={platform.icon}
                        alt={platform.name}
                        className="w-6 h-6"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-bold">{platform.name}</div>
                      <div
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          hasSettings
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-neutral-500"
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
          <div className="rounded-2xl p-6 shadow-inner bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
            <div className="flex items-center gap-3 font-bold text-amber-800 dark:text-amber-300">
              <div className="p-2 rounded-lg bg-amber-500/20">
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
                className="px-6 py-3 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 bg-primary-600 hover:bg-primary-500 text-white border-0"
              >
                <Send className="w-4 h-4" />
                {t("profile.information.sendVerification")}
              </Link>
            </div>

            {status === "verification-link-sent" && (
              <div className="mt-4 text-sm font-bold flex items-center gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                <CheckCircle className="w-5 h-5" />
                {t("profile.information.verificationSent")}
              </div>
            )}
          </div>
        )}

        <div className="pt-8 md:pt-10 border-t border-gray-100 dark:border-neutral-800/50">
          <div className="flex items-center gap-3 pb-3 mb-6">
            <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
              {t("profile.information.sections.language")}
            </h3>
          </div>

          <div className="p-6 sm:p-10 rounded-lg border bg-gray-50/50 dark:bg-neutral-800/20 border-gray-200 dark:border-neutral-700/50 transition-all duration-300 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-20 h-20 text-primary-500" />
            </div>
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-500/10 text-primary-600">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="font-extrabold text-xl text-gray-900 dark:text-gray-100">
                    {t("profile.information.applicationLanguage")}
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-md font-medium">
                  {t("profile.information.languageDescription")}
                </div>
                <div className="pt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                  {t("profile.information.currentLanguage")}:{" "}
                  <span className="text-primary-600 dark:text-primary-400">
                    {i18n.language === "en" ? "English" : "Español"}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0 bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-neutral-700">
                {isChangingLanguage ? (
                  <div className="flex items-center gap-3 text-sm font-bold text-primary-500 px-4">
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    {t("common.changing")}
                  </div>
                ) : (
                  <div className="scale-110 origin-right">
                    <LanguageSwitcher />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-gray-100 dark:border-neutral-800/50 transition-all duration-300">
          <div className="hidden sm:block">
            {hasChanges && !isSubmitting && (
              <div className="flex items-center gap-3 text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-800/50">
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
            className={`w-full sm:w-auto min-w-[200px] transition-all duration-300 rounded-lg shadow-xl font-bold uppercase tracking-wider ${
              !hasChanges
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
    </div>
  );
}
