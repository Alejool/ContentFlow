import Button from "@/Components/common/Modern/Button";
import { router, useForm } from "@inertiajs/react";
import axios from "axios";
import { Image as ImageIcon, Palette, ShieldCheck, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface WhiteLabelSettingsTabProps {
  workspace: any;
  canManageWorkspace: boolean;
}

export default function WhiteLabelSettingsTab({
  workspace,
  canManageWorkspace,
}: WhiteLabelSettingsTabProps) {
  const { t } = useTranslation();
  const [logoPreview, setLogoPreview] = useState<string | null>(
    workspace.white_label_logo_url || null,
  );
  const [faviconPreview, setFaviconPreview] = useState<string | null>(
    workspace.white_label_favicon_url || null,
  );

  const { data, setData, post, processing, errors } = useForm({
    logo: null as File | null,
    favicon: null as File | null,
    primary_color: workspace.white_label_primary_color || "#4f46e5",
  });

  useEffect(() => {
    setLogoPreview(workspace.white_label_logo_url || null);
    setFaviconPreview(workspace.white_label_favicon_url || null);
    setData("primary_color", workspace.white_label_primary_color || "#4f46e5");
  }, [workspace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageWorkspace) return;

    post(route("workspaces.white-label.update", workspace.slug), {
      onSuccess: async (page) => {
        toast.success(
          t("workspace.white_label.update_success") ||
            "Branding updated successfully",
        );

        const auth = page.props.auth as any;
        const currentWorkspace = auth?.current_workspace;

        // Update favicon immediately
        if (currentWorkspace?.white_label_favicon_url) {
          let link = document.querySelector(
            "link[rel~='icon']",
          ) as HTMLLinkElement;
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = `${currentWorkspace.white_label_favicon_url}?v=${new Date().getTime()}`;
        }

        // Update sidebar logo immediately
        if (currentWorkspace?.white_label_logo_url) {
          const logoImg = document.getElementById(
            "sidebar-logo",
          ) as HTMLImageElement;
          if (logoImg) {
            logoImg.src = currentWorkspace.white_label_logo_url;
          }
        }

        // Apply the branding color to the user's theme
        if (data.primary_color) {
          try {
            await axios.patch(route("api.v1.profile.theme.update"), {
              theme_color: data.primary_color,
            });
          } catch (error) {
            console.error("Error updating user theme:", error);
          }
        }

        router.reload(); // Still reload to sync everything else
      },
      onError: () => {
        toast.error(
          t("workspace.white_label.update_error") ||
            "Failed to update branding",
        );
      },
      forceFormData: true,
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData("logo", file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData("favicon", file);
      const reader = new FileReader();
      reader.onloadend = () => setFaviconPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Introduction */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-600 rounded-lg shadow-lg shadow-primary-500/20">
            <Palette className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("workspace.white_label.title") || "Branding Personalizado"}
            </h3>
            <p className="text-gray-500 dark:text-neutral-400">
              {t("workspace.white_label.description") ||
                "Define la identidad visual de tu plataforma."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-full">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
            Enterprise Exclusive
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Asset Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Logo Section */}
                <div className="space-y-4">
                  <div>
                    <label className="text-base font-bold text-gray-900 dark:text-white block">
                      {t("workspace.white_label.logo") || "Logotipo"}
                    </label>
                    <p className="text-sm text-gray-500 dark:text-neutral-500 mt-1">
                      {t("workspace.white_label.logo_help") ||
                        "Recomendado: PNG/SVG fondo transparente."}
                    </p>
                  </div>

                  <div className="relative group aspect-video bg-neutral-50 dark:bg-neutral-800/40 rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-300 flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="max-h-[70%] max-w-[70%] object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                        <span className="text-xs font-medium text-neutral-400">
                          {t("workspace.white_label.no_logo") || "Sin Logo"}
                        </span>
                      </div>
                    )}

                    {canManageWorkspace && (
                      <label className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png,image/gif"
                          onChange={handleLogoChange}
                        />
                        <div className="flex flex-col items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <Upload className="w-6 h-6 text-white" />
                          <span className="text-white text-sm font-bold">
                            {t("common.change", "Cambiar")}
                          </span>
                        </div>
                      </label>
                    )}
                  </div>
                  {errors.logo && (
                    <p className="text-sm text-red-500 font-medium">
                      {errors.logo}
                    </p>
                  )}
                </div>

                {/* Favicon Section */}
                <div className="space-y-4">
                  <div>
                    <label className="text-base font-bold text-gray-900 dark:text-white block">
                      {t("workspace.white_label.favicon") || "Favicon"}
                    </label>
                    <p className="text-sm text-gray-500 dark:text-neutral-500 mt-1">
                      {t("workspace.white_label.favicon_help") ||
                        "Formato 32x32px o 64x64px."}
                    </p>
                  </div>

                  <div className="relative group w-24 h-24 bg-neutral-50 dark:bg-neutral-800/40 rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-300 flex items-center justify-center overflow-hidden">
                    {faviconPreview ? (
                      <img
                        src={faviconPreview}
                        alt="Favicon"
                        className="w-12 h-12 object-contain drop-shadow-lg"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                    )}

                    {canManageWorkspace && (
                      <label className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png,image/gif"
                          onChange={handleFaviconChange}
                        />
                        <Upload className="w-5 h-5 text-white" />
                      </label>
                    )}
                  </div>
                  {errors.favicon && (
                    <p className="text-sm text-red-500 font-medium">
                      {errors.favicon}
                    </p>
                  )}
                </div>
              </div>

              <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

              {/* Color Selection */}
              <div className="space-y-6">
                <div>
                  <label className="text-base font-bold text-gray-900 dark:text-white block">
                    {t("workspace.white_label.primary_color") ||
                      "Color de Marca"}
                  </label>
                  <p className="text-sm text-gray-500 dark:text-neutral-500 mt-1">
                    {t("workspace.white_label.color_help") ||
                      "Este color se aplicará a botones, enlaces e indicadores."}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="color"
                      value={data.primary_color}
                      onChange={(e) => setData("primary_color", e.target.value)}
                      disabled={!canManageWorkspace}
                      className="h-14 w-14 rounded-lg border-0 overflow-hidden cursor-pointer shadow-lg p-0"
                    />
                  </div>
                  <div className="flex-1 max-w-xs relative">
                    <input
                      type="text"
                      value={data.primary_color}
                      onChange={(e) => setData("primary_color", e.target.value)}
                      disabled={!canManageWorkspace}
                      className="block w-full h-14 pl-10 pr-4 text-black dark:text-white rounded-lg bg-neutral-100 dark:bg-neutral-800 border-transparent focus:ring-2 focus:ring-primary-500 text-lg font-mono font-bold"
                      placeholder="#000000"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-lg">
                      #
                    </div>
                  </div>
                </div>
                {errors.primary_color && (
                  <p className="text-sm text-red-500 font-medium">
                    {errors.primary_color}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!canManageWorkspace}
                  loading={processing}
                  loadingText={t("common.saving") || "Guardando..."}
                  variant="primary"
                  size="lg"
                  rounded="2xl"
                  animation="scale"
                  className="w-full md:w-auto"
                >
                  {t("common.save_changes") || "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Live Preview Section */}
        <div className="space-y-6">
          <div className="sticky top-24">
            <h4 className="text-sm font-bold text-gray-500 dark:text-neutral-500 uppercase tracking-widest mb-4 ml-2">
              {t("workspace.white_label.live_preview") || "Vista Previa en Vivo"}
            </h4>

            <div className="space-y-6">
              {/* Button Preview */}
              <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <p className="text-xs font-bold text-gray-400 dark:text-neutral-500 mb-4">
                  {t("workspace.white_label.buttons_actions") || "BOTONES Y ACCIONES"}
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    className="w-full py-2.5 rounded-lg text-sm font-bold text-white shadow-lg transition-all"
                    style={{
                      backgroundColor: data.primary_color,
                      boxShadow: `0 10px 15px -3px ${data.primary_color}40`,
                    }}
                  >
                    {t("workspace.white_label.primary_button") || "Botón Principal"}
                  </button>
                  <button
                    className="w-full py-2.5 rounded-lg text-sm font-bold border transition-all"
                    style={{
                      borderColor: data.primary_color,
                      color: data.primary_color,
                    }}
                  >
                    {t("workspace.white_label.secondary_button") || "Botón Secundario"}
                  </button>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: data.primary_color }}
                    />
                    <span className="text-xs font-medium text-gray-500">
                      {t("workspace.white_label.activity_indicator") || "Indicador de actividad"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sidebar Header Preview */}
              <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden relative">
                <p className="text-xs font-bold text-gray-400 dark:text-neutral-500 mb-4 uppercase">
                  {t("workspace.white_label.sidebar_header") || "Cabecera del Menú"}
                </p>

                <div className="rounded-lg p-4 flex items-center gap-3 border dark:border-neutral-800 bg-neutral-50 dark:bg-black/20">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-neutral-800 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        className="max-h-[80%] max-w-[80%] object-contain"
                      />
                    ) : (
                      <span
                        className="text-lg font-bold text-white"
                        style={{ color: data.primary_color }}
                      >
                        {workspace.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate text-gray-900 dark:text-white">
                      {workspace.name}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-tighter opacity-60">
                      {t("workspace.white_label.workspace_branding") || "Workspace Branding"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Help Box */}
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-lg p-6">
                <div className="flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                  <p className="text-sm text-emerald-800 dark:text-emerald-400 leading-relaxed font-medium">
                    {t("workspace.white_label.impact_notice") || "Los cambios se aplican inmediatamente para todos los usuarios de este espacio de trabajo."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
