import { useTheme } from "@/Hooks/useTheme";
import { profileSchema } from "@/schemas/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, usePage } from "@inertiajs/react";
import axios from "axios";
import { useState } from "react";
import { useForm as useHookForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/Components/LanguageSwitcher";
import ModernButton from "@/Components/Modern/ModernButton";
import ModernCard from "@/Components/Modern/ModernCard";
import ModernInput from "@/Components/Modern/ModernInput";
import {
  AlertTriangle,
  CheckCircle,
  Globe,
  Mail,
  MailWarning,
  Save,
  Send,
  User,
} from "lucide-react";

interface UpdateProfileInformationProps {
  mustVerifyEmail: boolean;
  status: string;
  className?: string;
}
export default function UpdateProfileInformation({
  mustVerifyEmail,
  status,
  className = "",
}: UpdateProfileInformationProps) {
  const user = usePage().props.auth.user;
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useHookForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  const submit = async (data) => {
    try {
      const response = await axios.patch(route("profile.update"), data);

      if (response.data.success) {
        toast.success(
          response.data.message || t("profile.toast.updateSuccess")
        );
      } else if (response.data.warning) {
        toast(response.data.message || t("profile.toast.noChanges"), {
          icon: "⚠️",
          style: {
            background: theme === "dark" ? "#374151" : "#f3f4f6",
            color: theme === "dark" ? "#f9fafb" : "#374151",
          },
        });
      } else {
        toast.error(response.data.message || t("profile.toast.errorUpdating"));
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          setError(key, { message: value[0] });
          toast.error(value[0]);
        });
      } else {
        toast.error(
          error.response?.data?.message || t("profile.toast.errorUpdating")
        );
      }
    }
  };

  const handleLanguageChange = async (lang) => {
    try {
      setIsChangingLanguage(true);
      await i18n.changeLanguage(lang);
      localStorage.setItem("i18nextLng", lang);
      toast.success(t("profile.toast.languageChanged"));
    } catch (error) {
      toast.error(t("profile.toast.languageChangeError"));
    } finally {
      setIsChangingLanguage(false);
    }
  };

  return (
    <ModernCard
      title={t("profile.information.title")}
      description={t("profile.information.description")}
      icon={User}
      headerColor="green"
      className={className}
      variant="elevated"
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-6">
        <ModernInput
          id="name"
          label={t("profile.information.nameLabel")}
          register={register}
          error={errors.name?.message}
          placeholder={t("profile.information.namePlaceholder")}
          theme={theme}
          icon={User}
        />

        <div className="relative">
          <ModernInput
            id="email"
            label={t("profile.information.emailLabel")}
            type="email"
            register={register}
            error={errors.email?.message}
            placeholder={t("profile.information.emailPlaceholder")}
            containerClassName="flex-1"
            theme={theme}
            icon={Mail}
          />

          {user.email_verified_at && (
            <div
              className={`absolute right-0 top-6 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium
                ${
                  theme === "dark"
                    ? "bg-green-900/30 text-green-300 border border-green-800/50"
                    : "bg-green-100 text-green-800 border border-green-200"
                }`}
            >
              <CheckCircle className="w-3 h-3" />
              {t("profile.statistics.verified")}
            </div>
          )}
        </div>

        {mustVerifyEmail && user.email_verified_at === null && (
          <div
            className={`rounded-xl p-4 space-y-3 transition-colors duration-300
              ${
                theme === "dark"
                  ? "bg-yellow-900/20 border border-yellow-800/30"
                  : "bg-yellow-50 border border-yellow-200"
              }`}
          >
            <div
              className={`flex items-center gap-2 font-medium
                ${theme === "dark" ? "text-yellow-300" : "text-yellow-800"}`}
            >
              <MailWarning className="w-5 h-5" />
              <span>
                {t("profile.statistics.emailStatus")}:{" "}
                {t("profile.statistics.unverified")}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p
                className={`text-sm flex-1
                  ${
                    theme === "dark" ? "text-yellow-400/80" : "text-yellow-700"
                  }`}
              >
                {t("profile.information.emailUnverified")}
              </p>
              <Link
                href={route("verification.send")}
                method="post"
                as="button"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-sm
                  ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-yellow-700/30 to-yellow-800/30 text-yellow-300 border border-yellow-700/30 hover:from-yellow-700/40 hover:to-yellow-800/40 hover:border-yellow-600/50"
                      : "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300 hover:from-yellow-200 hover:to-yellow-300"
                  }`}
              >
                <Send className="w-4 h-4" />
                {t("profile.information.sendVerification")}
              </Link>
            </div>

            {status === "verification-link-sent" && (
              <div
                className={`mt-2 text-sm font-medium flex items-center gap-2 p-3 rounded-lg
                  ${
                    theme === "dark"
                      ? "bg-green-900/20 text-green-300 border border-green-800/30"
                      : "bg-green-50 text-green-700 border border-green-200"
                  }`}
              >
                <CheckCircle className="w-4 h-4" />
                {t("profile.information.verificationSent")}
              </div>
            )}
          </div>
        )}

        <div
          className={`border-t pt-6 transition-colors duration-300
            ${theme === "dark" ? "border-neutral-700/50" : "border-gray-200"}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe
              className={`w-5 h-5 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            />
            <h3
              className={`text-lg font-medium ${
                theme === "dark" ? "text-gray-200" : "text-gray-900"
              }`}
            >
              {t("profile.information.applicationLanguage")}
            </h3>
          </div>

          <div
            className={`p-4 rounded-xl border transition-colors duration-300
              ${
                theme === "dark"
                  ? "bg-neutral-800/30 border-neutral-700/50"
                  : "bg-gray-50 border-gray-200"
              }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div
                className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {t("profile.information.languageDescription")}
              </div>

              <div className="flex-shrink-0">
                <div className="flex items-center gap-2">
                  {isChangingLanguage ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      {t("common.changing")}
                    </div>
                  ) : (
                    <LanguageSwitcher />
                  )}
                </div>
              </div>
            </div>

            <div
              className={`mt-3 text-xs ${
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {t("profile.information.currentLanguage")}:{" "}
              {i18n.language === "en" ? "English" : "Español"}
            </div>
          </div>
        </div>

        <div
          className={`flex items-center gap-4 pt-4 border-t transition-colors duration-300
            ${theme === "dark" ? "border-neutral-700/50" : "border-gray-200"}`}
        >
          <ModernButton
            disabled={isSubmitting || !isDirty}
            variant="primary"
            icon={Save}
            theme={theme}
            loading={isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting
              ? t("common.saving")
              : t("profile.actions.saveChanges")}
          </ModernButton>

          {isSubmitting && (
            <div
              className={`text-sm flex items-center gap-2
                ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
            >
              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              {t("common.processing")}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {isDirty && !isSubmitting && (
            <div
              className={`flex items-center gap-2 text-sm
                ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
            >
              <AlertTriangle className="w-4 h-4" />
              {t("profile.messages.unsavedChanges")}
            </div>
          )}
        </div>
      </form>
    </ModernCard>
  );
}
