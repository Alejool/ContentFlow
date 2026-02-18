import ModernButton from "@/Components/common/Modern/Button.js";
import ModernInput from "@/Components/common/Modern/Input.js";
import { useUpdatePassword } from "@/Hooks/profile/useUpdatePassword.js";
import { Transition } from "@headlessui/react";
import { AlertTriangle, Check, Key, Lock, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UpdatePasswordFormProps {
  className?: string;
  user?: any;
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
}

const SuccessAlert = ({ show, t }: SuccessAlertProps) => (
  <Transition
    show={show}
    enter="transform transition duration-300 ease-out"
    enterFrom="translate-y-2 opacity-0"
    enterTo="translate-y-0 opacity-100"
    leave="transform transition duration-200 ease-in"
    leaveFrom="translate-y-0 opacity-100"
    leaveTo="translate-y-2 opacity-0"
  >
    <div className="flex items-center gap-4 p-5 rounded-lg mb-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 shadow-sm">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-green-100 dark:bg-green-800/40">
        <CheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <p className="text-sm font-bold text-green-800 dark:text-green-300 uppercase tracking-wide">
          {t("profile.password.successTitle")}
        </p>
        <p className="text-sm text-green-600 dark:text-green-400/80 font-medium">
          {t("profile.password.successMessage")}
        </p>
      </div>
    </div>
  </Transition>
);

const UpdatePasswordForm = ({
  className = "",
  user,
}: UpdatePasswordFormProps) => {
  const { t } = useTranslation();

  const { register, handleSubmit, errors, isSubmitting, isSuccess } =
    useUpdatePassword();

  return (
    <div className={className}>
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-2.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <LockIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t("profile.password.title")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              {t("profile.password.description")}
            </p>
          </div>
        </div>
      </header>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {errors && Object.keys(errors).length > 0 && (
          <div className="p-5 mb-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary-100 dark:bg-primary-800/40">
                <AlertTriangle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-bold text-sm text-primary-800 dark:text-primary-300 uppercase tracking-wide">
                {t("profile.password.errorTitle")}
              </h3>
            </div>
            <ul className="space-y-1.5 text-sm ml-11 list-disc text-primary-700 dark:text-primary-400 font-medium leading-relaxed">
              {Object.entries(errors).map(([field, error]: [string, any]) => (
                <li key={field}>{error.message}</li>
              ))}
            </ul>
          </div>
        )}

        <SuccessAlert show={isSuccess} t={t} />

        <form onSubmit={handleSubmit} className="space-y-6">
          <ModernInput
            id="current_password"
            label={t("profile.password.currentPassword")}
            type="password"
            placeholder={t("profile.password.placeholders.current")}
            register={register}
            error={errors.current_password?.message}
            showPasswordToggle
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
            icon={Lock}
          />

          <div className="pt-6">
            <ModernButton
              disabled={isSubmitting}
              variant="danger"
              icon={Key}
              loading={isSubmitting}
              className="w-full sm:w-auto min-w-[200px] font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-primary-500/20 active:scale-95 transition-transform"
            >
              {isSubmitting
                ? t("common.updating")
                : t("profile.password.updateButton")}
            </ModernButton>

            {isSubmitting && (
              <div className="mt-4 text-sm font-bold flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                {t("common.processing")}
              </div>
            )}
          </div>
        </form>

        <div className="mt-8 md:mt-12 p-5 sm:p-8 rounded-lg border border-primary-100 dark:border-primary-800/30 bg-primary-50/20 dark:bg-primary-900/10">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/40">
              <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h4 className="text-[10px] md:text-sm font-bold text-primary-900 dark:text-primary-300 uppercase tracking-widest">
              {t("profile.password.securityTips")}
            </h4>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-primary-800 dark:text-primary-400 font-medium">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 dark:bg-primary-600 mt-1.5 flex-shrink-0" />
              <span>{t("profile.password.tip1")}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 dark:bg-primary-600 mt-1.5 flex-shrink-0" />
              <span>{t("profile.password.tip2")}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 dark:bg-primary-600 mt-1.5 flex-shrink-0" />
              <span>{t("profile.password.tip3")}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 dark:bg-primary-600 mt-1.5 flex-shrink-0" />
              <span>
                {t("profile.password.tip4") ||
                  "Evita usar información personal como fechas de nacimiento o nombres"}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UpdatePasswordForm;
