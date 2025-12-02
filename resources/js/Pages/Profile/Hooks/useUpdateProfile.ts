import {
  useForm as useHookForm,
  UseFormRegister,
  UseFormHandleSubmit,
  FieldErrors,
  UseFormSetError,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema } from "@/schemas/schemas";
import { toast } from "react-hot-toast";
import { usePage } from "@inertiajs/react";
import axios, { AxiosError } from "axios";
import { z } from "zod";

// Types
type ProfileFormData = z.infer<typeof profileSchema>;

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
}

interface PageProps {
  auth: {
    user: User;
  };
}

interface ApiResponse {
  success?: boolean;
  warning?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

interface ApiError {
  response?: {
    data?: ApiResponse;
  };
}

interface UpdateProfileResult {
  success?: boolean;
  warning?: boolean;
  error?: boolean;
}

interface UseUpdateProfileReturn {
  register: UseFormRegister<ProfileFormData>;
  handleSubmit: UseFormHandleSubmit<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
  isSubmitting: boolean;
  watchedName: string;
  watchedEmail: string;
  updateProfile: (data: ProfileFormData) => Promise<UpdateProfileResult>;
  user: User;
}

// Declare global route function
declare global {
  function route(name: string): string;
}

export const useUpdateProfile = (): UseUpdateProfileReturn => {
  const { props } = usePage<PageProps>();
  const user = props.auth.user;

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useHookForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  const watchedName = watch("name");
  const watchedEmail = watch("email");

  const updateProfile = async (
    data: ProfileFormData
  ): Promise<UpdateProfileResult> => {
    try {
      const response = await axios.patch<ApiResponse>(
        route("profile.update"),
        data
      );

      if (response.data.success) {
        toast.success(response.data.message || "Profile updated successfully");
        return { success: true };
      } else if (response.data.warning) {
        toast(response.data.message || "No changes were made", { icon: "⚠️" });
        return { warning: true };
      } else {
        toast.error(
          response.data.message || "An error occurred while updating profile"
        );
        return { error: true };
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;

      if (axiosError.response?.data?.errors) {
        Object.entries(axiosError.response.data.errors).forEach(
          ([key, value]) => {
            setError(key as keyof ProfileFormData, { message: value[0] });
            toast.error(value[0]);
          }
        );
      } else {
        toast.error(
          axiosError.response?.data?.message ||
            "An error occurred while updating profile"
        );
      }
      return { error: true };
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    watchedName,
    watchedEmail,
    updateProfile,
    user,
  };
};
