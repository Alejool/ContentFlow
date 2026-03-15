import Button from "@/Components/common/Modern/Button";
import { cssPropertiesManager } from "@/Utils/CSSCustomPropertiesManager";
import { router, useForm } from "@inertiajs/react";
import axios from "axios";
import { Check, Crown, Lock, Palette } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface UpdateThemeFormProps {
  user: any;
  workspace?: any;
}

export default function UpdateThemeForm({
  user,
  workspace,
}: UpdateThemeFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { data, setData } = useForm({
    theme_color: user.theme_color || "orange",
  });

  const applyTheme = (color: string) => {
    setData("theme_color", color);
    cssPropertiesManager.applyPrimaryColor(color);
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
      const errorMessage = error.response?.data?.message || t("common.error");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const brandingColor = workspace?.white_label_primary_color;
  const planId = workspace?.plan?.toLowerCase() || "demo";
  const hasBrandingAccess = ["professional", "enterprise"].includes(planId);

  const colors = [
    { name: "orange", value: "orange", bg: "bg-warning-500" },
    { name: "blue", value: "blue", bg: "bg-blue-500" },
    { name: "purple", value: "purple", bg: "bg-purple-500" },
    { name: "green", value: "green", bg: "bg-green-500" },
    { name: "pink", value: "pink", bg: "bg-pink-500" },
  ];

  if (brandingColor && brandingColor.startsWith("#")) {
    colors.unshift({
      name: "custom",
      value: brandingColor,
      bg: "",
      isCustom: true,
    } as any);
  }

  return (
    <section className="space-y-8">
      {/* Personal theme colors — available to all */}
      <div className="space-y-4">
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
                  style={
                    (color as any).isCustom
                      ? { backgroundColor: color.value }
                      : {}
                  }
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
      </div>

      {/* Workspace branding — Professional+ only */}
      <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-neutral-800/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              Branding del Workspace
              {!hasBrandingAccess && (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  <Lock className="w-2.5 h-2.5" /> Professional+
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 dark:text-neutral-500 mt-0.5">
              Personaliza el logo y colores de tu workspace para tus clientes y
              equipo.
            </p>
          </div>
        </div>

        {hasBrandingAccess ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configura el logo y colores personalizados de tu workspace.
            </p>
            <Button
              type="button"
              onClick={() =>
                router.visit(route("workspace.settings", { tab: "branding" }))
              }
              icon={Palette}
              variant="outline"
            >
              Ir a Configuración de Branding
            </Button>
          </div>
        ) : (
          <div className="relative rounded-xl border border-amber-200 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-900/10 p-5 overflow-hidden">
            {/* Blurred mock */}
            <div className="flex gap-4 blur-sm select-none pointer-events-none opacity-60">
              {["#f97316", "#3b82f6", "#a855f7"].map((c) => (
                <div key={c} className="flex flex-col items-center gap-2">
                  <div
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: c }}
                  />
                  <span className="text-xs text-gray-500">Color</span>
                </div>
              ))}
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-gray-300" />
                </div>
                <span className="text-xs text-gray-500">Logo</span>
              </div>
            </div>
            {/* Lock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-[2px]">
              <Lock className="w-6 h-6 text-amber-500" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center px-4">
                Disponible en plan <strong>Professional</strong> o superior
              </p>
              <button
                type="button"
                onClick={() => router.visit("/pricing")}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Ver planes
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
