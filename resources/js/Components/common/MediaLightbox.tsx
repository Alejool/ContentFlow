import Button from '@/Components/common/Modern/Button';
import { usePresignedUrlByKey } from '@/Hooks/Upload/usePresignedUrl';
import { ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

function LightboxMediaElement({ 
  media, 
  isThumbnail = false, 
  onVideoError 
}: { 
  media: MediaItem, 
  isThumbnail?: boolean,
  onVideoError?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void
}) {
  const urlStr = typeof media.url === 'string' ? media.url : '';
  const isS3Key = !!urlStr && !urlStr.startsWith('http') && !urlStr.startsWith('/storage') && !urlStr.startsWith('blob:') && !urlStr.startsWith('data:');
  
  const { data, isLoading } = usePresignedUrlByKey(
    isS3Key ? urlStr : null,
    { mediaType: media.type }
  );

  const finalUrl = isS3Key ? (data?.preview_url ?? '') : urlStr;

  if (isS3Key && isLoading) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-gray-900 ${!isThumbnail && 'min-h-[200px] min-w-[200px]'}`}>
        <Loader2 className="h-6 w-6 animate-spin text-white" />
      </div>
    );
  }

  if (media.type === 'video') {
    return (
      <video
        src={finalUrl}
        className={isThumbnail ? "h-full w-full object-cover" : "max-h-full max-w-full rounded-lg bg-black shadow-[0_0_50px_rgba(0,0,0,0.5)]"}
        controls={!isThumbnail}
        autoPlay={!isThumbnail}
        muted={isThumbnail}
        loop={isThumbnail}
        playsInline={isThumbnail}
        onError={onVideoError}
      />
    );
  }

  return (
    <img
      src={finalUrl}
      alt={media.title || 'Media preview'}
      className={isThumbnail ? "h-full w-full object-cover" : "max-h-full max-w-full rounded-lg object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)]"}
      onError={(e) => {
        if (isThumbnail) {
          e.currentTarget.src = 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80';
        }
      }}
    />
  );
}

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  title?: string;
}

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem | MediaItem[] | null;
  initialIndex?: number;
}

export default function MediaLightbox({
  isOpen,
  onClose,
  media,
  initialIndex = 0,
}: MediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isAnimating, setIsAnimating] = useState(false);

  const mediaArray: MediaItem[] = Array.isArray(media) ? media : media ? [media] : [];

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, currentIndex]);

  const handleNext = () => {
    if (mediaArray.length <= 1 || isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % mediaArray.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handlePrev = () => {
    if (mediaArray.length <= 1 || isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + mediaArray.length) % mediaArray.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  if (!isOpen || mediaArray.length === 0) return null;

  const currentMedia = mediaArray[currentIndex];

  // Safety check: if currentMedia is undefined, return null
  if (!currentMedia) return null;

  return createPortal(
    <div className="animate-in fade-in fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md duration-300">
      <Button
        onClick={onClose}
        buttonStyle="icon"
        icon={X}
        className="absolute top-6 right-6 z-50 !text-white"
        aria-label="Close lightbox"
      >
        {''}
      </Button>

      {mediaArray.length > 1 && (
        <>
          <Button
            onClick={handlePrev}
            buttonStyle="icon"
            variant="ghost"
            icon={ChevronLeft}
            className="absolute left-6 z-50 !text-white"
            aria-label="Previous media"
          >
            {''}
          </Button>
          <Button
            onClick={handleNext}
            buttonStyle="icon"
            variant="ghost"
            icon={ChevronRight}
            className="absolute right-6 z-50 !text-white"
            aria-label="Next media"
          >
            {''}
          </Button>
        </>
      )}

      <div
        className="relative flex h-full max-h-[90vh] w-full max-w-7xl flex-col items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          key={currentIndex}
          className={`absolute inset-0 flex items-center justify-center p-4 transition-all duration-300 ease-out ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}
        >
          <LightboxMediaElement media={currentMedia} />
        </div>

        {mediaArray.length > 1 && (
          <div className="absolute bottom-10 z-50 flex max-w-full gap-2.5 overflow-x-auto rounded-full bg-black/20 p-2 backdrop-blur-sm">
            {mediaArray.map((media, idx) => (
              <button
                key={`${media.url}-${idx}`}
                onClick={() => {
                  if (idx !== currentIndex) {
                    setIsAnimating(true);
                    setCurrentIndex(idx);
                    setTimeout(() => setIsAnimating(false), 300);
                  }
                }}
                aria-label={`Go to media ${idx + 1} of ${mediaArray.length}`}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                  idx === currentIndex
                    ? 'border-primary-500 dark:border-primary-400 scale-105'
                    : 'border-transparent hover:border-gray-400'
                }`}
              >
                <LightboxMediaElement 
                  media={media} 
                  isThumbnail={true} 
                  onVideoError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="flex h-full w-full items-center justify-center bg-gray-800">
                          <svg class="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                          </svg>
                        </div>
                      `;
                    }
                  }} 
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {currentMedia.title && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-lg font-medium text-white opacity-70">
          {currentMedia.title}
        </div>
      )}
    </div>,
    document.body,
  );
}
