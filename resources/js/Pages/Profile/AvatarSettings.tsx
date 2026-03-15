import Button from '@/Components/common/Modern/Button';
import axios from 'axios';
import { Upload, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface AvatarSettingsProps {
  user: {
    name: string;
    photo_url?: string | null;
  };
}

export default function AvatarSettings({ user }: AvatarSettingsProps) {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user.photo_url && user.photo_url.trim() !== '' ? user.photo_url : null,
  );
  const [processing, setProcessing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('profile.avatar_too_large', 'La imagen es muy grande. Máximo 2MB'));
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.invalid_file_type', 'Solo se permiten archivos de imagen'));
      return;
    }

    setProcessing(true);
    setImageError(false);

    try {
      // Mostrar preview local inmediatamente
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setImageLoaded(false); // Reset para mostrar loader
      };
      reader.readAsDataURL(file);

      // Subir archivo usando FormData
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('name', user.name);

      const response = await axios.post('/api/v1/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const updatedUser = response.data.user;
        const newPhotoUrl =
          updatedUser.photo_url && updatedUser.photo_url.trim() !== ''
            ? updatedUser.photo_url
            : null;
        setPreviewUrl(newPhotoUrl);
        setImageError(false);

        toast.success(t('profile.avatar_uploaded', 'Foto subida correctamente'));

        // Recargar para actualizar en toda la app
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error(
          response.data.message || t('profile.avatar_update_failed', 'Error al subir la foto'),
        );
        setPreviewUrl(user.photo_url || null);
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      const errorMessage =
        error.response?.data?.message ||
        t('profile.avatar_upload_error', 'Ocurrió un error al subir la foto');
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
    setImageError(false);

    try {
      const response = await axios.delete('/api/v1/profile/avatar');

      if (response.data.success) {
        setPreviewUrl(null);

        toast.success(t('profile.avatar_removed', 'Avatar eliminado correctamente'));

        // Recargar para actualizar en toda la app
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error(
          response.data.message || t('profile.avatar_remove_failed', 'Error al eliminar el avatar'),
        );
        setPreviewUrl(user.photo_url || null);
      }
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      const errorMessage =
        error.response?.data?.message ||
        t('profile.avatar_remove_error', 'Ocurrió un error al eliminar el avatar');
      toast.error(errorMessage);
      setPreviewUrl(user.photo_url || null);
    } finally {
      setProcessing(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name.trim()) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Vista previa del avatar */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-3xl font-bold text-white shadow-xl ring-4 ring-primary-100 dark:ring-primary-900/30">
            {previewUrl && !imageError ? (
              <>
                {/* Loader mientras carga la imagen */}
                {!imageLoaded && (
                  <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600">
                    <div className="border-3 h-10 w-10 animate-spin rounded-full border-white/30 border-t-white"></div>
                  </div>
                )}

                <img
                  src={previewUrl}
                  alt={user.name}
                  loading="lazy"
                  className={`h-full w-full object-cover transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    setImageError(true);
                    setPreviewUrl(null);
                    setImageLoaded(false);
                  }}
                />
              </>
            ) : (
              <span>{getInitials(user.name)}</span>
            )}
          </div>
          {processing && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {previewUrl
              ? t('profile.using_photo', 'Usando foto personalizada')
              : t('profile.using_initials', 'Usando iniciales')}
          </p>
          {processing && (
            <div className="mt-1 flex items-center justify-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              {t('profile.uploading', 'Subiendo...')}
            </div>
          )}
        </div>
      </div>

      {/* Controles de subida */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handleFileChange}
            className="hidden"
            id="avatar-upload"
            disabled={processing}
          />
          <label
            htmlFor="avatar-upload"
            className={`inline-flex items-center justify-center gap-2 rounded-lg border-2 border-primary-600 bg-transparent px-4 py-2.5 text-sm font-medium text-primary-600 transition-all duration-200 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:hover:bg-primary-900/20 ${
              processing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
          >
            <Upload size={16} />
            {processing
              ? t('profile.uploading', 'Subiendo...')
              : t('profile.choose_file', 'Elegir Archivo')}
          </label>
          {previewUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={X}
              onClick={handleRemovePhoto}
              disabled={processing}
              className="w-full"
            >
              {t('profile.remove_photo', 'Eliminar Foto')}
            </Button>
          )}
        </div>
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          {t('profile.avatar_requirements', 'Máximo 2MB. Formatos: JPG, PNG, GIF')}
        </p>
      </div>
    </div>
  );
}
