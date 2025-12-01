import React from "react";
import { useUpdatePassword } from "../Hooks/useUpdatePassword.ts";
import ModernInput from "@/Components/Modern/ModernInput";
import ModernButton from "@/Components/Modern/ModernButton";
import ModernCard from "@/Components/Modern/ModernCard";
import { Transition } from "@headlessui/react";
import { useTranslation } from "react-i18next";

const LockIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

const CheckIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

// Success Alert Component
const SuccessAlert = ({ show, t }) => (
  <Transition
    show={show}
    enter="transform transition duration-300 ease-out"
    enterFrom="translate-y-2 opacity-0"
    enterTo="translate-y-0 opacity-100"
    leave="transform transition duration-200 ease-in"
    leaveFrom="translate-y-0 opacity-100"
    leaveTo="translate-y-2 opacity-0"
  >
    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-6">
      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
        <CheckIcon className="w-5 h-5 text-green-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-green-800">
          {t("profile.password.successTitle")}
        </p>
        <p className="text-xs text-green-600">
          {t("profile.password.successMessage")}
        </p>
      </div>
    </div>
  </Transition>
);

const UpdatePasswordForm = ({ className = "" }) => {
  const { t } = useTranslation();
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
      {/* Error Summary Section */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 mb-6 bg-red-50 border border-red-100 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-red-800 text-sm">
              {t("profile.password.errorTitle")}
            </h3>
          </div>
          <ul className="space-y-1 text-sm text-red-700 ml-9 list-disc">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      <SuccessAlert show={isSuccess} t={t} />

      <form onSubmit={handleSubmit(updatePassword)} className="space-y-6">
        <ModernInput
          id="current_password"
          label={t("profile.password.currentPassword")}
          type="password"
          placeholder={t("profile.password.placeholders.current")}
          register={register}
          error={errors.current_password?.message}
          showPasswordToggle
        />

        <ModernInput
          id="password"
          label={t("profile.password.newPassword")}
          type="password"
          placeholder={t("profile.password.placeholders.new")}
          register={register}
          error={errors.password?.message}
          showPasswordToggle
        />

        <ModernInput
          id="password_confirmation"
          label={t("profile.password.confirmPassword")}
          type="password"
          placeholder={t("profile.password.placeholders.confirm")}
          register={register}
          error={errors.password_confirmation?.message}
          showPasswordToggle
        />

        <div className="pt-4">
          <ModernButton
            disabled={isSubmitting}
            variant="danger"
            icon={LockIcon}
          >
            {t("profile.password.updateButton")}
          </ModernButton>
        </div>
      </form>

      {/* Security Tips */}
      <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-100">
        <h4 className="text-sm font-semibold text-orange-900 mb-2">
          {t("profile.password.securityTips")}
        </h4>
        <ul className="text-xs text-orange-800 space-y-2">
          <li>• {t("profile.password.tip1")}</li>
          <li>• {t("profile.password.tip2")}</li>
          <li>• {t("profile.password.tip3")}</li>
        </ul>
      </div>
    </ModernCard>
  );
};

export default UpdatePasswordForm;
