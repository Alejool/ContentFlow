import { useState } from "react";
import { Upload, X } from "lucide-react";
import Button from "@/Components/common/Modern/Button";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { toast } from "react-hot-toast";

interface AvatarSettingsProps {
  user: {
    name: string;
    photo_url?: string | null;
  };
}

export default function AvatarSettings({ user }: AvatarSettingsProps) {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.photo_url || null);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("profile.avatar_too_large", "La imagen es muy grande. Máximo 2MB"));
      return;
    }

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast.error(t("profile.invalid_file_type", "Solo se permiten archivos de imagen"));
      return;
    }

    setProcessing(true);

    try {
      // Mostrar preview local inmediatamente
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Subir archivo usando FormData
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('name', user.name);

      const response = await axios.post("/api/v1/profile/avatar", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const updatedUser = response.data.user;
        setPreviewUrl(updatedUser.photo_url || null);
        
        toast.success(
          t("profile.avatar_uploaded", "Foto subida correctamente")
        );

        // Recargar para actualizar en toda la app
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error(response.data.message || t("profile.avatar_update_failed", "Error al subir la foto"));
        setPreviewUrl(user.photo_url || null);
      }
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      const errorMessage = error.response?.data?.message || 
        t("profile.avatar_upload_error", "Ocurrió un error al subir la foto");
      toast.error(errorMessage);
      setPreviewUrl(user.photo_url || null);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (processing) return;
    
    setProcessing(true);
    setPreviewUrl(null);

    try {
      const response = await axios.delete("/api/v1/profile/avatar");

      if (response.data.success) {
        setPreviewUrl(null);
        
        toast.success(
          t("profile.avatar_removed", "Avatar eliminado correctamente")
        );

        // Recargar para actualizar en toda la app
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error(response.data.message || t("profile.avatar_remove_failed", "Error al eliminar el avatar"));
        setPreviewUrl(user.photo_url || null);
      }
    } catch (error: any) {
      console.error("Error removing avatar:", error);
      const errorMessage = error.response?.data?.message || 
        t("profile.avatar_remove_error", "Ocurrió un error al eliminar el avatar");
      toast.error(errorMessage);
      setPreviewUrl(user.photo_url || null);
    } finally {
      setProcessing(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name.trim()) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t("profile.avatar_settings", "Foto de Perfil")}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t(
            "profile.avatar_description",
            "Sube una foto para personalizar tu perfil"
          )}
        </p>
      </div>

      <div className="space-y-6">
        {/* Vista previa del avatar */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getInitials(user.name)}</span>
              )}
            </div>
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              {t("profile.current_avatar", "Avatar Actual")}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {previewUrl
                ? t("profile.using_photo", "Usando foto personalizada")
                : t("profile.using_initials", "Usando iniciales")}
            </p>
            {processing && (
              <div className="text-xs text-primary-600 dark:text-primary-400 mt-1 font-medium flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                {t("profile.uploading", "Subiendo...")}
              </div>
            )}
          </div>
        </div>

        {/* Subir foto */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            {t("profile.upload_photo", "Subir Foto")}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="avatar-upload"
              disabled={processing}
            />
            <label
              htmlFor="avatar-upload"
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all duration-200 bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                processing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <Upload size={14} />
              {processing ? t("profile.uploading", "Subiendo...") : t("profile.choose_file", "Elegir Archivo")}
            </label>
            {previewUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={X}
                onClick={handleRemovePhoto}
                disabled={processing}
              >
                {t("profile.remove_photo", "Eliminar Foto")}
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("profile.avatar_requirements", "Máximo 2MB. Formatos: JPG, PNG, GIF")}
          </p>
        </div>
      </div>
    </div>
  );
}
