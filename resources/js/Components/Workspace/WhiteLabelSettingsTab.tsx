import Button from '@/Components/common/Modern/Button';
import ColorArea from '@/Components/common/Modern/ColorArea';
import { useS3Upload } from '@/Hooks/useS3Upload';
import { router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { Image as ImageIcon, Palette, ShieldCheck, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoTempId, setLogoTempId] = useState<string | null>(null);
  const [faviconTempId, setFaviconTempId] = useState<string | null>(null);

  const { uploadFile, uploading, progress, errors: uploadErrors } = useS3Upload();

  const { data, setData, post, processing, errors } = useForm({
    logo_key: null as string | null,
    favicon_key: null as string | null,
    primary_color: workspace.white_label_primary_color || '#4f46e5',
  });

  useEffect(() => {
    setLogoPreview(workspace.white_label_logo_url || null);
    setFaviconPreview(workspace.white_label_favicon_url || null);
    setData('primary_color', workspace.white_label_primary_color || '#4f46e5');
  }, [workspace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageWorkspace) return;

    // Verificar que no hay subidas en progreso
    const logoUploading =
      logoTempId && progress[logoTempId] !== undefined && progress[logoTempId] < 100;
    const faviconUploading =
      faviconTempId && progress[faviconTempId] !== undefined && progress[faviconTempId] < 100;

    if (logoUploading || faviconUploading) {
      toast.error('Por favor espera a que terminen de subirse las imágenes');
      return;
    }

    // Enviar el formulario con las claves S3 ya establecidas
    post(route('workspaces.white-label.update', workspace.slug), {
      onSuccess: async (page) => {
        toast.success(t('workspace.white_label.update_success') || 'Branding updated successfully');

        const auth = page.props.auth as any;
        const currentWorkspace = auth?.current_workspace;

        // Update favicon immediately
        if (currentWorkspace?.white_label_favicon_url) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = `${currentWorkspace.white_label_favicon_url}?v=${new Date().getTime()}`;
        }

        // Update sidebar logo immediately
        if (currentWorkspace?.white_label_logo_url) {
          const logoImg = document.getElementById('sidebar-logo') as HTMLImageElement;
          if (logoImg) {
            logoImg.src = currentWorkspace.white_label_logo_url;
          }
        }

        // Apply the branding color to the user's theme
        if (data.primary_color) {
          try {
            await axios.patch(route('api.v1.profile.theme.update'), {
              theme_color: data.primary_color,
            });
          } catch (error) {
            console.error('Error updating user theme:', error);
          }
        }

        // Reset file states
        setLogoFile(null);
        setFaviconFile(null);
        setLogoTempId(null);
        setFaviconTempId(null);

        router.reload(); // Still reload to sync everything else
      },
      onError: () => {
        toast.error(t('workspace.white_label.update_error') || 'Failed to update branding');
      },
      forceFormData: true,
    });
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const tempId = `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setLogoFile(file);
      setLogoTempId(tempId);

      // Mostrar preview inmediatamente
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);

      // Iniciar subida inmediatamente
      try {
        const result = await uploadFile(file, tempId);
        if (result?.key) {
          setData('logo_key', result.key);
          toast.success('Logo subido correctamente');
        }
      } catch (error) {
        console.error('Error uploading logo:', error);
        toast.error('Error al subir el logo');
      }
    }
  };

  const handleFaviconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const tempId = `favicon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setFaviconFile(file);
      setFaviconTempId(tempId);

      // Mostrar preview inmediatamente
      const reader = new FileReader();
      reader.onloadend = () => setFaviconPreview(reader.result as string);
      reader.readAsDataURL(file);

      // Iniciar subida inmediatamente
      try {
        const result = await uploadFile(file, tempId);
        if (result?.key) {
          setData('favicon_key', result.key);
          toast.success('Favicon subido correctamente');
        }
      } catch (error) {
        console.error('Error uploading favicon:', error);
        toast.error('Error al subir el favicon');
      }
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* Introduction */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary-600 p-3 shadow-lg shadow-primary-500/20">
            <Palette className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('workspace.white_label.title') || 'Branding Personalizado'}
            </h3>
            <p className="text-gray-500 dark:text-neutral-400">
              {t('workspace.white_label.description') ||
                'Define la identidad visual de tu plataforma.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 dark:border-blue-800/30 dark:bg-blue-900/20">
          <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
            Enterprise Exclusive
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Form Section */}
        <div className="space-y-8 xl:col-span-2">
          <div className="rounded-lg border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Asset Grid */}
              <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                {/* Logo Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-base font-bold text-gray-900 dark:text-white">
                      {t('workspace.white_label.logo') || 'Logotipo'}
                    </label>
                    <p className="mt-1 text-sm text-gray-500 dark:text-neutral-500">
                      {t('workspace.white_label.logo_help') ||
                        'Recomendado: PNG/SVG fondo transparente.'}
                    </p>
                  </div>

                  <div className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 transition-all duration-300 hover:border-primary-500 dark:border-neutral-700 dark:bg-neutral-800/40 dark:hover:border-primary-500">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo"
                        loading="lazy"
                        className="max-h-[70%] max-w-[70%] object-contain drop-shadow-xl transition-all duration-500 group-hover:scale-105"
                        onError={(e) => {
                          // Si falla, mostrar el icono por defecto
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'text-center';
                            fallback.innerHTML = `
                              <svg class="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              <span class="text-xs font-medium text-neutral-400">Error al cargar</span>
                            `;
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="mx-auto mb-2 h-12 w-12 text-neutral-300 dark:text-neutral-600" />
                        <span className="text-xs font-medium text-neutral-400">
                          {t('workspace.white_label.no_logo') || 'Sin Logo'}
                        </span>
                      </div>
                    )}

                    {/* Upload Success Overlay */}
                    {logoTempId && progress[logoTempId] === 100 && (
                      <div className="absolute right-2 top-2 rounded-full bg-green-500 p-1 text-white">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Upload Progress Overlay */}
                    {logoTempId &&
                      progress[logoTempId] !== undefined &&
                      progress[logoTempId] < 100 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                          <div className="text-center text-white">
                            <div className="mx-auto mb-2 h-16 w-16 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
                            <div className="text-sm font-medium">{progress[logoTempId]}%</div>
                            <div className="text-xs opacity-75">Subiendo logo...</div>
                          </div>
                        </div>
                      )}

                    {/* Upload Error Overlay */}
                    {logoTempId && uploadErrors[logoTempId] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-500/80 backdrop-blur-sm">
                        <div className="p-4 text-center text-white">
                          <div className="mb-1 text-sm font-medium">Error de subida</div>
                          <div className="text-xs opacity-90">{uploadErrors[logoTempId]}</div>
                        </div>
                      </div>
                    )}

                    {canManageWorkspace && (
                      <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/60 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png,image/gif"
                          onChange={handleLogoChange}
                          disabled={uploading}
                        />
                        <div className="flex translate-y-4 transform flex-col items-center gap-2 transition-transform duration-300 group-hover:translate-y-0">
                          <Upload className="h-6 w-6 text-white" />
                          <span className="text-sm font-bold text-white">
                            {t('common.change', 'Cambiar')}
                          </span>
                        </div>
                      </label>
                    )}
                  </div>
                  {errors.logo_key && (
                    <p className="text-sm font-medium text-red-500">{errors.logo_key}</p>
                  )}
                  {logoTempId && uploadErrors[logoTempId] && (
                    <p className="text-sm font-medium text-red-500">{uploadErrors[logoTempId]}</p>
                  )}
                </div>

                {/* Favicon Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-base font-bold text-gray-900 dark:text-white">
                      {t('workspace.white_label.favicon') || 'Favicon'}
                    </label>
                    <p className="mt-1 text-sm text-gray-500 dark:text-neutral-500">
                      {t('workspace.white_label.favicon_help') || 'Formato 32x32px o 64x64px.'}
                    </p>
                  </div>

                  <div className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 transition-all duration-300 hover:border-primary-500 dark:border-neutral-700 dark:bg-neutral-800/40 dark:hover:border-primary-500">
                    {faviconPreview ? (
                      <img
                        src={faviconPreview}
                        alt="Favicon"
                        className="h-12 w-12 object-contain drop-shadow-lg"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                    )}

                    {/* Upload Success Overlay */}
                    {faviconTempId && progress[faviconTempId] === 100 && (
                      <div className="absolute right-1 top-1 rounded-full bg-green-500 p-1 text-white">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Upload Progress Overlay */}
                    {faviconTempId &&
                      progress[faviconTempId] !== undefined &&
                      progress[faviconTempId] < 100 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                          <div className="text-center text-white">
                            <div className="mx-auto mb-1 h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                            <div className="text-xs font-medium">{progress[faviconTempId]}%</div>
                          </div>
                        </div>
                      )}

                    {/* Upload Error Overlay */}
                    {faviconTempId && uploadErrors[faviconTempId] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-500/80 backdrop-blur-sm">
                        <div className="p-2 text-center text-white">
                          <div className="text-xs font-medium">Error</div>
                        </div>
                      </div>
                    )}

                    {canManageWorkspace && (
                      <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/60 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png,image/gif"
                          onChange={handleFaviconChange}
                          disabled={uploading}
                        />
                        <Upload className="h-5 w-5 text-white" />
                      </label>
                    )}
                  </div>
                  {errors.favicon_key && (
                    <p className="text-sm font-medium text-red-500">{errors.favicon_key}</p>
                  )}
                  {faviconTempId && uploadErrors[faviconTempId] && (
                    <p className="text-sm font-medium text-red-500">
                      {uploadErrors[faviconTempId]}
                    </p>
                  )}
                </div>
              </div>

              <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

              {/* Color Selection */}
              <ColorArea
                id="primary-color"
                label={t('workspace.white_label.primary_color') || 'Color de Marca'}
                hint={
                  t('workspace.white_label.color_help') ||
                  'Este color se aplicará a botones, enlaces e indicadores.'
                }
                value={data.primary_color}
                onChange={(color) => setData('primary_color', color)}
                disabled={!canManageWorkspace}
                error={errors.primary_color}
                showHexInput={true}
                showSliders={true}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!canManageWorkspace || uploading}
                  loading={processing || uploading}
                  loadingText={
                    uploading ? 'Subiendo archivos...' : t('common.saving') || 'Guardando...'
                  }
                  variant="primary"
                  size="lg"
                  rounded="2xl"
                  animation="scale"
                  className="w-full md:w-auto"
                >
                  {t('common.save_changes') || 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Live Preview Section */}
        <div className="space-y-6">
          <div className="sticky top-24">
            <h4 className="mb-4 ml-2 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
              {t('workspace.white_label.live_preview') || 'Vista Previa en Vivo'}
            </h4>

            <div className="space-y-6">
              {/* Button Preview */}
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <p className="mb-4 text-xs font-bold text-gray-400 dark:text-neutral-500">
                  {t('workspace.white_label.buttons_actions') || 'BOTONES Y ACCIONES'}
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    className="w-full rounded-lg py-2.5 text-sm font-bold text-white shadow-lg transition-all"
                    style={{
                      backgroundColor: data.primary_color,
                      boxShadow: `0 10px 15px -3px ${data.primary_color}40`,
                    }}
                  >
                    {t('workspace.white_label.primary_button') || 'Botón Principal'}
                  </button>
                  <button
                    className="w-full rounded-lg border py-2.5 text-sm font-bold transition-all"
                    style={{
                      borderColor: data.primary_color,
                      color: data.primary_color,
                    }}
                  >
                    {t('workspace.white_label.secondary_button') || 'Botón Secundario'}
                  </button>
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className="h-2 w-2 animate-pulse rounded-full"
                      style={{ backgroundColor: data.primary_color }}
                    />
                    <span className="text-xs font-medium text-gray-500">
                      {t('workspace.white_label.activity_indicator') || 'Indicador de actividad'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sidebar Header Preview */}
              <div className="relative overflow-hidden rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <p className="mb-4 text-xs font-bold uppercase text-gray-400 dark:text-neutral-500">
                  {t('workspace.white_label.sidebar_header') || 'Cabecera del Menú'}
                </p>

                <div className="flex items-center gap-3 rounded-lg border bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-black/20">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm dark:bg-neutral-800">
                    {logoPreview ? (
                      <img src={logoPreview} className="max-h-[80%] max-w-[80%] object-contain" />
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
                    <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                      {workspace.name}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-tighter opacity-60">
                      {t('workspace.white_label.workspace_branding') || 'Workspace Branding'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Help Box */}
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-6 dark:border-emerald-900/20 dark:bg-emerald-900/10">
                <div className="flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                  <p className="text-sm font-medium leading-relaxed text-emerald-800 dark:text-emerald-400">
                    {t('workspace.white_label.impact_notice') ||
                      'Los cambios se aplican inmediatamente para todos los usuarios de este espacio de trabajo.'}
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
