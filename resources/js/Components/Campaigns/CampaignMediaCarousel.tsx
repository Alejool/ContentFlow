import { Dialog, DialogPanel } from "@headlessui/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/Hooks/useTheme";

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

  const slidesToShow =
    window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex + slidesToShow >= mediaFiles.length ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? mediaFiles.length - 1 : prevIndex - 1
    );
  };

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const nextLightboxSlide = () => {
    setSelectedIndex((prev) => (prev === mediaFiles.length - 1 ? 0 : prev + 1));
  };

  const prevLightboxSlide = () => {
    setSelectedIndex((prev) => (prev === 0 ? mediaFiles.length - 1 : prev - 1));
  };

  const visibleSlides = mediaFiles.slice(
    currentIndex,
    currentIndex + slidesToShow
  );

  if (mediaFiles.length === 0) return null;

  return (
    <>
      {/* Carrusel Principal */}
      <div className="relative w-full mb-6">
        <div className="flex gap-4 overflow-hidden relative min-h-[250px] items-center">
          {visibleSlides.map((media, index) => (
            <div
              key={media.id}
              className={`transition-all duration-300 ease-in-out cursor-pointer hover:scale-105 ${
                slidesToShow > 1 ? "" : "mx-auto"
              }`}
              style={{ flex: `0 0 calc(${100 / slidesToShow}% - 16px)` }}
              onClick={() => openLightbox(currentIndex + index)}
            >
              {media.file_type.startsWith("image") ? (
                <img
                  src={media.file_path}
                  alt={media.file_name || `Media ${index + 1}`}
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/400x250?text=Loading...";
                  }}
                  loading="lazy"
                />
              ) : (
                <div className="relative w-full h-64 rounded-lg bg-gray-800 dark:bg-gray-900 flex items-center justify-center">
                  <video
                    src={media.file_path}
                    className="w-full h-full object-cover rounded-lg"
                    controls
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs">
                    VIDEO
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Controles de Navegación */}
        {mediaFiles.length > slidesToShow && (
          <>
            <button
              aria-label="Previous slide"
              className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-gray-700 shadow-lg z-10 hover:bg-white dark:hover:bg-gray-600 transition-colors"
              onClick={prevSlide}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              aria-label="Next slide"
              className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-gray-700 shadow-lg z-10 hover:bg-white dark:hover:bg-gray-600 transition-colors"
              onClick={nextSlide}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Indicadores de Puntos */}
        {mediaFiles.length > 1 && (
          <div className="flex justify-center mt-4 gap-2">
            {Array.from({
              length: Math.ceil(mediaFiles.length / slidesToShow),
            }).map((_, idx) => (
              <button
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === Math.floor(currentIndex / slidesToShow)
                    ? "bg-blue-500 dark:bg-blue-400"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                onClick={() => setCurrentIndex(idx * slidesToShow)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal con Headless UI */}
      <Dialog
        open={isLightboxOpen}
        onClose={closeLightbox}
        className="relative z-[100]"
      >
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm"
          aria-hidden="true"
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="relative w-full max-w-6xl max-h-[90vh]">
            <button
              onClick={closeLightbox}
              className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 transition-colors z-20"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative h-full">
              <button
                aria-label="Previous image"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-10"
                onClick={prevLightboxSlide}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {mediaFiles[selectedIndex].file_type.startsWith("image") ? (
                <img
                  src={mediaFiles[selectedIndex].file_path}
                  alt={`Media ${selectedIndex + 1}`}
                  className="max-h-[80vh] w-auto mx-auto rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/800x600?text=Loading...";
                  }}
                />
              ) : (
                <div className="max-h-[80vh] w-full flex items-center justify-center">
                  <video
                    src={mediaFiles[selectedIndex].file_path}
                    controls
                    autoPlay
                    className="max-h-[80vh] max-w-full rounded-lg"
                  />
                </div>
              )}

              <button
                aria-label="Next image"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-10"
                onClick={nextLightboxSlide}
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Contador */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {selectedIndex + 1} / {mediaFiles.length}
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
