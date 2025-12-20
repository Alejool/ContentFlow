import { PasswordFormData, passwordSchema } from "@/schemas/user";
import { useUserStore } from "@/stores/userStore";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useState } from "react";
import { useForm as useHookForm } from "react-hook-form";
import { toast } from "react-hot-toast";

export const useUpdatePassword = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const { updatePassword, isLoading } = useUserStore();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useHookForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
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
        toast.success(result.message || "Password updated successfully");
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        toast.error(result.message || "Failed to update password");
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        Object.entries(serverErrors).forEach(([key, value]: [any, any]) => {
          setError(key as keyof PasswordFormData, { message: value[0] });
          toast.error(value[0]);
        });
      } else {
        toast.error(error.message || "An error occurred");
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
