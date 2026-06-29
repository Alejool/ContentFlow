import { usePresignedUrl, useGeneratePresignedUrl } from '@/Hooks/Upload/usePresignedUrl';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Download, ExternalLink, Film, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface MediaFile {
  id: number;
  file_path: string;
  file_type: string;
  file_name?: string;
  metadata?: {
    platform?: string;
    duration?: number;
  };
}

interface ReelsCarouselProps {
  reels: MediaFile[];
  onReelDeleted?: (reelId: number) => void;
}

export default function ReelsCarousel({ reels, onReelDeleted }: ReelsCarouselProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const downloadMutation = useGeneratePresignedUrl('download');

  // Early return after all hooks
  if (reels.length === 0) return null;

  const currentReel = reels[currentIndex];

  const nextReel = () => {
    setCurrentIndex((prev) => (prev + 1) % reels.length);
  };

  const prevReel = () => {
    setCurrentIndex((prev) => (prev - 1 + reels.length) % reels.length);
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

  const handleDownload = async () => {
    try {
      const response = await downloadMutation.mutateAsync(currentReel.id);
      const url = response.data?.download_url;
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = currentReel.file_name || `reel-${currentReel.metadata?.platform}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      toast.error(t('common.downloadError'));
    }
  };

  const handleOpenInNewTab = async () => {
    try {
      const response = await downloadMutation.mutateAsync(currentReel.id);
      const url = response.data?.download_url;
      if (url) {
        window.open(url, '_blank');
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleDeleteReel = async () => {
    if (!confirm(t('reels.messages.confirmDelete'))) return;

    setDeleting(true);
    try {
      await axios.delete(`/api/v1/media/${currentReel.id}`);
      toast.success(t('reels.messages.reelDeleted'));

      // Move to next reel or previous if this was the last one
      if (reels.length > 1) {
        if (currentIndex >= reels.length - 1) {
          setCurrentIndex(Math.max(0, currentIndex - 1));
        }
      }

      onReelDeleted?.(currentReel.id);
    } catch (error) {
      toast.error(t('reels.messages.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Video Player */}
      <div className="relative mx-auto aspect-[9/16] max-h-[600px] overflow-hidden rounded-lg bg-black">
        <VideoPlayer reelId={currentReel.id} />

        {/* Platform Badge */}
        <div
          className={`absolute top-4 left-4 rounded-full bg-gradient-to-r px-3 py-1.5 ${getPlatformColor(currentReel.metadata?.platform)} flex items-center gap-2 text-sm font-bold text-white shadow-lg`}
        >
          <span className="text-base">{getPlatformIcon(currentReel.metadata?.platform)}</span>
          <span className="capitalize">{currentReel.metadata?.platform || 'Reel'}</span>
        </div>

        {/* Duration Badge */}
        {currentReel.metadata?.duration && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-sm font-medium text-white shadow-lg backdrop-blur-sm">
            <Film className="h-4 w-4" />
            {Math.floor(currentReel.metadata.duration)}s
          </div>
        )}

        {/* Navigation Arrows */}
        {reels.length > 1 && (
          <>
            <button
              onClick={prevReel}
              className="absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/20"
              aria-label="Previous reel"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextReel}
              className="absolute top-1/2 right-4 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/20"
              aria-label="Next reel"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Action Buttons */}
        <div className="absolute right-4 bottom-4 z-10 flex gap-2">
          <button
            onClick={handleDeleteReel}
            disabled={deleting}
            className="rounded-full bg-red-500/80 p-2.5 text-white backdrop-blur-sm transition-all hover:bg-red-600/80 disabled:opacity-50"
            title={t('reels.actions.delete')}
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <button
            onClick={handleDownload}
            disabled={downloadMutation.isPending}
            className="rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-all hover:bg-white/20 disabled:opacity-50"
            title={t('common.download')}
          >
            {downloadMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={handleOpenInNewTab}
            disabled={downloadMutation.isPending}
            className="rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-all hover:bg-white/20 disabled:opacity-50"
            title={t('common.openInNewTab')}
          >
            {downloadMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ExternalLink className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Thumbnails Navigation */}
      {reels.length > 1 && (
        <div className="flex gap-3 overflow-x-auto px-1 pb-2">
          {reels.map((reel, index) => (
            <ReelThumbnail
              key={reel.id}
              reelId={reel.id}
              index={index}
              currentIndex={currentIndex}
              platform={reel.metadata?.platform}
              onClick={() => setCurrentIndex(index)}
              getPlatformIcon={getPlatformIcon}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {reels.length > 1 && (
        <div className="text-center text-sm text-gray-600 dark:text-neutral-400">
          {currentIndex + 1} / {reels.length}
        </div>
      )}
    </div>
  );
}

function VideoPlayer({ reelId }: { reelId: number }) {
  const { data, isLoading } = usePresignedUrl(reelId, { mediaType: 'video' });

  if (isLoading || !data?.preview_url) {
    return (
      <div className="h-full w-full bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <video
      key={reelId}
      src={data.preview_url}
      className="h-full w-full object-contain"
      controls
      autoPlay
      loop
      playsInline
    />
  );
}

function ReelThumbnail({
  reelId,
  index,
  currentIndex,
  platform,
  onClick,
  getPlatformIcon,
}: {
  reelId: number;
  index: number;
  currentIndex: number;
  platform?: string;
  onClick: () => void;
  getPlatformIcon: (platform?: string) => string;
}) {
  const { data, isLoading } = usePresignedUrl(reelId, { mediaType: 'video' });

  return (
    <button
      onClick={onClick}
      className={`relative h-28 w-20 shrink-0 overflow-hidden rounded-lg transition-all ${
        index === currentIndex ? 'scale-105 ring-4 ring-purple-500' : 'opacity-60 hover:opacity-100'
      }`}
    >
      {isLoading ? (
        <div className="h-full w-full bg-gray-900 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        </div>
      ) : (
        <video src={data?.preview_url} className="h-full w-full object-cover" muted />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute right-1 bottom-1 left-1 text-center">
        <span className="text-xs font-medium text-white">{getPlatformIcon(platform)}</span>
      </div>
      {index === currentIndex && <div className="absolute inset-0 rounded-lg border-2 border-purple-500" />}
    </button>
  );
}
