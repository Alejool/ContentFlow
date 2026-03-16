import { Publication } from '@/types/Publication';
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type React from 'react';
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
 * Obtiene la configuración completa de un estado de publicación
 * Incluye colores, iconos y toda la información visual necesaria
 */
export function getPublicationStatusConfig(status?: string) {
  type StatusIcon = React.ComponentType<{ className?: string }>;

  const defaultConfig = {
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-500',
    border: 'border-gray-200 dark:border-gray-700',
    hover: 'hover:bg-gray-100 dark:hover:bg-gray-900/40',
    icon: Edit as StatusIcon,
  };

  const configMap: Record<string, typeof defaultConfig> = {
    draft: { ...defaultConfig },
    pending_review: {
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-500',
      border: 'border-amber-200 dark:border-amber-700',
      hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/40',
      icon: Eye,
    },
    approved: {
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-500',
      border: 'border-purple-200 dark:border-purple-700',
      hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/40',
      icon: Sparkles,
    },
    scheduled: {
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      bg: 'bg-sky-50 dark:bg-sky-900/20',
      text: 'text-sky-500',
      border: 'border-sky-200 dark:border-sky-700',
      hover: 'hover:bg-sky-100 dark:hover:bg-sky-900/40',
      icon: Calendar,
    },
    publishing: {
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-500',
      border: 'border-blue-200 dark:border-blue-700',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/40',
      icon: TrendingUp,
    },
    published: {
      badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-500',
      border: 'border-green-200 dark:border-green-700',
      hover: 'hover:bg-green-100 dark:hover:bg-green-900/40',
      icon: CheckCircle,
    },
    failed: {
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-500',
      border: 'border-red-200 dark:border-red-700',
      hover: 'hover:bg-red-100 dark:hover:bg-red-900/40',
      icon: Clock,
    },
    rejected: {
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-500',
      border: 'border-red-200 dark:border-red-700',
      hover: 'hover:bg-red-100 dark:hover:bg-red-900/40',
      icon: Clock,
    },
  };

  return configMap[status || 'draft'] || defaultConfig;
}

/**
 * Obtiene todos los estados de publicación disponibles
 */
export function getAllPublicationStatuses() {
  return ['draft', 'pending_review', 'approved', 'scheduled', 'publishing', 'published', 'failed'] as const;
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
