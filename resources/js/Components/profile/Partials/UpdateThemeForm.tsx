import Button from "@/Components/common/Modern/Button";
import { useForm } from "@inertiajs/react";
import axios from "axios";
import { Check, Palette } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface UpdateThemeFormProps {
  user: any;
}

export default function UpdateThemeForm({ user }: UpdateThemeFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { data, setData } = useForm({
    theme_color: user.theme_color || "orange",
  });

  const applyTheme = (color: string) => {
    setData("theme_color", color);
    document.documentElement.setAttribute("data-theme-color", color);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Usamos useForm state para 'processing' manual si es necesario,
    // pero useForm.patch está diseñado para Inertia redirects.
    // Para JSON puro, usamos axios.

    try {
      const response = await axios.patch(
        route("api.v1.profile.theme.update"),
        data,
      );

      if (response.data.success) {
        toast.success(
          t("profile.theme.success_message") || response.data.message,
        );
      } else {
        toast.error(response.data.message || t("common.error"));
      }
    } catch (error: any) {
      console.error("Theme update failed:", error);
      const errorMessage = error.response?.data?.message || t("common.error");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    { name: "orange", value: "orange", bg: "bg-warning-500" },
    { name: "blue", value: "blue", bg: "bg-blue-500" },
    { name: "purple", value: "purple", bg: "bg-purple-500" },
    { name: "green", value: "green", bg: "bg-green-500" },
    { name: "pink", value: "pink", bg: "bg-pink-500" },
  ];

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary-500" />
          {t("profile.theme.title") || "Apariencia del Sistema"}
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t("profile.theme.description") ||
            "Selecciona el color principal del sistema. Esto afectará a botones, enlaces y otros elementos destacados."}
        </p>
      </header>

      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {colors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => applyTheme(color.value)}
              className={`group relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${
                data.theme_color === color.value
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10"
                  : "border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-800"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full mb-3 shadow-sm ${color.bg} flex items-center justify-center text-white transition-transform group-hover:scale-110`}
              >
                {data.theme_color === color.value && (
                  <Check className="w-6 h-6" />
                )}
              </div>
              <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                {t(`colors.${color.name}`) || color.name}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            icon={Check}
          >
            {t("common.save")}
          </Button>
        </div>
      </form>
    </section>
  );
}
