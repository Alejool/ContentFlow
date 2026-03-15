import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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

  return createPortal(
    <div className="animate-in fade-in fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md duration-300">
      <button
        onClick={onClose}
        className="absolute right-6 top-6 z-50 rounded-full bg-white/10 p-2.5 text-white/70 transition-all hover:scale-110 hover:bg-white/20 hover:text-white active:scale-95"
      >
        <X className="h-6 w-6" />
      </button>

      {mediaArray.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="group absolute left-6 z-50 rounded-full bg-white/10 p-3 text-white/70 transition-all hover:scale-110 hover:bg-white/20 hover:text-white active:scale-95"
          >
            <ChevronLeft className="h-8 w-8 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <button
            onClick={handleNext}
            className="group absolute right-6 z-50 rounded-full bg-white/10 p-3 text-white/70 transition-all hover:scale-110 hover:bg-white/20 hover:text-white active:scale-95"
          >
            <ChevronRight className="h-8 w-8 transition-transform group-hover:translate-x-0.5" />
          </button>
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
          {currentMedia.type === 'video' ? (
            <video
              src={currentMedia.url}
              className="max-h-full max-w-full rounded-lg bg-black shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              controls
              autoPlay
            />
          ) : (
            <img
              src={currentMedia.url}
              alt={currentMedia.title || 'Media preview'}
              className="max-h-full max-w-full rounded-lg object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            />
          )}
        </div>

        {mediaArray.length > 1 && (
          <div className="absolute bottom-10 z-50 flex gap-2.5 rounded-full bg-black/20 p-2 backdrop-blur-sm">
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
                className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-8 bg-primary-500' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {currentMedia.title && (
        <div className="absolute left-1/2 top-6 -translate-x-1/2 text-lg font-medium text-white opacity-70">
          {currentMedia.title}
        </div>
      )}
    </div>,
    document.body,
  );
}
