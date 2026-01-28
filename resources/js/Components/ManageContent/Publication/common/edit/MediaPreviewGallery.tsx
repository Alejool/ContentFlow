import MediaLightbox from "@/Components/common/ui/MediaLightbox";
import { ChevronDown, ChevronUp, FileImage, Play, X } from "lucide-react";
import { memo, useState } from "react";

interface MediaPreviewGalleryProps {
  mediaItems: {
    tempId: string;
    url: string;
    type: string;
    thumbnailUrl?: string;
  }[];
  thumbnails: Record<string, File>;
  onSetThumbnail: (tempId: string, file: File) => void;
  onClearThumbnail: (tempId: string) => void;
}

const MediaPreviewGallery = memo(
  ({
    mediaItems,
    thumbnails,
    onSetThumbnail,
    onClearThumbnail,
  }: MediaPreviewGalleryProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxMedia, setLightboxMedia] = useState<{
        url: string;
        type: "image" | "video";
        title?: string;
    } | null>(null);

    if (mediaItems.length === 0) return null;

    const activeItem = mediaItems[activeIndex];
    const isVideo = activeItem?.type?.includes("video");

    return (
      <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-neutral-800/50 rounded-lg overflow-hidden mt-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Galería de Contenido
            </span>
            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
              {mediaItems.length}
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {isOpen && (
          <div className="p-4 space-y-6 animate-in slide-in-from-top-2 duration-200">
            {/* Main Preview */}
            <div
              className="aspect-video bg-black rounded-lg overflow-hidden relative shadow-lg group cursor-zoom-in"
              onClick={() => {
                setLightboxMedia({
                  url: activeItem.url,
                  type: isVideo ? "video" : "image",
                  title: "Media Preview",
                });
              }}
            >
              {isVideo ? (
                <div className="w-full h-full relative flex items-center justify-center">
                  <video
                    src={activeItem.url}
                    className="w-full h-full object-contain"
                    // controls // Remove controls to prevent conflict with click-to-expand, or keep them but ensure click works?
                    // actually, if we want click-to-open-lightbox, we might want custom controls or just a big play button overlay until clicked.
                    // Let's hide controls and show a Play button overlay
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <Play
                      className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 transition-opacity"
                      fill="currentColor"
                    />
                  </div>
                </div>
              ) : (
                <img
                  src={activeItem.url}
                  className="w-full h-full object-contain"
                  alt="Preview"
                />
              )}

              {/* Media Controls / Info Overlay (Stop propagation to prevent opening lightbox when clicking buttons) */}
              <div
                className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                {isVideo && (
                  <div className="relative">
                    <input
                      type="file"
                      id={`gallery-thumb-${activeItem.tempId}`}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onSetThumbnail(activeItem.tempId, file);
                      }}
                    />
                    <label
                      htmlFor={`gallery-thumb-${activeItem.tempId}`}
                      className="cursor-pointer bg-black/60 hover:bg-black/80 text-white px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm flex items-center gap-2 transition-colors"
                    >
                      <FileImage className="w-4 h-4" />
                      {thumbnails[activeItem.tempId] || activeItem.thumbnailUrl
                        ? "Cambiar Miniatura"
                        : "Subir Miniatura"}
                    </label>
                  </div>
                )}
              </div>

              {(thumbnails[activeItem.tempId] || activeItem.thumbnailUrl) &&
                isVideo && (
                  <div
                    className="absolute bottom-4 left-4 w-20 aspect-video rounded border border-white/20 overflow-hidden shadow-lg bg-black cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={
                        thumbnails[activeItem.tempId]
                          ? URL.createObjectURL(thumbnails[activeItem.tempId])
                          : activeItem.thumbnailUrl
                      }
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => onClearThumbnail(activeItem.tempId)}
                      className="absolute top-0 right-0 p-0.5 bg-red-500 text-white hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              {mediaItems.map((item, index) => (
                <button
                  key={item.tempId}
                  onClick={() => setActiveIndex(index)}
                  className={`relative flex-shrink-0 w-24 aspect-video rounded-md overflow-hidden border-2 transition-all ${
                    activeIndex === index
                      ? "border-primary-500 ring-2 ring-primary-500/20"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {item.type.includes("video") ? (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                      <video
                        src={item.url}
                        className="w-full h-full object-cover opacity-60"
                      />
                      <Play
                        className="w-6 h-6 text-white absolute"
                        fill="currentColor"
                      />
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
          </div>
        )}

        <MediaLightbox
            isOpen={!!lightboxMedia}
            onClose={() => setLightboxMedia(null)}
            media={lightboxMedia}
        />
      </div>
    );
  },
);

export default MediaPreviewGallery;
