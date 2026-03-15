import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/Components/common/Modern/Button";

interface CarouselPaginationProps {
  currentSlide: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

export function CarouselPagination({
  currentSlide,
  totalSlides,
  onPrevious,
  onNext,
  className = "",
}: CarouselPaginationProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        onClick={onPrevious}
        variant="ghost"
        buttonStyle="icon"
        size="sm"
        className="!p-2"
        aria-label="Anterior"
        animation="scale"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <span className="min-w-[60px] text-center text-sm text-gray-600 dark:text-gray-400">
        {currentSlide + 1} / {totalSlides}
      </span>
      <Button
        onClick={onNext}
        variant="ghost"
        buttonStyle="icon"
        size="sm"
        className="!p-2"
        aria-label="Siguiente"
        animation="scale"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}

interface CarouselDotsProps {
  totalSlides: number;
  currentSlide: number;
  onDotClick: (index: number) => void;
  className?: string;
}

export function CarouselDots({
  totalSlides,
  currentSlide,
  onDotClick,
  className = "",
}: CarouselDotsProps) {
  return (
    <div className={`flex justify-center gap-2 ${className}`}>
      {Array.from({ length: totalSlides }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={`h-2 rounded-full transition-all ${
            currentSlide === index ? "w-6 bg-primary-600" : "w-2 bg-gray-300 dark:bg-gray-600"
          }`}
          aria-label={`Ir a slide ${index + 1}`}
        />
      ))}
    </div>
  );
}
