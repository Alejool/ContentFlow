import React from "react";
import { Link, usePage } from "@inertiajs/react";
import { useForm as useHookForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema } from "@/schemas/schemas";
import { toast } from "react-hot-toast";

import ModernInput from "@/Components/Modern/ModernInput";
import ModernButton from "@/Components/Modern/ModernButton";
import ModernCard from "@/Components/Modern/ModernCard";
import axios from "axios";
import LanguageSwitcher from "@/Components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

const UserIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const SaveIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
    />
  </svg>
);

export default function UpdateProfileInformation({
  mustVerifyEmail,
  status,
  className = "",
}) {
  const user = usePage().props.auth.user;
  const { t } = useTranslation();

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
        toast.success(response.data.message || "Profile updated successfully");
        // Optionally reload to reflect changes if needed, though Inertia usually handles this via props
        // window.location.reload();
      } else if (response.data.warning) {
        toast(response.data.message || "No changes were made", { icon: "⚠️" });
      } else {
        toast.error(
          response.data.message || "An error occurred while updating profile"
        );
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

  return (
    <ModernCard
      title={t("profile.information.title")}
      description={t("profile.information.description")}
      icon={UserIcon}
      headerColor="blue"
      className={className}
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-6">
        <ModernInput
          id="name"
          label={t("profile.information.nameLabel")}
          register={register}
          error={errors.name?.message}
          placeholder={t("profile.information.namePlaceholder")}
        />

        <div className="flex items-center justify-between">
          <ModernInput
            id="email"
            label={t("profile.information.emailLabel")}
            type="email"
            register={register}
            error={errors.email?.message}
            placeholder={t("profile.information.emailPlaceholder")}
            containerClassName="flex-1"
          />
        </div>

        {mustVerifyEmail && user.email_verified_at === null && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 space-y-3">
            <div className="flex items-center gap-2 text-yellow-800 font-medium">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>
                {t("profile.statistics.emailStatus")}:{" "}
                {t("profile.statistics.unverified")}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-yellow-700">
                {t("profile.information.emailUnverified")}
              </p>
              <Link
                href={route("verification.send")}
                method="post"
                as="button"
                className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-sm font-medium rounded-md transition-colors shadow-sm"
              >
                {t("profile.information.sendVerification")}
              </Link>
            </div>

            {status === "verification-link-sent" && (
              <div className="mt-2 text-sm font-medium text-green-600 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {t("profile.information.verificationSent")}
              </div>
            )}
          </div>
        )}

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t("profile.information.applicationLanguage")}
          </h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">
              {t("profile.information.languageDescription")}
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <ModernButton
            disabled={isSubmitting || !isDirty}
            variant="primary"
            icon={SaveIcon}
          >
            Save Changes
          </ModernButton>

          {/* Saved message removed in favor of Toast notifications */}
        </div>
      </form>
    </ModernCard>
  );
}
