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

  const sectionHeaderClass = `flex items-center gap-2 pb-2 mb-6 border-b ${
    theme === "dark" ? "border-neutral-700/50" : "border-gray-200"
  }`;

  const sectionTitleClass = `text-lg font-bold tracking-tight ${
    theme === "dark" ? "text-primary-400" : "text-primary-700"
  }`;

  return (
    <ModernCard
      title={t("profile.information.title")}
      description={t("profile.information.description")}
      icon={UserIcon}
      headerColor="orange" // Standard primary theme for the project
      className={className}
    >
      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Sección: Información Personal */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className={sectionHeaderClass}>
            <div
              className={`p-2 rounded-lg ${
                theme === "dark"
                  ? "bg-primary-500/20 text-primary-400"
                  : "bg-primary-50 text-primary-600"
              }`}
            >
              <UserIcon className="w-5 h-5" />
            </div>
            <h3 className={sectionTitleClass}>
              {t("profile.information.sections.personal")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Input
              id="name"
              label={t("profile.information.nameLabel")}
              placeholder={t("profile.information.namePlaceholder")}
              theme={theme}
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
                theme={theme}
                sizeType="lg"
                variant="filled"
                icon={Mail}
                disabled
                required
              />

              {user?.email_verified_at && (
                <div
                  className={`absolute right-0 top-6 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${
                      theme === "dark"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-green-100 text-green-700 border border-green-200"
                    }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {t("profile.statistics.verified")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección: Detalles de Contacto */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <div className={sectionHeaderClass}>
            <div
              className={`p-2 rounded-lg ${
                theme === "dark"
                  ? "bg-primary-500/20 text-primary-400"
                  : "bg-primary-50 text-primary-600"
              }`}
            >
              <Phone className="w-5 h-5" />
            </div>
            <h3 className={sectionTitleClass}>
              {t("profile.information.sections.contact")}
            </h3>
          </div>

          <div className="max-w-md">
            <label
              className={`block mb-2 text-sm font-medium ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {t("profile.information.phoneLabel")}
            </label>
            <div
              className={`relative transition-all duration-200 rounded-lg border ${
                theme === "dark"
                  ? "bg-neutral-800/50 border-neutral-700/50 hover:border-neutral-600/70 focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-400"
                  : "bg-gray-50 border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500"
              } ${errors.phone ? "border-primary-500" : ""}`}
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
                    className={`modern-phone-input p-3 ${
                      theme === "dark" ? "dark-theme" : "light-theme"
                    }`}
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

        {/* Sección: Sobre Mí */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <div className={sectionHeaderClass}>
            <div
              className={`p-2 rounded-lg ${
                theme === "dark"
                  ? "bg-primary-500/20 text-primary-400"
                  : "bg-primary-50 text-primary-600"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className={sectionTitleClass}>
              {t("profile.information.sections.bio")}
            </h3>
          </div>

          <Textarea
            id="bio"
            label={t("profile.information.bioLabel")}
            placeholder={t("profile.information.bioPlaceholder")}
            theme={theme}
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
          <div className={sectionHeaderClass}>
            <div
              className={`p-2 rounded-lg ${
                theme === "dark"
                  ? "bg-primary-500/20 text-primary-400"
                  : "bg-primary-50 text-primary-600"
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className={sectionTitleClass}>
              {t("platformSettings.title") ||
                "Valores Predeterminados"}
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
                    ${
                      theme === "dark"
                        ? "bg-neutral-800/40 border-neutral-700/50 hover:border-primary-500/50 hover:bg-neutral-800/80"
                        : "bg-white border-gray-100 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-500/10"
                    }
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
                        className={`text-[10px] font-medium uppercase tracking-wider ${
                          hasSettings ? "text-green-500" : "text-gray-500"
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
          <div
            className={`rounded-xl p-5 space-y-4 shadow-inner
              ${
                theme === "dark"
                  ? "bg-amber-900/10 border border-amber-800/30"
                  : "bg-amber-50 border border-amber-200"
              }`}
          >
            <div
              className={`flex items-center gap-3 font-semibold
                ${theme === "dark" ? "text-amber-300" : "text-amber-800"}`}
            >
              <div className="p-1.5 rounded-full bg-amber-500/20">
                <MailWarning className="w-5 h-5" />
              </div>
              <span>
                {t("profile.statistics.emailStatus")}:{" "}
                {t("profile.statistics.unverified")}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p
                className={`text-sm flex-1 leading-relaxed
                  ${theme === "dark" ? "text-amber-200/70" : "text-amber-700"}`}
              >
                {t("profile.information.emailUnverified")}
              </p>
              <Link
                href={route("verification.send")}
                method="post"
                as="button"
                className="px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-sm bg-primary-600 hover:bg-primary-500 text-white border-0"
              >
                <Send className="w-4 h-4" />
                {t("profile.information.sendVerification")}
              </Link>
            </div>

            {status === "verification-link-sent" && (
              <div
                className={`mt-2 text-sm font-semibold flex items-center gap-2 p-3 rounded-lg
                  ${
                    theme === "dark"
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-green-50 text-green-700 border border-green-200"
                  }`}
              >
                <CheckCircle className="w-4 h-4" />
                {t("profile.information.verificationSent")}
              </div>
            )}
          </div>
        )}

        {/* Sección: Idioma */}
        <div
          className={`pt-10 border-t ${
            theme === "dark" ? "border-neutral-700/50" : "border-gray-200"
          }`}
        >
          <div className={sectionHeaderClass}>
            <div
              className={`p-2 rounded-lg ${
                theme === "dark"
                  ? "bg-primary-500/20 text-primary-400"
                  : "bg-primary-50 text-primary-600"
              }`}
            >
              <Globe className="w-5 h-5" />
            </div>
            <h3 className={sectionTitleClass}>
              {t("profile.information.sections.language")}
            </h3>
          </div>

          <div
            className={`p-6 rounded-2xl border transition-all duration-300
              ${
                theme === "dark"
                  ? "bg-neutral-800/40 border-neutral-700/50"
                  : "bg-white border-gray-200"
              }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <div
                  className={`font-semibold ${
                    theme === "dark" ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  {t("profile.information.applicationLanguage")}
                </div>
                <div
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
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

            <div
              className={`mt-4 pt-4 border-t text-xs font-medium flex items-center gap-2 ${
                theme === "dark"
                  ? "border-neutral-700/30 text-gray-500"
                  : "border-gray-100 text-gray-400"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              {t("profile.information.currentLanguage")}:{" "}
              <span
                className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
              >
                {i18n.language === "en" ? "English" : "Español"}
              </span>
            </div>
          </div>
        </div>

        {/* Botón de Guardar */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t transition-all duration-300
            ${theme === "dark" ? "border-neutral-700/50" : "border-gray-200"}`}
        >
          <div className="hidden sm:block">
            {hasChanges && !isSubmitting && (
              <div
                className={`flex items-center gap-2 text-sm font-medium
                  ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}
              >
                <AlertTriangle className="w-4 h-4" />
                {t("profile.messages.unsavedChanges")}
              </div>
            )}
          </div>

          <Button
            disabled={isSubmitting || !hasChanges}
            icon={Save}
            theme={theme}
            loading={isSubmitting}
            loadingText={t("common.saving")}
            className={`w-full sm:w-auto min-w-[180px] transition-all duration-300 rounded-xl shadow-lg ${
              !hasChanges
                ? "opacity-50 grayscale"
                : "hover:scale-[1.02] active:scale-[0.98] bg-primary-600 hover:bg-primary-500 text-white border-0"
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
