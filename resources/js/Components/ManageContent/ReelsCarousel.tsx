import { ChevronLeft, ChevronRight, Download, ExternalLink, Film, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import axios from 'axios';

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

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentReel.file_path;
    link.download = currentReel.file_name || `reel-${currentReel.metadata?.platform}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(currentReel.file_path, '_blank');
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
      <div className="relative bg-black rounded-lg overflow-hidden aspect-[9/16] max-h-[600px] mx-auto">
        <video
          key={currentReel.id}
          src={currentReel.file_path}
          className="w-full h-full object-contain"
          controls
          autoPlay
          loop
          playsInline
        />

        {/* Platform Badge */}
        <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full bg-gradient-to-r ${getPlatformColor(currentReel.metadata?.platform)} text-white text-sm font-bold flex items-center gap-2 shadow-lg`}>
          <span className="text-base">{getPlatformIcon(currentReel.metadata?.platform)}</span>
          <span className="capitalize">{currentReel.metadata?.platform || 'Reel'}</span>
        </div>

        {/* Duration Badge */}
        {currentReel.metadata?.duration && (
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-sm font-medium flex items-center gap-1.5 shadow-lg">
            <Film className="w-4 h-4" />
            {Math.floor(currentReel.metadata.duration)}s
          </div>
        )}

        {/* Navigation Arrows */}
        {reels.length > 1 && (
          <>
            <button
              onClick={prevReel}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all text-white z-10"
              aria-label="Previous reel"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextReel}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all text-white z-10"
              aria-label="Next reel"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Action Buttons */}
        <div className="absolute bottom-4 right-4 flex gap-2 z-10">
          <button
            onClick={handleDeleteReel}
            disabled={deleting}
            className="p-2.5 bg-red-500/80 hover:bg-red-600/80 backdrop-blur-sm rounded-full transition-all text-white disabled:opacity-50"
            title={t('reels.actions.delete')}
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all text-white"
            title={t('common.download')}
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all text-white"
            title={t('common.openInNewTab')}
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Thumbnails Navigation */}
      {reels.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 px-1">
          {reels.map((reel, index) => (
            <button
              key={reel.id}
              onClick={() => setCurrentIndex(index)}
              className={`relative flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden transition-all ${
                index === currentIndex
                  ? 'ring-4 ring-purple-500 scale-105'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <video
                src={reel.file_path}
                className="w-full h-full object-cover"
                muted
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-1 left-1 right-1 text-center">
                <span className="text-white text-xs font-medium">
                  {getPlatformIcon(reel.metadata?.platform)}
                </span>
              </div>
              {index === currentIndex && (
                <div className="absolute inset-0 border-2 border-purple-500 rounded-lg" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Counter */}
      {reels.length > 1 && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {currentIndex + 1} / {reels.length}
        </div>
      )}
    </div>
  );
}
