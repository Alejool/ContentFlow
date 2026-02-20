import { UserProfileFormData, userProfileSchema } from "@/schemas/user";
import { useUserStore } from "@/stores/userStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "@inertiajs/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useForm as useHookForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

export const useUser = (initialUser: any) => {
  const { t, i18n } = useTranslation();
  const { user, setUser, updateProfile, isLoading } = useUserStore();
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    control,
  } = useHookForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema(t)),
    defaultValues: {
      name: initialUser?.name || "",
      email: initialUser?.email || "",
      phone: initialUser?.phone || "",
      country_code: initialUser?.country_code || "",
      bio: initialUser?.bio || "",
      global_platform_settings: initialUser?.global_platform_settings || {},
      ai_settings: initialUser?.ai_settings || {},
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    if (initialUser && !user) {
      setUser(initialUser);
    }
  }, [initialUser, setUser, user]);

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        country_code: user.country_code || "",
        bio: user.bio || "",
        global_platform_settings:
          Array.isArray(user.global_platform_settings) &&
          user.global_platform_settings.length === 0
            ? {}
            : user.global_platform_settings || {},
        ai_settings:
          Array.isArray(user.ai_settings) && user.ai_settings.length === 0
            ? {}
            : user.ai_settings || {},
      });
    }
  }, [user, reset]);

  useEffect(() => {
    if (user?.locale && user.locale !== i18n.language) {
      i18n.changeLanguage(user.locale);
    }
  }, [user?.locale]);

  useEffect(() => {
    if (!user) return;
    const normalizedWatched = {
      ...watchedValues,
      phone: watchedValues.phone || "",
      country_code: watchedValues.country_code || "",
      bio: watchedValues.bio || "",
      global_platform_settings: watchedValues.global_platform_settings || {},
      ai_settings: watchedValues.ai_settings || {},
    };

    const normalizedUser = {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      country_code: user.country_code || "",
      bio: user.bio || "",
      global_platform_settings: user.global_platform_settings || {},
      ai_settings: user.ai_settings || {},
    };

    const changed =
      normalizedWatched.name !== normalizedUser.name ||
      normalizedWatched.email !== normalizedUser.email ||
      normalizedWatched.phone !== normalizedUser.phone ||
      normalizedWatched.country_code !== normalizedUser.country_code ||
      normalizedWatched.bio !== normalizedUser.bio ||
      JSON.stringify(normalizedWatched.global_platform_settings) !==
        JSON.stringify(normalizedUser.global_platform_settings) ||
      JSON.stringify(normalizedWatched.ai_settings) !==
        JSON.stringify(normalizedUser.ai_settings);

    setHasChanges(changed);
  }, [watchedValues, user]);

  const handleProfileUpdate = async (data: UserProfileFormData) => {
    try {
      const result = await updateProfile(data);
      if (result.success) {
        toast.success(result.message || t("profile.update_success"));
        setHasChanges(false);

        // Reload fresh user data from server to keep Inertia props in sync
        router.reload({ only: ["auth"] });

        // Force form to reset with the latest data from the store
        // This ensures the UI reflects what was actually saved
        setTimeout(() => {
          const latestUser = useUserStore.getState().user;
          if (latestUser) {
            reset({
              name: latestUser.name || "",
              email: latestUser.email || "",
              phone: latestUser.phone || "",
              country_code: latestUser.country_code || "",
              bio: latestUser.bio || "",
              global_platform_settings:
                latestUser.global_platform_settings || {},
              ai_settings: latestUser.ai_settings || {},
            });
          }
        }, 100);
      } else {
        toast.error(result.message || t("profile.update_error"));
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        Object.entries(serverErrors).forEach(([key, value]: [any, any]) => {
          toast.error(value[0]);
        });
      } else {
        toast.error(error.message || t("profile.update_error"));
      }
    }
  };

  const handleLanguageChange = async (lang: string) => {
    try {
      setIsChangingLanguage(true);
      await i18n.changeLanguage(lang);
      localStorage.setItem("i18nextLng", lang);
      // Optional: Update user preference in backend via store
      await updateProfile({ locale: lang });
      toast.success(t("profile.toast.languageChanged"));
    } catch (error) {
      toast.error(t("profile.toast.languageChangeError"));
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const onInvalid = (errors: any) => {
    toast.error(
      t("validation.check_errors") ||
        "Por favor, revisa los errores en el formulario",
    );

    // Toast specific high-level errors if they exist
    if (errors.ai_settings) {
      toast.error("Error en la configuración de IA");
    }
  };

  return {
    register,
    handleSubmit: (e?: React.BaseSyntheticEvent) => {
      return handleSubmit(handleProfileUpdate, onInvalid)(e);
    },
    errors,
    isSubmitting: isSubmitting || isLoading,
    hasChanges,
    isChangingLanguage,
    handleLanguageChange,
    user: user || initialUser,
    watchedValues,
    setValue,
    control,
  };
};
