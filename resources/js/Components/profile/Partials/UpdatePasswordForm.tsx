import ModernButton from "@/Components/common/Modern/Button.js";
import ModernCard from "@/Components/common/Modern/Card.js";
import ModernInput from "@/Components/common/Modern/Input.js";
import { useUpdatePassword } from "@/Hooks/profile/useUpdatePassword.js";
import { useTheme } from "@/Hooks/useTheme";
import { Transition } from "@headlessui/react";
import { AlertTriangle, Check, Key, Lock, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UpdatePasswordFormProps {
  className?: string;
}

interface IconProps {
  className?: string;
}

const LockIcon = ({ className }: IconProps) => <Lock className={className} />;

const CheckIcon = ({ className = "w-5 h-5" }: IconProps) => (
  <Check className={className} />
);

interface SuccessAlertProps {
  show: boolean;
  t: (key: string) => string;
  theme: "dark" | "light";
}

const SuccessAlert = ({ show, t, theme }: SuccessAlertProps) => (
  <Transition
    show={show}
    enter="transform transition duration-300 ease-out"
    enterFrom="translate-y-2 opacity-0"
    enterTo="translate-y-0 opacity-100"
    leave="transform transition duration-200 ease-in"
    leaveFrom="translate-y-0 opacity-100"
    leaveTo="translate-y-2 opacity-0"
  >
    <div
      className={`flex items-center gap-3 p-4 rounded-lg mb-6 ${
        theme === "dark"
          ? "bg-green-900/20 border border-green-800/30"
          : "bg-green-50 border border-green-200"
      }`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          theme === "dark" ? "bg-green-800/40" : "bg-green-100"
        }`}
      >
        <CheckIcon
          className={`w-5 h-5 ${
            theme === "dark" ? "text-green-400" : "text-green-600"
          }`}
        />
      </div>
      <div>
        <p
          className={`text-sm font-medium ${
            theme === "dark" ? "text-green-300" : "text-green-800"
          }`}
        >
          {t("profile.password.successTitle")}
        </p>
        <p
          className={`text-xs ${
            theme === "dark" ? "text-green-400/80" : "text-green-600"
          }`}
        >
          {t("profile.password.successMessage")}
        </p>
      </div>
    </div>
  </Transition>
);

const UpdatePasswordForm = ({ className = "" }: UpdatePasswordFormProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    isSuccess,
    updatePassword,
  } = useUpdatePassword();

  return (
    <ModernCard
      title={t("profile.password.title")}
      description={t("profile.password.description")}
      icon={LockIcon}
      headerColor="orange"
      className={className}
    >
      {Object.keys(errors).length > 0 && (
        <div
          className={`p-4 mb-6 rounded-lg ${
            theme === "dark"
              ? "bg-primary-900/20 border border-primary-800/30"
              : "bg-primary-50 border border-primary-100"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                theme === "dark" ? "bg-primary-800/40" : "bg-primary-100"
              }`}
            >
              <AlertTriangle
                className={`w-4 h-4 ${
                  theme === "dark" ? "text-primary-400" : "text-primary-600"
                }`}
              />
            </div>
            <h3
              className={`font-semibold text-sm ${
                theme === "dark" ? "text-primary-300" : "text-primary-800"
              }`}
            >
              {t("profile.password.errorTitle")}
            </h3>
          </div>
          <ul
            className={`space-y-1 text-sm ml-9 list-disc ${
              theme === "dark" ? "text-primary-400" : "text-primary-700"
            }`}
          >
            {Object.entries(errors).map(([field, error]: [string, any]) => (
              <li key={field}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      <SuccessAlert show={isSuccess} t={t} theme={theme} />

      <form onSubmit={handleSubmit(updatePassword)} className="space-y-6">
        <ModernInput
          id="current_password"
          label={t("profile.password.currentPassword")}
          type="password"
          placeholder={t("profile.password.placeholders.current")}
          register={register}
          error={errors.current_password?.message}
          showPasswordToggle
          theme={theme}
          icon={Key}
        />

        <ModernInput
          id="password"
          label={t("profile.password.newPassword")}
          type="password"
          placeholder={t("profile.password.placeholders.new")}
          register={register}
          error={errors.password?.message}
          showPasswordToggle
          theme={theme}
          icon={Lock}
        />

        <ModernInput
          id="password_confirmation"
          label={t("profile.password.confirmPassword")}
          type="password"
          placeholder={t("profile.password.placeholders.confirm")}
          register={register}
          error={errors.password_confirmation?.message}
          showPasswordToggle
          theme={theme}
          icon={Lock}
        />

        <div className="pt-4">
          <ModernButton
            disabled={isSubmitting}
            variant="danger"
            icon={LockIcon}
            theme={theme}
            loading={isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting
              ? t("common.updating")
              : t("profile.password.updateButton")}
          </ModernButton>

          {isSubmitting && (
            <div
              className={`mt-2 text-sm flex items-center gap-2 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <div
                className={`w-3 h-3 border-2 rounded-full animate-spin ${
                  theme === "dark"
                    ? "border-gray-400 border-t-transparent"
                    : "border-gray-500 border-t-transparent"
                }`}
              ></div>
              {t("common.processing")}
            </div>
          )}
        </div>
      </form>

      <div
        className={`mt-8 p-4 rounded-lg border ${
          theme === "dark"
            ? "bg-primary-900/10 border-primary-800/30"
            : "bg-primary-50 border-primary-100"
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <Shield
            className={`w-5 h-5 ${
              theme === "dark" ? "text-primary-400" : "text-primary-700"
            }`}
          />
          <h4
            className={`text-sm font-semibold ${
              theme === "dark" ? "text-primary-300" : "text-primary-900"
            }`}
          >
            {t("profile.password.securityTips")}
          </h4>
        </div>
        <ul
          className={`text-xs space-y-2 ${
            theme === "dark" ? "text-primary-400/80" : "text-primary-800"
          }`}
        >
          <li className="flex items-start gap-2">
            <span className="mt-0.5">•</span>
            <span>{t("profile.password.tip1")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5">•</span>
            <span>{t("profile.password.tip2")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5">•</span>
            <span>{t("profile.password.tip3")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5">•</span>
            <span>
              {t("profile.password.tip4") ||
                "Evita usar información personal como fechas de nacimiento o nombres"}
            </span>
          </li>
        </ul>
      </div>
    </ModernCard>
  );
};

export default UpdatePasswordForm;
