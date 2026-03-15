import { useTheme } from "@/Hooks/useTheme";
import { Dialog, DialogPanel } from "@headlessui/react";
import { ChevronLeft, ChevronRight, File, Film, Image as ImageIcon, Play, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface MediaFile {
  id: number;
  file_path: string;
  file_type: string;
  file_name?: string;
}

interface CampaignMediaCarouselProps {
  mediaFiles: MediaFile[];
}

export default function CampaignMediaCarousel({ mediaFiles }: CampaignMediaCarouselProps) {
  const { theme } = useTheme();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(3);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setSlidesToShow(1);
      } else if (window.innerWidth < 1024) {
        setSlidesToShow(2);
      } else {
        setSlidesToShow(3);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const images = mediaFiles.filter(
    (file) =>
      file.file_type.startsWith("image/") ||
      file.file_type === "image" ||
      file.file_path?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i),
  );

  const videos = mediaFiles.filter(
    (file) =>
      file.file_type.startsWith("video/") ||
      file.file_type === "video" ||
      file.file_path?.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i),
  );

  const otherFiles = mediaFiles.filter(
    (file) =>
      !file.file_type.startsWith("image/") &&
      !file.file_type.startsWith("video/") &&
      !file.file_path?.match(/\.(jpg|jpeg|png|gif|webp|svg|mp4|avi|mov|wmv|flv|webm)$/i),
  );

  if (mediaFiles.length === 1) {
    const media = mediaFiles[0];
    const isImage =
      media.file_type.startsWith("image/") ||
      media.file_path?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
    const isVideo =
      media.file_type.startsWith("video/") ||
      media.file_path?.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i);

    return (
      <div className="mb-6">
        <div
          className="group relative cursor-pointer overflow-hidden rounded-lg"
          onClick={() => openLightbox(0)}
        >
          {isImage ? (
            <div className="relative aspect-video">
              <img
                src={media.file_path}
                alt={media.file_name || "Media"}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1579546929662-711aa81148cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ) : isVideo ? (
            <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-800 dark:bg-gray-900">
              <video
                src={media.file_path}
                className="h-full w-full object-cover"
                controls
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
                <Film className="h-3 w-3" />
                VIDEO
              </div>
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 p-8 dark:from-gray-800 dark:to-gray-900">
              <File className="mb-4 h-16 w-16 text-gray-400 dark:text-gray-600" />
              <span className="font-medium text-gray-600 dark:text-gray-400">
                {media.file_name || "Archivo adjunto"}
              </span>
              <span className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                {media.file_type || "Tipo desconocido"}
              </span>
            </div>
          )}
        </div>
        {/* Lightbox para caso único */}
        <Lightbox
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          mediaFiles={mediaFiles}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
        />
      </div>
    );
  }

  if (images.length > 0 && videos.length === 0 && otherFiles.length === 0) {
    return (
      <div className="mb-6">
        {images.length <= 4 ? (
          <div className={`grid gap-3 ${getGridClass(images.length)}`}>
            {images.map((img, idx) => (
              <ImageGridItem
                key={img.id}
                media={img}
                index={idx}
                total={images.length}
                onClick={() => openLightbox(idx)}
              />
            ))}
          </div>
        ) : (
          <ModernCarousel
            mediaFiles={images}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            slidesToShow={Math.min(slidesToShow, images.length)}
            onItemClick={openLightbox}
          />
        )}
        {/* Lightbox */}
        <Lightbox
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          mediaFiles={images}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
        />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="mb-4 flex items-center gap-3">
        {images.length > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 dark:bg-blue-900/30">
            <ImageIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {images.length} {images.length === 1 ? "imagen" : "imágenes"}
            </span>
          </div>
        )}
        {videos.length > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 dark:bg-purple-900/30">
            <Film className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              {videos.length} {videos.length === 1 ? "video" : "videos"}
            </span>
          </div>
        )}
      </div>

      <ModernCarousel
        mediaFiles={mediaFiles}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        slidesToShow={Math.min(slidesToShow, mediaFiles.length)}
        onItemClick={openLightbox}
      />

      {/* Lightbox */}
      <Lightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        mediaFiles={mediaFiles}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
      />
    </div>
  );

  function getGridClass(count: number): string {
    switch (count) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-2 grid-rows-2";
      case 4:
        return "grid-cols-2 grid-rows-2";
      default:
        return "grid-cols-3 grid-rows-2";
    }
  }

  function openLightbox(index: number) {
    setSelectedIndex(index);
    setIsLightboxOpen(true);
  }
}

function ImageGridItem({
  media,
  index,
  total,
  onClick,
}: {
  media: MediaFile;
  index: number;
  total: number;
  onClick: () => void;
}) {
  const isLarge = (total === 3 && index === 0) || (total === 4 && index === 0);

  return (
    <div
      className={`group relative cursor-pointer overflow-hidden rounded-lg ${
        isLarge ? "row-span-2" : ""
      }`}
      onClick={onClick}
    >
      <div className="relative aspect-square">
        <img
          src={media.file_path}
          alt={media.file_name || `Imagen ${index + 1}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1579546929662-711aa81148cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      {total > 4 && index === 3 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <span className="text-lg font-semibold text-white">+{total - 4}</span>
        </div>
      )}
    </div>
  );
}

function ModernCarousel({
  mediaFiles,
  currentIndex,
  setCurrentIndex,
  slidesToShow,
  onItemClick,
}: {
  mediaFiles: MediaFile[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  slidesToShow: number;
  onItemClick: (index: number) => void;
}) {
  const totalSlides = Math.ceil(mediaFiles.length / slidesToShow);
  const visibleSlides = mediaFiles.slice(currentIndex, currentIndex + slidesToShow);

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      if (prev + slidesToShow >= mediaFiles.length) {
        return 0;
      }
      return prev + 1;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      if (prev === 0) {
        return mediaFiles.length - slidesToShow;
      }
      return prev - 1;
    });
  };

  return (
    <div className="group relative">
      <div className="relative flex gap-4 overflow-hidden">
        {visibleSlides.map((media, idx) => {
          const actualIndex = currentIndex + idx;
          const isImage =
            media.file_type.startsWith("image/") ||
            media.file_path?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
          const isVideo =
            media.file_type.startsWith("video/") ||
            media.file_path?.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i);

          return (
            <div
              key={media.id}
              className={`flex-shrink-0 transition-all duration-300 ${
                slidesToShow > 1 ? "w-1/2" : "w-full"
              } ${slidesToShow === 2 ? "lg:w-1/2" : slidesToShow === 3 ? "lg:w-1/3" : ""}`}
              onClick={() => onItemClick(actualIndex)}
            >
              <div className="group/card relative cursor-pointer overflow-hidden rounded-lg">
                {isImage ? (
                  <div className="relative aspect-video">
                    <img
                      src={media.file_path}
                      alt={media.file_name || `Media ${actualIndex + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1579546929662-711aa81148cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
                  </div>
                ) : isVideo ? (
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-800 dark:bg-gray-900">
                    <video
                      src={media.file_path}
                      className="h-full w-full object-cover"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="absolute inset-0 bg-black/20 transition-colors duration-300 group-hover/card:bg-black/10" />
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
                      <Film className="h-3 w-3" />
                      VIDEO
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors duration-300 group-hover/card:bg-white/30">
                        <Play className="h-7 w-7 text-white" fill="white" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 p-6 dark:from-gray-800 dark:to-gray-900">
                    <File className="mb-3 h-12 w-12 text-gray-400 dark:text-gray-600" />
                    <span className="max-w-full truncate text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                      {media.file_name || "Archivo"}
                    </span>
                    <span className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      {media.file_type || "Tipo desconocido"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {mediaFiles.length > slidesToShow && (
        <>
          <button
            aria-label="Previous slide"
            className="absolute left-0 top-1/2 z-10 -translate-x-4 -translate-y-1/2 transform rounded-full bg-white/90 p-3 opacity-0 shadow-lg transition-all duration-300 hover:bg-white group-hover:translate-x-0 group-hover:opacity-100 dark:bg-gray-800 dark:hover:bg-gray-700"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            aria-label="Next slide"
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-4 transform rounded-full bg-white/90 p-3 opacity-0 shadow-lg transition-all duration-300 hover:bg-white group-hover:translate-x-0 group-hover:opacity-100 dark:bg-gray-800 dark:hover:bg-gray-700"
            onClick={nextSlide}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {totalSlides > 1 && (
        <div className="mt-6">
          <AnimatedPagination
            total={totalSlides}
            current={Math.floor(currentIndex / slidesToShow)}
            onPageChange={(idx) => setCurrentIndex(idx * slidesToShow)}
            autoAdvance={false}
          />
        </div>
      )}
    </div>
  );
}

function Lightbox({
  isOpen,
  onClose,
  mediaFiles,
  selectedIndex,
  setSelectedIndex,
}: {
  isOpen: boolean;
  onClose: () => void;
  mediaFiles: MediaFile[];
  selectedIndex: number;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
  const currentMedia = mediaFiles[selectedIndex];
  const isImage =
    currentMedia?.file_type.startsWith("image/") ||
    currentMedia?.file_path?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

  const nextSlide = () => {
    setSelectedIndex((prev: number) => (prev === mediaFiles.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setSelectedIndex((prev: number) => (prev === 0 ? mediaFiles.length - 1 : prev - 1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, selectedIndex]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[9999]">
      <div
        className="fixed inset-0 bg-black/95 backdrop-blur-md"
        aria-hidden="true"
        onClick={onClose}
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className="relative max-h-[90vh] w-full max-w-6xl bg-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 z-20 p-2 text-white transition-colors hover:text-gray-300"
          >
            <X className="h-8 w-8" />
          </button>

          <div className="relative h-full">
            <button
              aria-label="Previous image"
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 transform rounded-full bg-white/10 p-4 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>

            <div className="flex h-full flex-col items-center justify-center">
              {isImage ? (
                <img
                  src={currentMedia.file_path}
                  alt={`Media ${selectedIndex + 1}`}
                  className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1579546929662-711aa81148cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80";
                  }}
                />
              ) : (
                <div className="flex max-h-[70vh] w-full items-center justify-center">
                  <video
                    src={currentMedia.file_path}
                    controls
                    autoPlay
                    className="max-h-[70vh] max-w-full rounded-lg"
                  />
                </div>
              )}

              <div className="mt-6 max-w-2xl text-center text-white">
                <h3 className="mb-2 text-lg font-semibold">
                  {currentMedia.file_name || `Media ${selectedIndex + 1}`}
                </h3>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-300">
                  <span>{currentMedia.file_type}</span>
                  <span>•</span>
                  <span>
                    {selectedIndex + 1} de {mediaFiles.length}
                  </span>
                </div>
              </div>
            </div>

            <button
              aria-label="Next image"
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 transform rounded-full bg-white/10 p-4 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              onClick={nextSlide}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </div>

          {/* Miniaturas en la parte inferior */}
          {mediaFiles.length > 1 && (
            <div className="mt-8 flex justify-center gap-2 overflow-x-auto py-2">
              {mediaFiles.map((media, idx) => (
                <button
                  key={media.id}
                  className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                    idx === selectedIndex
                      ? "scale-105 border-blue-500 dark:border-blue-400"
                      : "border-transparent hover:border-gray-400"
                  }`}
                  onClick={() => setSelectedIndex(idx)}
                >
                  <img
                    src={media.file_path}
                    alt={`Thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1579546929662-711aa81148cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80";
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
