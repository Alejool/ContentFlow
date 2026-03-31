import { CarouselDots, CarouselPagination } from '@/Components/common/CarouselPagination';
import Button from '@/Components/common/Modern/Button';
import { getPlatformConfig } from '@/Constants/socialPlatforms';
import type { MediaFile, Publication } from '@/types';
import { formatDateTimeString } from '@/Utils/dateHelpers';
import { Head, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    Calendar,
    Check,
    Info,
    Loader2,
    MessageSquare,
    Share2,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  publication: Publication & { media_files: MediaFile[] };
  token: string;
}

const ClientPortal: React.FC<Props> = ({ publication, token }) => {
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const { post, processing, data, setData, errors } = useForm({
    reason: '',
  });

  const mediaFiles = publication.media_files || [];
  const hasMultipleMedia = mediaFiles.length > 1;

  const nextMedia = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % mediaFiles.length);
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prev) => (prev - 1 + mediaFiles.length) % mediaFiles.length);
  };

  const goToMedia = (index: number) => {
    setCurrentMediaIndex(index);
  };

  const handleApprove = () => {
    if (confirm('¿Estás seguro de que deseas aprobar este contenido?')) {
      post(route('api.v1.portal.approve', { token }), {
        onSuccess: () => {
          setIsSuccess(true);
          toast.success('Contenido aprobado correctamente');
        },
        onError: () => {
          toast.error('Error al aprobar el contenido');
        },
      });
    }
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.reason) {
      toast.error('Por favor, indica un motivo de rechazo');
      return;
    }

    post(route('api.v1.portal.reject', { token }), {
      onSuccess: () => {
        setIsSuccess(true);
        toast.success('Contenido rechazado correctamente');
      },
      onError: () => {
        toast.error('Error al rechazar el contenido');
      },
    });
  };

  // Helper to extract platforms from platform_settings
  const getTargetPlatforms = () => {
    if (
      !publication.platform_settings ||
      typeof publication.platform_settings !== 'object' ||
      Array.isArray(publication.platform_settings)
    ) {
      return [];
    }
    return Object.keys(publication.platform_settings).map((key) => getPlatformConfig(key));
  };

  const targetPlatforms = getTargetPlatforms();

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-zinc-950">
        <Head title="Contenido Procesado - Intellipost" />
        <div className="w-full max-w-md rounded-lg border border-gray-100 bg-white p-8 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            ¡Acción Completada!
          </h1>
          <p className="mb-6 text-gray-500 dark:text-zinc-400">
            Tu respuesta ha sido registrada correctamente para{' '}
            <strong>{publication.workspace?.name}</strong>. Ya puedes cerrar esta ventana.
          </p>
          <p className="text-sm text-gray-400 dark:text-zinc-500">Gracias por usar Intellipost.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans text-gray-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Head title={`Revisión: ${publication.title} - ${publication.workspace?.name}`} />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-lg font-bold text-white">
              C
            </div>
            <div>
              <span className="block text-lg font-bold leading-none tracking-tight">
                Intellipost
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Portal de Clientes
              </span>
            </div>
          </div>

          {publication.workspace && (
            <div className="flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-800">
              <div className="h-2 w-2 rounded-full bg-orange-500"></div>
              <span className="text-sm font-bold text-gray-700 dark:text-zinc-200">
                {publication.workspace.name}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-4xl px-4">
        {/* Why am I here? Info box */}
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-800/20 dark:bg-blue-900/10">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="mb-0.5 font-bold">Revisión de Contenido</p>
            Has recibido este enlace para revisar y aprobar el contenido preparado por{' '}
            <strong>{publication.user?.name || 'tu gestor'}</strong> para el workspace{' '}
            <strong>{publication.workspace?.name}</strong>.
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Status and Meta */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-orange-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                {publication.status === 'pending_review'
                  ? 'Pendiente de tu revisión'
                  : publication.status}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-zinc-400">
              {publication.scheduled_at && (
                <div className="flex items-center gap-1.5 rounded bg-white px-2 py-1 shadow-sm dark:bg-zinc-800">
                  <Calendar className="h-3.5 w-3.5 text-orange-500" />
                  <span>Programado: {formatDateTimeString(publication.scheduled_at)}</span>
                </div>
              )}

              {targetPlatforms.length > 0 && (
                <div className="flex items-center gap-1.5 rounded bg-white px-2 py-1 shadow-sm dark:bg-zinc-800">
                  <Share2 className="h-3.5 w-3.5 text-orange-500" />
                  <div className="flex items-center -space-x-1">
                    {targetPlatforms.map((p, i) => (
                      <div
                        key={i}
                        title={p.name}
                        className={`rounded-full border border-gray-100 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900`}
                      >
                        <p.icon className={`h-3 w-3 ${p.textColor}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 md:p-10">
            <h1 className="mb-6 text-3xl font-extrabold leading-tight text-gray-900 dark:text-white">
              {publication.title}
            </h1>

            {/* Media Preview with Carousel */}
            {mediaFiles.length > 0 && (
              <div className="mb-8 space-y-4">
                <div className="group relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-lg bg-gray-100 shadow-inner dark:bg-zinc-800">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={currentMediaIndex}
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{
                        duration: 0.3,
                        ease: 'easeInOut',
                      }}
                      className="flex h-full w-full items-center justify-center"
                    >
                      {mediaFiles[currentMediaIndex].file_type.startsWith('image/') ? (
                        <div className="relative max-h-[600px] max-w-full">
                          <img
                            src={mediaFiles[currentMediaIndex].file_path}
                            alt={`Preview ${currentMediaIndex + 1}`}
                            loading="lazy"
                            className="max-h-[600px] max-w-full object-contain transition-all duration-500 group-hover:scale-[1.02]"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className =
                                  'flex flex-col items-center gap-4 p-12 text-center text-neutral-400';
                                fallback.innerHTML = `
                                  <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                  </svg>
                                  <p class="text-sm font-medium">Error al cargar la imagen</p>
                                `;
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        </div>
                      ) : mediaFiles[currentMediaIndex].file_type.startsWith('video/') ? (
                        <video
                          src={mediaFiles[currentMediaIndex].file_path}
                          controls
                          preload="metadata"
                          className="max-h-[600px] max-w-full object-contain"
                        >
                          Tu navegador no soporta la reproducción de video.
                        </video>
                      ) : (
                        <div className="flex flex-col items-center gap-4 p-12 text-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-700">
                            <AlertCircle className="h-8 w-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">
                              Vista previa limitada
                            </p>
                            <p className="mt-1 text-sm text-gray-400">
                              Este archivo de tipo "{mediaFiles[currentMediaIndex].file_type}" se
                              procesará para el canal final.
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Counter Badge */}
                  {hasMultipleMedia && (
                    <div className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                      {currentMediaIndex + 1} / {mediaFiles.length}
                    </div>
                  )}
                </div>

                {/* Carousel Controls */}
                {hasMultipleMedia && (
                  <div className="flex flex-col items-center gap-3">
                    <CarouselPagination
                      currentSlide={currentMediaIndex}
                      totalSlides={mediaFiles.length}
                      onPrevious={prevMedia}
                      onNext={nextMedia}
                      className="justify-center"
                    />
                    <CarouselDots
                      totalSlides={mediaFiles.length}
                      currentSlide={currentMediaIndex}
                      onDotClick={goToMedia}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Content Body */}
            <div className="mb-10">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                <MessageSquare className="h-4 w-4" />
                Cuerpo del Mensaje
              </h3>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-6 dark:border-zinc-800/50 dark:bg-zinc-950/50">
                <div className="whitespace-pre-wrap text-lg font-medium leading-relaxed text-gray-700 dark:text-zinc-300">
                  {publication.description}
                </div>
              </div>
            </div>

            <hr className="mb-10 border-gray-100 dark:border-zinc-800" />

            {/* Actions */}
            {!showRejectReason ? (
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="h-16 flex-[2] rounded-lg bg-green-600 text-lg font-bold text-white shadow-lg shadow-green-500/20 transition-all hover:bg-green-700 active:scale-95"
                  icon={<Check className="h-6 w-6" />}
                >
                  {processing ? <Loader2 className="animate-spin" /> : 'Aprobar Contenido'}
                </Button>
                <Button
                  onClick={() => setShowRejectReason(true)}
                  disabled={processing}
                  variant="secondary"
                  buttonStyle="outline"
                  className="h-16 flex-1 rounded-lg border-gray-200 text-lg font-bold transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 dark:border-zinc-700 dark:hover:bg-red-950/20"
                  icon={<X className="h-6 w-6" />}
                >
                  Solicitar Cambios
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleReject}
                className="animate-in fade-in slide-in-from-top-4 space-y-4 duration-500"
              >
                <div className="mb-2 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-3 font-bold text-red-600 dark:border-red-800/20 dark:bg-red-900/10 dark:text-red-400">
                  <MessageSquare className="h-5 w-5" />
                  ¿Qué cambios necesitas en este contenido?
                </div>
                <textarea
                  value={data.reason}
                  onChange={(e) => setData('reason', e.target.value)}
                  className="dark:bg-zinc-850 h-40 w-full rounded-lg border-gray-200 p-5 text-lg text-gray-700 shadow-inner transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500 dark:border-zinc-700 dark:text-zinc-200"
                  placeholder="Por favor, describe detalladamente qué cambios te gustaría ver..."
                  required
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={processing}
                    className="h-14 flex-[2] rounded-lg bg-red-600 font-bold text-white shadow-lg shadow-red-500/20 hover:bg-red-700"
                  >
                    {processing ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      'Enviar Comentarios de Rechazo'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowRejectReason(false)}
                    className="h-14 flex-1 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-zinc-800"
                  >
                    Volver
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        <footer className="mt-12 text-center">
          <p className="text-sm text-gray-400 dark:text-zinc-600">
            Este es un enlace seguro generado por <strong>Intellipost</strong> para{' '}
            <strong>{publication.workspace?.name}</strong>.
          </p>
          <p className="mt-2 text-xs text-gray-300 dark:text-zinc-700">
            ID de Referencia: {publication.id} • Token: {token.substring(0, 8)}
            ...
          </p>
        </footer>
      </main>
    </div>
  );
};

export default ClientPortal;
