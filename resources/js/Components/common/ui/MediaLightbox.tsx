import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

interface MediaItem {
  url: string;
  type: "image" | "video";
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

  const mediaArray: MediaItem[] = Array.isArray(media)
    ? media
    : media
      ? [media]
      : [];

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
    setCurrentIndex(
      (prev) => (prev - 1 + mediaArray.length) % mediaArray.length,
    );
    setTimeout(() => setIsAnimating(false), 300);
  };

  if (!isOpen || mediaArray.length === 0) return null;

  const currentMedia = mediaArray[currentIndex];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2.5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-50 hover:scale-110 active:scale-95"
      >
        <X className="w-6 h-6" />
      </button>

      {mediaArray.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-6 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-50 hover:scale-110 active:scale-95 group"
          >
            <ChevronLeft className="w-8 h-8 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-6 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-50 hover:scale-110 active:scale-95 group"
          >
            <ChevronRight className="w-8 h-8 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </>
      )}

      <div
        className="relative max-w-7xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          key={currentIndex}
          className={`absolute inset-0 flex items-center justify-center p-4 transition-all duration-300 ease-out ${isAnimating ? "opacity-50 scale-95" : "opacity-100 scale-100"}`}
        >
          {currentMedia.type === "video" ? (
            <video
              src={currentMedia.url}
              className="max-h-full max-w-full rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black"
              controls
              autoPlay
            />
          ) : (
            <img
              src={currentMedia.url}
              alt={currentMedia.title || "Media preview"}
              className="max-h-full max-w-full object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            />
          )}
        </div>

        {mediaArray.length > 1 && (
          <div className="absolute bottom-10 flex gap-2.5 z-50 p-2 rounded-full bg-black/20 backdrop-blur-sm">
            {mediaArray.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (idx !== currentIndex) {
                    setIsAnimating(true);
                    setCurrentIndex(idx);
                    setTimeout(() => setIsAnimating(false), 300);
                  }
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "bg-primary-500 w-8"
                    : "bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {currentMedia.title && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white text-lg font-medium opacity-70">
          {currentMedia.title}
        </div>
      )}
    </div>
  );
}
