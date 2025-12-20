import { UserProfileFormData, userProfileSchema } from "@/schemas/user";
import { useUserStore } from "@/stores/userStore";
import { zodResolver } from "@hookform/resolvers/zod";
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
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: initialUser?.name || "",
      email: initialUser?.email || "",
      phone: initialUser?.phone || "",
      country_code: initialUser?.country_code || "",
      bio: initialUser?.bio || "",
      global_platform_settings: initialUser?.global_platform_settings || {},
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
        global_platform_settings: user.global_platform_settings || {},
      });
    }
  }, [user, reset]);

  useEffect(() => {
    if (user?.locale && user.locale !== i18n.language) {
      i18n.changeLanguage(user.locale);
    }
  }, [user?.locale, i18n]);

  useEffect(() => {
    if (!user) return;
    const changed =
      watchedValues.name !== user.name ||
      watchedValues.email !== user.email ||
      (watchedValues.phone || "") !== (user.phone || "") ||
      (watchedValues.country_code || "") !== (user.country_code || "") ||
      (watchedValues.bio || "") !== (user.bio || "") ||
      JSON.stringify(watchedValues.global_platform_settings || {}) !==
        JSON.stringify(user.global_platform_settings || {});
    setHasChanges(changed);
  }, [watchedValues, user]);

  const handleProfileUpdate = async (data: UserProfileFormData) => {
    try {
      const result = await updateProfile(data);
      if (result.success) {
        toast.success(result.message || t("profile.toast.updateSuccess"));
        setHasChanges(false);
      } else {
        toast.error(result.message || t("profile.toast.errorUpdating"));
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        Object.entries(serverErrors).forEach(([key, value]: [any, any]) => {
          toast.error(value[0]);
        });
      } else {
        toast.error(error.message || t("profile.toast.errorUpdating"));
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

  return {
    register,
    handleSubmit: handleSubmit(handleProfileUpdate),
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
