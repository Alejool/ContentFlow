import { Publication } from '@/types/Publication';
import { formatDateTime } from './formatDate';

/**
 * Cuenta los archivos multimedia por tipo
 */
export function countMediaFiles(publication: Publication) {
  if (
    !publication.media_files ||
    !Array.isArray(publication.media_files) ||
    publication.media_files.length === 0
  ) {
    return { images: 0, videos: 0, total: 0 };
  }

  let images = 0;
  let videos = 0;

  publication.media_files.forEach((file) => {
    if (!file || !file.file_type) return;
    if (file.file_type.includes('image')) images++;
    else if (file.file_type.includes('video')) videos++;
  });

  return { images, videos, total: publication.media_files.length };
}

/**
 * Verifica si una publicación tiene archivos multimedia
 */
export function hasMedia(publication: Publication): boolean {
  return !!(publication.media_files && publication.media_files.length > 0);
}

/**
 * Obtiene el primer archivo multimedia de una publicación
 */
export function getFirstMedia(publication: Publication) {
  if (!hasMedia(publication)) return null;
  return publication.media_files?.[0];
}

/**
 * Verifica si el primer archivo multimedia es un video
 */
export function isVideoMedia(publication: Publication): boolean {
  const firstMedia = getFirstMedia(publication);
  return firstMedia?.file_type?.includes('video') || false;
}

/**
 * Obtiene la URL del thumbnail o archivo multimedia
 */
export function getMediaUrl(publication: Publication): string | null {
  const firstMedia = getFirstMedia(publication);
  if (!firstMedia) return null;

  const url = firstMedia.thumbnail?.file_path || firstMedia.file_path;

  // Si no hay thumbnail y es una imagen, usar el file_path
  if (!url && firstMedia.file_type === 'image') {
    return firstMedia.file_path;
  }

  return url;
}

/**
 * Prepara los archivos multimedia para el preview
 */
export function prepareMediaForPreview(publication: Publication) {
  if (!hasMedia(publication)) return [];

  return (publication.media_files || []).map((media: { file_type?: string; thumbnail?: { file_path?: string }; file_path: string }) => {
    const isVideo = media.file_type?.includes('video');
    let mediaUrl = media.thumbnail?.file_path || media.file_path;

    if (!mediaUrl && media.file_type === 'image') {
      mediaUrl = media.file_path;
    }

    return {
      url: isVideo
        ? media.file_path.startsWith('http')
          ? media.file_path
          : `/storage/${media.file_path}`
        : mediaUrl.startsWith('http')
          ? mediaUrl
          : `/storage/${mediaUrl}`,
      type: (isVideo ? 'video' : 'image') as 'image' | 'video',
      title: publication.title,
    };
  });
}

/**
 * Formatea la fecha de una publicación
 */
export function formatPublicationDate(dateString?: string): string {
  if (!dateString) return '';
  try {
    return formatDateTime(dateString);
  } catch {
    return '';
  }
}

/**
 * Obtiene el nombre del usuario que tiene bloqueada la publicación
 */
export function getLockedByName(remoteLock?: { user_name?: string; user?: { name?: string } }): string {
  if (!remoteLock) return '';
  return remoteLock.user_name || remoteLock.user?.name || 'Usuario';
}

/**
 * Obtiene el primer nombre del usuario que tiene bloqueada la publicación
 */
export function getLockedByFirstName(remoteLock?: { user_name?: string; user?: { name?: string } }): string {
  const fullName = getLockedByName(remoteLock);
  return fullName.split(' ')[0] ?? '';
}

/**
 * Verifica si una publicación está siendo procesada
 */
export function isProcessing(publication: Publication): boolean {
  const firstMedia = getFirstMedia(publication);
  return (firstMedia as unknown as { status?: string })?.status === 'processing';
}

/**
 * Obtiene el icono de estado de una publicación
 */
export function getStatusIcon(status: string) {
  const icons = {
    published: 'CheckCircle',
    publishing: 'Loader2',
    scheduled: 'Calendar',
    failed: 'XCircle',
    pending_review: 'Clock',
    approved: 'CheckCircle',
    rejected: 'XCircle',
    draft: 'Clock',
  };

  return icons[status as keyof typeof icons] || 'Clock';
}

/**
 * Obtiene los colores de estado de una publicación
 */
export function getStatusColors(status?: string): string {
  const colors = {
    published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    pending_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    approved: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    publishing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return colors[status as keyof typeof colors] || colors.draft;
}

/**
 * Verifica si una publicación es un evento de usuario
 */
export function isUserEvent(publication: Publication): boolean {
  return (publication as Publication & { type?: string }).type === 'user_event';
}

/**
 * Verifica si una publicación es un evento de red social
 */
export function isSocialNetworkEvent(publication: Publication): boolean {
  return !!(publication.scheduled_at && publication.status !== 'published');
}
