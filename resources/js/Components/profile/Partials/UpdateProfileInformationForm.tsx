import Button from "@/Components/common/Modern/Button";
import ModernCard from "@/Components/common/Modern/Card";
import Input from "@/Components/common/Modern/Input";
import LanguageSwitcher from "@/Components/common/ui/LanguageSwitcher";
import { useTheme } from "@/Hooks/useTheme";
import { ProfileFormData, profileSchema } from "@/schemas/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, usePage } from "@inertiajs/react";
import axios from "axios";
import {
  AlertTriangle,
  CheckCircle,
  Globe,
  Mail,
  MailWarning,
  Save,
  Send,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm as useHookForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface UpdateProfileInformationProps {
  mustVerifyEmail: boolean;
  status: string | null;
  className?: string;
}

interface AuthUser {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
}

interface PageProps {
  auth: {
    user: AuthUser;
  };
}

interface ApiResponse {
  success?: boolean;
  warning?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export default function UpdateProfileInformation({
  mustVerifyEmail,
  status,
  className = "",
}: UpdateProfileInformationProps) {
  const page = usePage<PageProps>();
  const user = page.props.auth.user;
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  // Estado para manejar cambios manualmente
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [initialData, setInitialData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [hasChanges, setHasChanges] = useState(false);

  const {
    handleSubmit,
    setError,
    register,
    formState: { errors, isSubmitting },
  } = useHookForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
  });

  // Actualizar formData cuando cambia el usuario
  useEffect(() => {
    if (user) {
      const newData = {
        name: user.name,
        email: user.email,
      };
      setFormData(newData);
      setInitialData(newData);
      setHasChanges(false);
    }
  }, [user]);

  // Verificar cambios cuando formData cambia
  useEffect(() => {
    const changes =
      formData.name !== initialData.name ||
      formData.email !== initialData.email;
    setHasChanges(changes);
  }, [formData, initialData]);

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const submit: SubmitHandler<ProfileFormData> = async () => {
    try {
      const response = await axios.patch<ApiResponse>(
        route("profile.update"),
        formData
      );

      if (response.data.success) {
        toast.success(
          response.data.message || t("profile.toast.updateSuccess")
        );
        // Actualizar datos iniciales después de guardar
        setInitialData(formData);
        setHasChanges(false);
      } else if (response.data.warning) {
        toast(response.data.message || t("profile.toast.noChanges"), {
          icon: "⚠️",
          style: {
            background: theme === "dark" ? "#374151" : "#f3f4f6",
            color: theme === "dark" ? "#f9fafb" : "#374151",
          },
        });
      } else {
        toast.error(response.data.message || t("profile.toast.errorUpdating"));
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.errors) {
        const errorData = error.response.data as ApiResponse;
        if (errorData.errors) {
          Object.entries(errorData.errors).forEach(([key, value]) => {
            // Mostrar errores en toast
            toast.error(value[0]);
          });
        }
      } else {
        toast.error(
          (error as any).response?.data?.message ||
            t("profile.toast.errorUpdating")
        );
      }
    }
  };

  const handleLanguageChange = async (lang: string) => {
    try {
      setIsChangingLanguage(true);
      await i18n.changeLanguage(lang);
      localStorage.setItem("i18nextLng", lang);
      toast.success(t("profile.toast.languageChanged"));
    } catch (error) {
      toast.error(t("profile.toast.languageChangeError"));
    } finally {
      setIsChangingLanguage(false);
    }
  };

  return (
    <ModernCard
      title={t("profile.information.title")}
      description={t("profile.information.description")}
      icon={UserIcon}
      headerColor="green"
      className={className}
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-6">
        {/* Campo Nombre - CONTROLADO MANUALMENTE */}
        <Input
          id="name"
          label={t("profile.information.nameLabel")}
          value={formData.name}
          onChange={handleInputChange("name")}
          placeholder={t("profile.information.namePlaceholder")}
          theme={theme}
          register={register}
          error={errors.name?.message}
          sizeType="lg"
          variant="filled"
          icon={UserIcon}
          required
        />

        {/* Campo Email - CONTROLADO MANUALMENTE */}
        <div className="relative">
          <Input
            id="email"
            label={t("profile.information.emailLabel")}
            type="email"
            register={register}
            error={errors.email?.message}
            value={formData.email}
            onChange={handleInputChange("email")}
            placeholder={t("profile.information.emailPlaceholder")}
            containerClassName="flex-1"
            theme={theme}
            sizeType="lg"
            variant="filled"
            icon={Mail}
            required
          />

          {user.email_verified_at && (
            <div
              className={`absolute right-0 top-6 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium
                ${
                  theme === "dark"
                    ? "bg-green-900/30 text-green-300 border border-green-800/50"
                    : "bg-green-100 text-green-800 border border-green-200"
                }`}
            >
              <CheckCircle className="w-3 h-3" />
              {t("profile.statistics.verified")}
            </div>
          )}
        </div>

        {mustVerifyEmail && user.email_verified_at === null && (
          <div
            className={`rounded-lg p-4 space-y-3 transition-colors duration-300
              ${
                theme === "dark"
                  ? "bg-yellow-900/20 border border-yellow-800/30"
                  : "bg-yellow-50 border border-yellow-200"
              }`}
          >
            <div
              className={`flex items-center gap-2 font-medium
                ${theme === "dark" ? "text-yellow-300" : "text-yellow-800"}`}
            >
              <MailWarning className="w-5 h-5" />
              <span>
                {t("profile.statistics.emailStatus")}:{" "}
                {t("profile.statistics.unverified")}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <p
                className={`text-sm flex-1
                  ${
                    theme === "dark" ? "text-yellow-400/80" : "text-yellow-700"
                  }`}
              >
                {t("profile.information.emailUnverified")}
              </p>
              <Link
                href={route("verification.send")}
                method="post"
                as="button"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-sm
                  ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-yellow-700/30 to-yellow-800/30 text-yellow-300 border border-yellow-700/30 hover:from-yellow-700/40 hover:to-yellow-800/40 hover:border-yellow-600/50"
                      : "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300 hover:from-yellow-200 hover:to-yellow-300"
                  }`}
              >
                <Send className="w-4 h-4" />
                {t("profile.information.sendVerification")}
              </Link>
            </div>

            {status === "verification-link-sent" && (
              <div
                className={`mt-2 text-sm font-medium flex items-center gap-2 p-3 rounded-lg
                  ${
                    theme === "dark"
                      ? "bg-green-900/20 text-green-300 border border-green-800/30"
                      : "bg-green-50 text-green-700 border border-green-200"
                  }`}
              >
                <CheckCircle className="w-4 h-4" />
                {t("profile.information.verificationSent")}
              </div>
            )}
          </div>
        )}

        <div
          className={`border-t pt-6 transition-colors duration-300
            ${theme === "dark" ? "border-neutral-700/50" : "border-gray-200"}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe
              className={`w-5 h-5 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            />
            <h3
              className={`text-lg font-medium ${
                theme === "dark" ? "text-gray-200" : "text-gray-900"
              }`}
            >
              {t("profile.information.applicationLanguage")}
            </h3>
          </div>

          <div
            className={`p-4 rounded-lg border transition-colors duration-300
              ${
                theme === "dark"
                  ? "bg-neutral-800/30 border-neutral-700/50"
                  : "bg-gray-50 border-gray-200"
              }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div
                className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {t("profile.information.languageDescription")}
              </div>

              <div className="flex-shrink-0">
                <div className="flex items-center gap-2">
                  {isChangingLanguage ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      {t("common.changing")}
                    </div>
                  ) : (
                    <LanguageSwitcher />
                  )}
                </div>
              </div>
            </div>

            <div
              className={`mt-3 text-xs ${
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {t("profile.information.currentLanguage")}:{" "}
              {i18n.language === "en" ? "English" : "Español"}
            </div>
          </div>
        </div>

        {/* Botón de guardar - AHORA FUNCIONARÁ CORRECTAMENTE */}
        <div
          className={`flex items-center justify-end gap-4 pt-4 border-t transition-colors duration-300
            ${theme === "dark" ? "border-neutral-700/50" : "border-gray-200"}`}
        >
          <Button
            disabled={isSubmitting || !hasChanges}
            icon={Save}
            theme={theme}
            loading={isSubmitting}
            loadingText={t("common.saving")}
            className={`min-w-[140px] transition-all duration-300 ${
              !hasChanges
                ? "opacity-50 cursor-not-allowed"
                : "hover:scale-[1.02]"
            }`}
            type="submit"
            size="lg"
          >
            {t("profile.actions.saveChanges")}
          </Button>
        </div>

        {/* Mensaje de cambios no guardados */}
        {hasChanges && !isSubmitting && (
          <div className="space-y-2">
            <div
              className={`flex items-center gap-2 text-sm p-3 rounded-lg
                ${
                  theme === "dark"
                    ? "bg-yellow-900/10 text-yellow-400 border border-yellow-800/20"
                    : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                }`}
            >
              <AlertTriangle className="w-4 h-4" />
              {t("profile.messages.unsavedChanges")}
            </div>
          </div>
        )}
      </form>
    </ModernCard>
  );
}
