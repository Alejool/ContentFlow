import { UserProfileFormData, userProfileSchema } from "@/schemas/user";
import { useUserStore } from "@/stores/userStore";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useForm as useHookForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

export const useUpdateProfile = () => {
  const { t } = useTranslation();
  const { user, updateProfile, isLoading } = useUserStore();

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useHookForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema(t)),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
    },
  });

  const watchedName = watch("name");
  const watchedEmail = watch("email");

  const handleProfileUpdate = async (data: UserProfileFormData) => {
    try {
      const result = await updateProfile(data);
      if (result.success) {
        toast.success(result.message || t("profile.update_success"));
      } else {
        toast.error(result.message || t("profile.update_error"));
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        Object.entries(serverErrors).forEach(([key, value]: [any, any]) => {
          setError(key as keyof UserProfileFormData, { message: value[0] });
          toast.error(value[0]);
        });
      } else {
        toast.error(error.message || t("profile.update_error"));
      }
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(handleProfileUpdate),
    errors,
    isSubmitting: isSubmitting || isLoading,
    watchedName,
    watchedEmail,
    user: user!,
  };
};
