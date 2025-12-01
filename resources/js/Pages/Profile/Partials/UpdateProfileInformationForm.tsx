import React from "react";
import { Link, usePage } from "@inertiajs/react";
import { useForm as useHookForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema } from "@/schemas/schemas";
import { toast } from "react-toastify";

import ModernInput from "@/Components/Modern/ModernInput";
import ModernButton from "@/Components/Modern/ModernButton";
import ModernCard from "@/Components/Modern/ModernCard";
import axios from "axios";

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
        toast.warning(response.data.message || "No changes were made");
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
          error.response?.data?.message ||
            "An error occurred while updating profile"
        );
      }
    }
  };

  return (
    <ModernCard
      title="Profile Information"
      description="Update your account's profile information and email address."
      icon={UserIcon}
      headerColor="blue"
      className={className}
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-6">
        <ModernInput
          id="name"
          label="Name"
          register={register}
          error={errors.name?.message}
          placeholder="Your Name"
        />

        <ModernInput
          id="email"
          label="Email"
          type="email"
          register={register}
          error={errors.email?.message}
          placeholder="your.email@example.com"
        />

        {mustVerifyEmail && user.email_verified_at === null && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              Your email address is unverified.
              <Link
                href={route("verification.send")}
                method="post"
                as="button"
                className="ml-1 underline font-medium hover:text-yellow-900 transition-colors"
              >
                Click here to re-send the verification email.
              </Link>
            </p>

            {status === "verification-link-sent" && (
              <div className="mt-2 text-sm font-medium text-green-600">
                A new verification link has been sent to your email address.
              </div>
            )}
          </div>
        )}

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
