import { X } from "lucide-react";
import { useEffect } from "react";

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  media: {
    url: string;
    type: "image" | "video";
    title?: string;
  } | null;
}

export default function MediaLightbox({
  isOpen,
  onClose,
  media,
}: MediaLightboxProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !media) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
      >
        <X className="w-6 h-6" />
      </button>

      <div
        className="relative max-w-7xl max-h-[90vh] w-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {media.type === "video" ? (
          <video
            src={media.url}
            className="max-h-[85vh] max-w-full rounded-lg shadow-2xl"
            controls
            autoPlay
          />
        ) : (
          <img
            src={media.url}
            alt={media.title || "Media preview"}
            className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
        )}
      </div>
    </div>
  );
}
