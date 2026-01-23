import { PasswordFormData, passwordSchema } from "@/schemas/user";
import { useUserStore } from "@/stores/userStore";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useState } from "react";
import { useForm as useHookForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

export const useUpdatePassword = () => {
  const { t } = useTranslation();
  const [isSuccess, setIsSuccess] = useState(false);
  const { updatePassword, isLoading } = useUserStore();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useHookForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema(t)),
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  const handleUpdatePassword = async (data: PasswordFormData) => {
    try {
      setIsSuccess(false);
      const result = await updatePassword(data);
      if (result.success) {
        reset();
        setIsSuccess(true);
        toast.success(result.message || t("profile.password.successTitle"));
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        toast.error(result.message || t("profile.update_error"));
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        Object.entries(serverErrors).forEach(([key, value]: [any, any]) => {
          setError(key as keyof PasswordFormData, { message: value[0] });
          toast.error(value[0]);
        });
      } else {
        toast.error(error.message || t("profile.update_error"));
      }
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(handleUpdatePassword),
    errors,
    isSubmitting: isSubmitting || isLoading,
    isSuccess,
    resetForm: reset,
  };
};
