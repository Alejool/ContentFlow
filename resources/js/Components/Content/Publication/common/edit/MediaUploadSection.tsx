import Label from '@/Components/common/Modern/Label';
import {
    getMediaRulesForContentType,
    type ContentType,
} from '@/Components/Content/Publication/common/ContentTypeSelector';
import { AlertTriangle, FileImage, Info, Loader2, Upload, Video, X } from 'lucide-react';
import React, { memo, useMemo, useRef } from 'react';

interface MediaUploadSectionProps {
  mediaPreviews: {
    id?: number;
    tempId: string;
    url: string;
    type: string;
    isNew: boolean;
    thumbnailUrl?: string;
    file?: File;
    status?: string;
  }[];
  thumbnails: Record<string, File>;
  imageError: string | null;
  isDragOver: boolean;
  t: (key: string) => string;
  onFileChange: (files: FileList | null) => void;
  onRemoveMedia: (tempId: string) => void;
  onSetThumbnail: (tempId: string, file: File) => void;
  onClearThumbnail: (tempId: string) => void;
  onUpdateFile?: (tempId: string, file: File) => void;
  onDragOver: (e: React.DragEvent<HTMLElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLElement>) => void;
  onDrop: (e: React.DragEvent<HTMLElement>) => void;
  disabled?: boolean;
  isAnyMediaProcessing?: boolean;
  uploadProgress?: Record<string, number>;
  uploadStats?: Record<string, { eta?: number; speed?: number }>;
  uploadErrors?: Record<string, string>;
  lockedBy?: {
    id: number;
    name: string;
    photo_url: string;
    isSelf: boolean;
  } | null;
  videoMetadata?: Record<string, { duration: number; youtubeType: string }>;
  publicationId?: number;
  allMediaFiles?: any[];
  contentType?: ContentType; // Nuevo: tipo de contenido para aplicar reglas
}

const MediaUploadSection = memo(
  ({
    mediaPreviews,
    thumbnails,
    imageError,
    isDragOver,
    t,
    onFileChange,
    onRemoveMedia,
    onSetThumbnail,
    onClearThumbnail,
    onUpdateFile,
    onDragOver,
    onDragLeave,
    onDrop,
    disabled,
    isAnyMediaProcessing,
    uploadProgress,
    uploadStats,
    uploadErrors,
    lockedBy,
    videoMetadata,
    publicationId,
    allMediaFiles = [],
    contentType = 'post',
  }: MediaUploadSectionProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Obtener reglas de medios según el tipo de contenido
    const mediaRules = useMemo(() => getMediaRulesForContentType(contentType), [contentType]);

    // Calcular contadores de medios actuales
    const mediaCounts = useMemo(() => {
      const images = mediaPreviews.filter((m) => m.type.includes('image')).length;
      const videos = mediaPreviews.filter((m) => m.type.includes('video')).length;
      return { images, videos, total: images + videos };
    }, [mediaPreviews]);

    // Determinar qué tipos de archivo aceptar según las reglas
    const acceptedFileTypes = useMemo(() => {
      const types: string[] = [];

      if (mediaRules.videoOnly) {
        // Solo videos (para reels)
        types.push('video/mp4', 'video/mov', 'video/avi');
      } else if (mediaRules.imageOnly) {
        // Solo imágenes (incluyendo SVG)
        types.push('image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml');
      } else {
        // Verificar si aún se pueden agregar imágenes
        if (
          mediaRules.maxImages === undefined ||
          (mediaRules.maxImages > 0 && mediaCounts.images < mediaRules.maxImages)
        ) {
          types.push('image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml');
        }
        // Verificar si aún se pueden agregar videos
        if (
          mediaRules.maxVideos === undefined ||
          (mediaRules.maxVideos > 0 && mediaCounts.videos < mediaRules.maxVideos)
        ) {
          types.push('video/mp4', 'video/mov', 'video/avi');
        }
      }

      return types.join(',');
    }, [mediaRules, mediaCounts]);

    // Verificar si se puede agregar más contenido
    const canAddMore = useMemo(() => {
      // Para polls que no permiten media
      if (mediaRules.maxImages === 0 && mediaRules.maxVideos === 0) return false;

      // Para reels (solo video)
      if (mediaRules.videoOnly && mediaCounts.videos >= 1) return false;

      // Para tipos que solo permiten imágenes
      if (
        mediaRules.imageOnly &&
        mediaRules.maxImages &&
        mediaCounts.images >= mediaRules.maxImages
      )
        return false;

      // Para carousel, usar maxCount si está definido
      if (mediaRules.maxCount && mediaCounts.total >= mediaRules.maxCount) return false;

      // Para otros tipos, verificar límites individuales
      if (
        mediaRules.maxImages !== undefined &&
        mediaRules.maxImages === 0 &&
        mediaCounts.images > 0
      )
        return false;
      if (
        mediaRules.maxVideos !== undefined &&
        mediaRules.maxVideos === 0 &&
        mediaCounts.videos > 0
      )
        return false;

      // Verificar límites totales
      const maxTotal = (mediaRules.maxImages || 0) + (mediaRules.maxVideos || 0);
      if (maxTotal > 0 && mediaCounts.total >= maxTotal) return false;

      return true;
    }, [mediaRules, mediaCounts]);

    const getUploadAreaStyles = () => {
      if (disabled || isAnyMediaProcessing || (lockedBy && !lockedBy.isSelf)) {
        return 'bg-gray-100 dark:bg-neutral-800/90 cursor-not-allowed opacity-60 border-gray-300 dark:border-neutral-700';
      }
      if (imageError) {
        return 'border-primary-300 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20';
      }
      if (isDragOver) {
        return 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 dark:border-primary-400';
      }
      return 'border-gray-200 dark:border-neutral-600 hover:border-primary-300 dark:hover:border-primary-400 bg-gray-50 dark:bg-neutral-900/90';
    };

    return (
      <>
        <div className={`space-y-4 ${disabled ? 'pointer-events-none select-none' : ''}`}>
          <div className="flex items-center justify-between">
            <Label htmlFor="media-upload" icon={FileImage} required variant="bold" size="lg">
              Media
            </Label>

            {/* Indicador de límites */}
            {mediaPreviews.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Info className="h-3 w-3" />
                <span>
                  {mediaRules.videoOnly
                    ? `${mediaCounts.videos}/1 video`
                    : mediaRules.imageOnly
                      ? `${mediaCounts.images}/${mediaRules.maxImages || '∞'} imágenes`
                      : mediaRules.maxCount
                        ? `${mediaCounts.total}/${mediaRules.maxCount} archivos`
                        : `${mediaCounts.total}/${(mediaRules.maxImages || 0) + (mediaRules.maxVideos || 0)} archivos`}
                </span>
              </div>
            )}
          </div>

          <div
            className={`group relative block transition-all duration-300 ${
              isDragOver && !disabled
                ? 'scale-[1.02] ring-2 ring-primary-500 ring-offset-2 dark:ring-primary-900'
                : ''
            } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            onDrop={disabled ? undefined : onDrop}
            onDragOver={disabled ? undefined : onDragOver}
            onDragLeave={disabled ? undefined : onDragLeave}
          >
            <div
              className={`flex min-h-[200px] flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed p-6 text-center transition-colors ${getUploadAreaStyles()}`}
            >
              {mediaPreviews.length > 0 ? (
                <div className="grid w-full grid-cols-2 gap-4">
                  {mediaPreviews.map((preview, index) => (
                    <div key={preview.tempId} className="space-y-2">
                      <MediaPreviewItem
                        preview={preview}
                        index={index}
                        thumbnail={thumbnails[preview.tempId]}
                        onRemove={() => onRemoveMedia(preview.tempId)}
                        onSetThumbnail={(file) => onSetThumbnail(preview.tempId, file)}
                        onClearThumbnail={() => onClearThumbnail(preview.tempId)}
                        disabled={disabled || isAnyMediaProcessing}
                        progress={uploadProgress?.[preview.tempId]}
                        stats={uploadStats?.[preview.tempId]}
                        error={uploadErrors?.[preview.tempId]}
                        isExternalProcessing={preview.status === 'processing'}
                        metadata={videoMetadata?.[preview.tempId]}
                      />
                    </div>
                  ))}
                  {!disabled && !isAnyMediaProcessing && canAddMore && <AddMoreButton />}
                </div>
              ) : (
                <label
                  htmlFor={disabled || isAnyMediaProcessing ? undefined : 'media-file-input'}
                  className="cursor-pointer"
                >
                  <EmptyUploadState
                    t={t}
                    isProcessing={isAnyMediaProcessing}
                    lockedBy={lockedBy}
                    mediaRules={mediaRules}
                  />
                </label>
              )}

              {/* Global Processing Indicator for the whole area */}
              {isAnyMediaProcessing && (
                <div className="animate-in slide-in-from-bottom-2 absolute inset-x-0 bottom-0 border-t border-primary-500/20 bg-primary-500/10 px-4 py-1.5 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-800">
                      <div
                        className="h-full bg-primary-500 transition-all duration-500 ease-out"
                        style={{
                          width: `${
                            Object.values(uploadProgress || {}).length > 0
                              ? Object.values(uploadProgress || {}).reduce((a, b) => a + b, 0) /
                                Object.values(uploadProgress || {}).length
                              : 100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="whitespace-nowrap text-[10px] font-bold uppercase text-primary-600 dark:text-primary-400">
                      {Object.values(uploadProgress || {}).length > 0
                        ? 'Subiendo...'
                        : 'Procesando S3...'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {!disabled && !isAnyMediaProcessing && canAddMore && (
              <input
                ref={fileInputRef}
                id="media-file-input"
                type="file"
                className="hidden"
                multiple={
                  mediaRules.maxCount
                    ? mediaRules.maxCount > 1
                    : !mediaRules.videoOnly &&
                      ((mediaRules.maxImages || 1) > 1 || (mediaRules.maxVideos || 0) > 1)
                }
                accept={acceptedFileTypes}
                onChange={(e) => onFileChange(e.target.files)}
              />
            )}
          </div>

          {imageError && (
            <div className="animate-in slide-in-from-left-1 mt-2 flex items-center gap-2 text-sm text-primary-500">
              <AlertTriangle className="h-4 w-4" />
              {imageError}
            </div>
          )}

          {/* Mensaje informativo sobre límites alcanzados */}
          {!canAddMore && mediaPreviews.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <Info className="h-4 w-4" />
              <span>
                {mediaRules.videoOnly
                  ? 'Los Reels/Shorts solo permiten 1 video'
                  : `Límite alcanzado para este tipo de contenido`}
              </span>
            </div>
          )}
        </div>
      </>
    );
  },
);

const MediaPreviewItem = memo(
  ({
    preview,
    index,
    thumbnail,
    onRemove,
    onSetThumbnail,
    onClearThumbnail,
    disabled,
    progress,
    stats,
    error,
    isExternalProcessing,
    metadata,
  }: {
    preview: any;
    index: number;
    thumbnail?: File;
    onRemove: () => void;
    onSetThumbnail: (file: File) => void;
    onClearThumbnail: () => void;
    disabled?: boolean;
    progress?: number;
    stats?: { eta?: number; speed?: number };
    error?: string;
    isExternalProcessing?: boolean;
    metadata?: { duration: number };
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatETA = (seconds?: number) => {
      if (!seconds || typeof seconds !== 'number' || isNaN(seconds)) return '';
      const roundedSeconds = Math.round(seconds);
      if (roundedSeconds < 60) return `${roundedSeconds}s`;
      const mins = Math.floor(roundedSeconds / 60);
      const secs = roundedSeconds % 60;
      return `${mins}m ${secs}s`;
    };

    const isProcessing =
      preview.status === 'processing' ||
      (progress !== undefined && progress >= 100 && preview.status !== 'completed') ||
      isExternalProcessing;
    const isUploading =
      !error && (preview.status === 'uploading' || (progress !== undefined && progress < 100));

    return (
      <div
        className={`group/item relative aspect-video overflow-hidden rounded-lg bg-gray-900 ${
          disabled ? 'opacity-90' : ''
        } ${error ? 'border-red-500 ring-2 ring-red-500/20' : ''} ${isProcessing || isUploading ? 'animate-pulse' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {isProcessing || isUploading ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gray-800 p-4 text-white">
            <div className="mb-2 rounded-full bg-white/10 p-3">
              {preview.type.includes('video') ? (
                <Video className="h-8 w-8 text-white/50" />
              ) : (
                <FileImage className="h-8 w-8 text-white/50" />
              )}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">
              {isUploading ? 'Uploading...' : 'Processing...'}
            </span>
          </div>
        ) : preview.type.includes('video') ? (
          <VideoPreview
            preview={preview}
            thumbnail={thumbnail}
            onSetThumbnail={onSetThumbnail}
            onClearThumbnail={onClearThumbnail}
            fileInputRef={fileInputRef}
            disabled={disabled}
            duration={metadata?.duration}
          />
        ) : (
          <img src={preview.url} className="h-full w-full object-cover" alt="Media preview" />
        )}

        {/* Upload Overlay (Matching Outside Style) */}
        {!error && isUploading && (
          <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/60 p-3 backdrop-blur-md">
            <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-700/50">
              <div
                className="linear h-full bg-primary-500 transition-all duration-500"
                style={{ width: `${progress || 0}%` }}
              />
            </div>
            <div className="flex w-full justify-between text-[10px] font-bold uppercase tracking-tighter text-white/90">
              <span>{Math.round(progress || 0)}%</span>
              {stats?.eta && typeof stats.eta === 'number' && !isNaN(stats.eta) && (
                <span>~{formatETA(stats.eta)}</span>
              )}
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="animate-in fade-in zoom-in absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-900/80 p-4 text-center backdrop-blur-sm duration-300">
            <AlertTriangle className="mb-2 h-8 w-8 text-white" />
            <span className="text-sm font-bold text-white">Upload Failed</span>
            <span className="mt-1 line-clamp-2 px-2 text-xs text-white/80">{error}</span>
          </div>
        )}

        {!disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute right-2 top-2 z-30 rounded-full bg-red-500/80 p-1.5 text-white opacity-0 backdrop-blur-sm transition-colors hover:bg-red-600 group-hover/item:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  },
);

const VideoPreview = memo(
  ({
    preview,
    thumbnail,
    onSetThumbnail,
    onClearThumbnail,
    fileInputRef,
    disabled,
    duration,
  }: {
    preview: any;
    thumbnail?: File;
    onSetThumbnail: (file: File) => void;
    onClearThumbnail: () => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    disabled?: boolean;
    duration?: number;
  }) => (
    <>
      <video src={preview.url} className="h-full w-full object-cover opacity-80" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <span className="rounded bg-black/50 px-2 py-1 text-xs font-medium text-white/80">
          {duration
            ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`
            : 'Video'}
        </span>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <input
            type="file"
            id={`edit-thumb-${preview.tempId}`}
            className="hidden"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/svg+xml,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSetThumbnail(file);
            }}
          />
          <label
            htmlFor={disabled ? undefined : `edit-thumb-${preview.tempId}`}
            className={`flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5 text-xs text-white backdrop-blur-sm transition-colors ${disabled ? 'cursor-default opacity-50' : 'cursor-pointer bg-white/10 hover:bg-white/20'}`}
          >
            <FileImage className="h-3 w-3" />
            {thumbnail || preview.thumbnailUrl ? 'Change Thumb' : 'Set Thumb'}
          </label>
          {(thumbnail || preview.thumbnailUrl) && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClearThumbnail();
              }}
              className="rounded-full border border-red-400/50 bg-red-500/80 p-1.5 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-red-600"
              title="Remove Thumbnail"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      {(thumbnail || preview.thumbnailUrl) && (
        <div className="absolute left-2 top-2 z-10 h-8 w-8 overflow-hidden rounded border border-white/30 shadow-lg">
          <img
            src={thumbnail ? URL.createObjectURL(thumbnail) : preview.thumbnailUrl}
            className="h-full w-full object-cover"
            alt="Video thumbnail"
          />
        </div>
      )}
    </>
  ),
);

const AddMoreButton = memo(() => (
  <label
    htmlFor="media-file-input"
    className="flex aspect-video cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:bg-neutral-200/90 hover:dark:bg-neutral-800/90"
  >
    <div className="text-center">
      <Upload className="mx-auto h-6 w-6 text-gray-400" />
      <span className="text-xs text-gray-500">Add more</span>
    </div>
  </label>
));

const EmptyUploadState = memo(
  ({
    t,
    isProcessing,
    lockedBy,
    mediaRules,
  }: {
    t: (key: string) => string;
    isProcessing?: boolean;
    lockedBy?: { name: string; isSelf: boolean } | null;
    mediaRules?: {
      minCount?: number;
      maxCount?: number;
      maxImages?: number;
      maxVideos?: number;
      allowMixed?: boolean;
      videoOnly?: boolean;
      imageOnly?: boolean;
    };
  }) => {
    const getMediaHint = () => {
      if (!mediaRules) return 'Arrastra imágenes o videos aquí';

      if (mediaRules.videoOnly) return 'Solo 1 video vertical';
      if (mediaRules.imageOnly)
        return `Hasta ${mediaRules.maxImages || 1} imagen${(mediaRules.maxImages || 1) > 1 ? 'es' : ''}`;

      // Para carousel, usar maxCount si está definido
      if (mediaRules.maxCount) {
        const minText = mediaRules.minCount ? `${mediaRules.minCount}-` : '';
        return `${minText}${mediaRules.maxCount} archivos (imágenes o videos)`;
      }

      const parts: string[] = [];
      if (mediaRules.maxImages && mediaRules.maxImages > 0) {
        parts.push(`${mediaRules.maxImages} imagen${mediaRules.maxImages > 1 ? 'es' : ''}`);
      }
      if (mediaRules.maxVideos && mediaRules.maxVideos > 0) {
        parts.push(`${mediaRules.maxVideos} video${mediaRules.maxVideos > 1 ? 's' : ''}`);
      }

      if (parts.length === 0) return 'Arrastra archivos aquí';

      const result = parts.join(' o ');
      return mediaRules.allowMixed ? `Hasta ${result} (puedes mezclar)` : `Hasta ${result}`;
    };

    return (
      <div className="space-y-4">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 ${isProcessing || (lockedBy && !lockedBy.isSelf) ? 'bg-gray-200 dark:bg-gray-800' : 'bg-primary-100 group-hover:scale-110 dark:bg-primary-900/30'}`}
        >
          {isProcessing ? (
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          ) : lockedBy && !lockedBy.isSelf ? (
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          ) : (
            <Upload className="h-8 w-8 text-primary-500" />
          )}
        </div>
        <div>
          <p className="text-lg font-medium">
            {isProcessing
              ? 'Procesando archivos...'
              : lockedBy && !lockedBy.isSelf
                ? `Subida bloqueada por ${lockedBy.name}`
                : t('publications.modal.edit.dragDrop.title')}
          </p>
          <p className="mt-1 text-sm opacity-70">
            {isProcessing
              ? 'Por favor, espera a que termine la subida actual.'
              : lockedBy && !lockedBy.isSelf
                ? 'Solo una persona puede subir archivos a la vez.'
                : getMediaHint()}
          </p>
        </div>
      </div>
    );
  },
);

export default MediaUploadSection;
