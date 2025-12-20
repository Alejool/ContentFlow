import Button from "@/Components/common/Modern/Button";
import ModernCard from "@/Components/common/Modern/Card";
import CountryCodeSelector from "@/Components/common/Modern/CountryCodeSelector";
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
  User as UserIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

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
  } = useUser(null);

  const sectionHeaderClass = `flex items-center gap-2 pb-2 mb-6 border-b ${
    theme === "dark" ? "border-neutral-700/50" : "border-gray-200"
  }`;

  const sectionTitleClass = `text-lg font-bold tracking-tight ${
    theme === "dark" ? "text-purple-400" : "text-purple-700"
  }`;

  return (
    <ModernCard
      title={t("profile.information.title")}
      description={t("profile.information.description")}
      icon={UserIcon}
      headerColor="custom"
      customGradient={
        theme === "dark"
          ? "from-purple-900 via-indigo-950 to-neutral-900"
          : "from-purple-600 via-indigo-600 to-indigo-700"
      }
      className={`${className} shadow-2xl relative overflow-hidden`}
    >
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <form onSubmit={handleSubmit} className="space-y-10 relative">
        {/* Sección: Información Personal */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className={sectionHeaderClass}>
            <div
              className={`p-2 rounded-lg ${
                theme === "dark"
                  ? "bg-purple-500/20 text-purple-400"
                  : "bg-purple-100 text-purple-600"
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
              className="transition-all focus:scale-[1.01]"
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
                className="opacity-80"
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
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              <Phone className="w-5 h-5" />
            </div>
            <h3 className={sectionTitleClass}>
              {t("profile.information.sections.contact")}
            </h3>
          </div>

          <div className="max-w-md">
            <Input
              id="phone"
              label={t("profile.information.phoneLabel")}
              placeholder={t("profile.information.phonePlaceholder")}
              theme={theme}
              register={register}
              error={errors.phone?.message}
              sizeType="lg"
              variant="filled"
              prefix={
                <CountryCodeSelector
                  value={watchedValues.country_code}
                  onChange={(code) =>
                    setValue("country_code", code, { shouldDirty: true })
                  }
                  disabled={isSubmitting}
                />
              }
              className="transition-all focus:scale-[1.01]"
            />
          </div>
        </div>

        {/* Sección: Sobre Mí */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <div className={sectionHeaderClass}>
            <div
              className={`p-2 rounded-lg ${
                theme === "dark"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-amber-100 text-amber-600"
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
            className="transition-all focus:scale-[1.01] resize-none"
          />
        </div>

        {mustVerifyEmail && user?.email_verified_at === null && (
          <div
            className={`rounded-xl p-5 space-y-4 transition-all duration-500 shadow-inner
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
                className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-sm
                  ${
                    theme === "dark"
                      ? "bg-amber-600 hover:bg-amber-500 text-white"
                      : "bg-amber-500 hover:bg-amber-600 text-white"
                  }`}
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
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-emerald-100 text-emerald-600"
              }`}
            >
              <Globe className="w-5 h-5" />
            </div>
            <h3 className={sectionTitleClass}>
              {t("profile.information.sections.language")}
            </h3>
          </div>

          <div
            className={`p-6 rounded-2xl border transition-all duration-300 group
              ${
                theme === "dark"
                  ? "bg-neutral-800/40 border-neutral-700/50 hover:bg-neutral-800/60"
                  : "bg-white border-gray-200 hover:shadow-md"
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
                  <div className="flex items-center gap-2 text-sm font-medium text-purple-500">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
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
                className={`flex items-center gap-2 text-sm font-medium animate-pulse
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
            className={`w-full sm:w-auto min-w-[180px] transition-all duration-300 rounded-xl shadow-lg hover:shadow-purple-500/20 ${
              !hasChanges
                ? "opacity-50 grayscale"
                : "hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0"
            }`}
            type="submit"
            size="lg"
          >
            {t("profile.actions.saveChanges")}
          </Button>
        </div>

        {hasChanges && !isSubmitting && (
          <div className="sm:hidden text-center">
            <div
              className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full
                  ${
                    theme === "dark"
                      ? "bg-amber-900/20 text-amber-400"
                      : "bg-amber-50 text-amber-600"
                  }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {t("profile.messages.unsavedChanges")}
            </div>
          </div>
        )}
      </form>
    </ModernCard>
  );
}
鼓;
