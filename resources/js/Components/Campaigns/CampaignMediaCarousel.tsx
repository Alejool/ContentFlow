import Button from "@/Components/common/Modern/Button";
import { useTheme } from "@/Hooks/useTheme";
import { Dialog, DialogPanel } from "@headlessui/react";
import {
  ChevronLeft,
  ChevronRight,
  File,
  Film,
  Image as ImageIcon,
  Play,
  X,
} from "lucide-react";
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

export default function CampaignMediaCarousel({
  mediaFiles,
}: CampaignMediaCarouselProps) {
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
      !file.file_path?.match(
        /\.(jpg|jpeg|png|gif|webp|svg|mp4|avi|mov|wmv|flv|webm)$/i,
      ),
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
          className="relative rounded-lg overflow-hidden cursor-pointer group"
          onClick={() => openLightbox(0)}
        >
          {isImage ? (
            <div className="relative aspect-video">
              <img
                src={media.file_path}
                alt={media.file_name || "Media"}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1579546929662-711aa81148cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ) : isVideo ? (
            <div className="relative aspect-video bg-gray-800 dark:bg-gray-900 rounded-lg overflow-hidden">
              <video
                src={media.file_path}
                className="w-full h-full object-cover"
                controls
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Film className="w-3 h-3" />
                VIDEO
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg flex flex-col items-center justify-center p-8">
              <File className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                {media.file_name || "Archivo adjunto"}
              </span>
              <span className="text-gray-500 dark:text-gray-500 text-sm mt-1">
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
      <div className="flex items-center gap-3 mb-4">
        {images.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full">
            <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {images.length} {images.length === 1 ? "imagen" : "imágenes"}
            </span>
          </div>
        )}
        {videos.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-full">
            <Film className="w-4 h-4 text-purple-600 dark:text-purple-400" />
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
      className={`relative rounded-lg overflow-hidden cursor-pointer group ${
        isLarge ? "row-span-2" : ""
      }`}
      onClick={onClick}
    >
      <div className="relative aspect-square">
        <img
          src={media.file_path}
          alt={media.file_name || `Imagen ${index + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1579546929662-711aa81148cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      {total > 4 && index === 3 && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-white text-lg font-semibold">+{total - 4}</span>
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
  const visibleSlides = mediaFiles.slice(
    currentIndex,
    currentIndex + slidesToShow,
  );

  const nextSlide = () => {
    if (currentIndex + slidesToShow >= mediaFiles.length) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex === 0) {
      setCurrentIndex(mediaFiles.length - slidesToShow);
    } else {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="relative group">
      <div className="flex gap-4 overflow-hidden relative">
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
              } ${
                slidesToShow === 2
                  ? "lg:w-1/2"
                  : slidesToShow === 3
                    ? "lg:w-1/3"
                    : ""
              }`}
              onClick={() => onItemClick(actualIndex)}
            >
              <div className="relative rounded-lg overflow-hidden cursor-pointer group/card">
                {isImage ? (
                  <div className="relative aspect-video">
                    <img
                      src={media.file_path}
                      alt={media.file_name || `Media ${actualIndex + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1579546929662-711aa81148cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                  </div>
                ) : isVideo ? (
                  <div className="relative aspect-video bg-gray-800 dark:bg-gray-900 rounded-lg overflow-hidden">
                    <video
                      src={media.file_path}
                      className="w-full h-full object-cover"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover/card:bg-black/10 transition-colors duration-300" />
                    <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Film className="w-3 h-3" />
                      VIDEO
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover/card:bg-white/30 transition-colors duration-300">
                        <Play className="w-7 h-7 text-white" fill="white" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg flex flex-col items-center justify-center p-6">
                    <File className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" />
                    <span className="text-gray-600 dark:text-gray-400 font-medium text-sm text-center truncate max-w-full">
                      {media.file_name || "Archivo"}
                    </span>
                    <span className="text-gray-500 dark:text-gray-500 text-xs mt-1">
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
          <Button
            aria-label="Previous slide"
            variant="ghost"
            buttonStyle="ghost"
            shadow="none"
            className="absolute left-0 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-white/90 dark:bg-gray-800 shadow-lg z-10 hover:bg-white dark:hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 duration-300"
            onClick={prevSlide}
            icon={<ChevronLeft className="w-5 h-5" />}
          >
            {""}
          </Button>
          <Button
            aria-label="Next slide"
            variant="ghost"
            buttonStyle="ghost"
            shadow="none"
            className="absolute right-0 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-white/90 dark:bg-gray-800 shadow-lg z-10 hover:bg-white dark:hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 duration-300"
            onClick={nextSlide}
            icon={<ChevronRight className="w-5 h-5" />}
          >
            {""}
          </Button>
        </>
      )}

      {totalSlides > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <Button
              key={idx}
              variant="ghost"
              buttonStyle="ghost"
              shadow="none"
              className={`w-8 h-2 min-w-0 p-0 rounded-full transition-all duration-300 ${
                idx === Math.floor(currentIndex / slidesToShow)
                  ? "bg-blue-500 dark:bg-blue-400"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
              onClick={() => setCurrentIndex(idx * slidesToShow)}
            >
              {""}
            </Button>
          ))}
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
    setSelectedIndex((prev: number) =>
      prev === mediaFiles.length - 1 ? 0 : prev + 1,
    );
  };

  const prevSlide = () => {
    setSelectedIndex((prev: number) =>
      prev === 0 ? mediaFiles.length - 1 : prev - 1,
    );
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
          className="relative w-full max-w-6xl max-h-[90vh] bg-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            buttonStyle="ghost"
            shadow="none"
            onClick={onClose}
            className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors z-20"
            icon={<X className="w-8 h-8" />}
          >
            {""}
          </Button>

          <div className="relative h-full">
            <Button
              aria-label="Previous image"
              variant="ghost"
              buttonStyle="ghost"
              shadow="none"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-4 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors z-10"
              onClick={prevSlide}
              icon={<ChevronLeft className="w-8 h-8" />}
            >
              {""}
            </Button>

            <div className="flex flex-col items-center justify-center h-full">
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
                <div className="max-h-[70vh] w-full flex items-center justify-center">
                  <video
                    src={currentMedia.file_path}
                    controls
                    autoPlay
                    className="max-h-[70vh] max-w-full rounded-lg"
                  />
                </div>
              )}

              <div className="mt-6 text-white text-center max-w-2xl">
                <h3 className="text-lg font-semibold mb-2">
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

            <Button
              aria-label="Next image"
              variant="ghost"
              buttonStyle="ghost"
              shadow="none"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-4 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors z-10"
              onClick={nextSlide}
              icon={<ChevronRight className="w-8 h-8" />}
            >
              {""}
            </Button>
          </div>

          {/* Miniaturas en la parte inferior */}
          {mediaFiles.length > 1 && (
            <div className="flex justify-center gap-2 mt-8 overflow-x-auto py-2">
              {mediaFiles.map((media, idx) => (
                <Button
                  key={media.id}
                  variant="ghost"
                  buttonStyle="ghost"
                  shadow="none"
                  className={`flex-shrink-0 w-20 h-20 min-w-0 p-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    idx === selectedIndex
                      ? "border-blue-500 dark:border-blue-400 scale-105"
                      : "border-transparent hover:border-gray-400"
                  }`}
                  onClick={() => setSelectedIndex(idx)}
                >
                  <img
                    src={media.file_path}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1579546929662-711aa81148cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80";
                    }}
                  />
                </Button>
              ))}
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
