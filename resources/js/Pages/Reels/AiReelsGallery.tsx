import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Sparkles, Film, Download, ExternalLink, Play, Filter, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { usePresignedUrl, useGeneratePresignedUrl } from '@/Hooks/Upload/usePresignedUrl';
import ReelCardSkeleton from '@/Components/common/ui/skeletons/ReelCardSkeleton';
import EmptyState from '@/Components/common/EmptyState';
import { getEmptyStateByKey } from '@/Utils/Content/emptyStateMapper';
import { formatDateString } from '@/Utils/formatters';

interface MediaFile {
  id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  status: string;
  created_at: string;
  metadata?: {
    platform?: string;
    optimized_for?: string;
    original_media_id?: number;
    duration?: number;
    ai_generated?: boolean;
  };
  publication?: {
    id: number;
    title?: string;
  };
}

interface PaginationData {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export default function AiReelsGallery() {
  const { t } = useTranslation();
  const [reels, setReels] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchReels();
  }, [selectedPlatform, selectedStatus]);

  const fetchReels = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page };
      if (selectedPlatform !== 'all') params.platform = selectedPlatform;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const response = await axios.get('/api/v1/reels', { params });
      setReels(response.data.data.reels);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error('Error al cargar los reels');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform?: string) => {
    const icons: Record<string, string> = {
      instagram: '📸',
      tiktok: '🎵',
      youtube_shorts: '▶️',
    };
    return icons[platform || ''] || '🎬';
  };

  const getPlatformColor = (platform?: string) => {
    const colors: Record<string, string> = {
      instagram: 'from-pink-500 to-purple-500',
      tiktok: 'from-black to-cyan-500',
      youtube_shorts: 'from-red-500 to-red-600',
    };
    return colors[platform || ''] || 'from-purple-500 to-purple-600';
  };

  const handleDownload = async (reel: MediaFile) => {
    try {
      const mutation = useGeneratePresignedUrl('download');
      const response = await mutation.mutateAsync(reel.id);
      const url = response.data?.download_url;
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = reel.file_name || `reel-${reel.metadata?.platform}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      toast.error('Error al descargar');
    }
  };

  const handleOpenInNewTab = async (reel: MediaFile) => {
    try {
      const mutation = useGeneratePresignedUrl('download');
      const response = await mutation.mutateAsync(reel.id);
      const url = response.data?.download_url;
      if (url) {
        window.open(url, '_blank');
      }
    } catch {
      toast.error('Error al abrir');
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title="Reels Generados con IA" />

      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Reels Generados con IA
                </h1>
                <p className="text-sm text-gray-600 dark:text-neutral-400">
                  Todos tus videos optimizados para redes sociales
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">Filtros:</span>
            </div>

            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-neutral-600 dark:bg-theme-bg-secondary dark:text-white"
            >
              <option value="all">Todas las plataformas</option>
              <option value="instagram">📸 Instagram</option>
              <option value="tiktok">🎵 TikTok</option>
              <option value="youtube_shorts">▶️ YouTube Shorts</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-neutral-600 dark:bg-theme-bg-secondary dark:text-white"
            >
              <option value="all">Todos los estados</option>
              <option value="completed">Completados</option>
              <option value="processing">En proceso</option>
              <option value="failed">Fallidos</option>
            </select>
          </div>

          {/* Reels Grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ReelCardSkeleton key={index} />
              ))}
            </div>
          ) : reels.length === 0 ? (
            <EmptyState config={getEmptyStateByKey('reels', t)!} />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {reels.map((reel) => (
                  <ReelCard key={reel.id} reel={reel} getPlatformIcon={getPlatformIcon} getPlatformColor={getPlatformColor} onOpenInNewTab={handleOpenInNewTab} onDownload={handleDownload} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => fetchReels(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-theme-bg-secondary dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700 dark:text-neutral-300">
                    Página {pagination.current_page} de {pagination.last_page}
                  </span>
                  <button
                    onClick={() => fetchReels(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-theme-bg-secondary dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

function ReelCard({
  reel,
  getPlatformIcon,
  getPlatformColor,
  onOpenInNewTab,
  onDownload,
}: {
  reel: MediaFile;
  getPlatformIcon: (platform?: string) => string;
  getPlatformColor: (platform?: string) => string;
  onOpenInNewTab: (reel: MediaFile) => Promise<void>;
  onDownload: (reel: MediaFile) => Promise<void>;
}) {
  const [opening, setOpening] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { data, isLoading } = usePresignedUrl(reel.id, { mediaType: 'video' });

  const handleOpen = async () => {
    setOpening(true);
    try {
      await onOpenInNewTab(reel);
    } finally {
      setOpening(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownload(reel);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:border-primary-300 hover:shadow-lg dark:border-neutral-700 dark:bg-theme-bg-secondary dark:hover:border-primary-600">
      {/* Video Preview */}
      <div className="relative aspect-[9/16] bg-black">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : data?.preview_url ? (
          <>
            <video src={data.preview_url} className="h-full w-full object-cover" muted />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
              <Play className="h-12 w-12 text-white" fill="white" />
            </div>
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-900">
            <Film className="h-12 w-12 text-white/50" />
          </div>
        )}

        {/* Platform Badge */}
        <div
          className={`absolute left-3 top-3 rounded-lg bg-gradient-to-r px-2.5 py-1 text-xs font-bold text-white ${getPlatformColor(reel.metadata?.platform)} shadow-lg`}
        >
          {getPlatformIcon(reel.metadata?.platform)}{' '}
          {reel.metadata?.platform?.toUpperCase()}
        </div>

        {/* AI Badge */}
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-1 text-xs font-bold text-white shadow-lg">
          <Sparkles className="h-3 w-3" />
          AI
        </div>

        {/* Duration */}
        {reel.metadata?.duration && (
          <div className="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">
            {Math.floor(reel.metadata.duration)}s
          </div>
        )}
      </div>

      {/* Info & Actions */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="mb-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
            {reel.publication?.title || reel.file_name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            {formatDateString(reel.created_at, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpen}
            disabled={opening}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-100 hover:text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30 dark:hover:text-primary-300 disabled:opacity-50"
          >
            {opening ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ExternalLink className="h-3.5 w-3.5" />
            )}
            Ver
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Descargar
          </button>
        </div>
      </div>
    </div>
  );
}
