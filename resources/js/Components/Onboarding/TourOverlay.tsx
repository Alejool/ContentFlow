import { useEffect, useState, useRef, useCallback } from "react";
import { X, ChevronRight, SkipForward } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "@/Components/common/Modern/Button";
import type { TourStep } from "@/types/onboarding";

interface TourOverlayProps {
  currentStep: TourStep;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

interface Position {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * TourOverlay displays the guided tour with step-by-step highlights and explanations.
 * 
 * Features:
 * - Spotlight effect for target elements
 * - Explanation card with title and description
 * - Next, Skip, and Complete buttons
 * - Keyboard navigation (Arrow keys, Escape)
 * - Responsive positioning logic
 */
export default function TourOverlay({
  currentStep,
  totalSteps,
  onNext,
  onSkip,
  onComplete,
}: TourOverlayProps) {
  const { t } = useTranslation();
  const [targetPosition, setTargetPosition] = useState<Position | null>(null);
  const [cardPosition, setCardPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const isLastStep = currentStep.id === `step-${totalSteps}` || totalSteps === 1;

  // Calculate target element position
  const calculateTargetPosition = useCallback(() => {
    const targetElement = document.querySelector(currentStep.targetSelector);
    if (!targetElement) {
      console.warn(`Target element not found: ${currentStep.targetSelector}`);
      return null;
    }

    const rect = targetElement.getBoundingClientRect();
    const padding = currentStep.highlightPadding || 8;

    return {
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    };
  }, [currentStep]);

  // Calculate explanation card position relative to target
  const calculateCardPosition = useCallback((targetPos: Position) => {
    if (!cardRef.current) return { top: 0, left: 0 };

    const cardRect = cardRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spacing = 16;
    const isMobile = viewportWidth < 768;

    let top = 0;
    let left = 0;

    // Mobile responsive: always position card at bottom on small screens (Requirement 7.1, 7.2)
    if (isMobile) {
      top = viewportHeight - cardRect.height - spacing;
      left = spacing;
      return { top, left };
    }

    // Desktop: Determine position based on currentStep.position and available space
    switch (currentStep.position) {
      case "top":
        top = targetPos.top - cardRect.height - spacing;
        left = targetPos.left + targetPos.width / 2 - cardRect.width / 2;
        break;
      case "bottom":
        top = targetPos.top + targetPos.height + spacing;
        left = targetPos.left + targetPos.width / 2 - cardRect.width / 2;
        break;
      case "left":
        top = targetPos.top + targetPos.height / 2 - cardRect.height / 2;
        left = targetPos.left - cardRect.width - spacing;
        break;
      case "right":
        top = targetPos.top + targetPos.height / 2 - cardRect.height / 2;
        left = targetPos.left + targetPos.width + spacing;
        break;
    }

    // Adjust for viewport boundaries
    if (left < spacing) left = spacing;
    if (left + cardRect.width > viewportWidth - spacing) {
      left = viewportWidth - cardRect.width - spacing;
    }
    if (top < spacing) top = spacing;
    if (top + cardRect.height > viewportHeight - spacing) {
      top = viewportHeight - cardRect.height - spacing;
    }

    return { top, left };
  }, [currentStep.position]);

  // Update positions on mount and when step changes
  useEffect(() => {
    const updatePositions = () => {
      const targetPos = calculateTargetPosition();
      if (targetPos) {
        setTargetPosition(targetPos);
        // Wait for card to render before calculating its position
        setTimeout(() => {
          const cardPos = calculateCardPosition(targetPos);
          setCardPosition(cardPos);
        }, 0);
      }
    };

    updatePositions();

    // Update on window resize
    window.addEventListener("resize", updatePositions);
    window.addEventListener("scroll", updatePositions);

    return () => {
      window.removeEventListener("resize", updatePositions);
      window.removeEventListener("scroll", updatePositions);
    };
  }, [currentStep, calculateTargetPosition, calculateCardPosition]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "Enter":
          e.preventDefault();
          if (isLastStep) {
            onComplete();
          } else {
            onNext();
          }
          break;
        case "Escape":
          e.preventDefault();
          onSkip();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLastStep, onNext, onSkip, onComplete]);

  if (!targetPosition) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-description">
      {/* Backdrop with spotlight effect */}
      <div className="absolute inset-0 bg-black/60 transition-opacity duration-300" aria-hidden="true">
        {/* Spotlight cutout using box-shadow */}
        <div
          className="absolute transition-all duration-300"
          style={{
            top: `${targetPosition.top}px`,
            left: `${targetPosition.left}px`,
            width: `${targetPosition.width}px`,
            height: `${targetPosition.height}px`,
            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.6)`,
            borderRadius: "8px",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Explanation card - Responsive layout (Requirement 7.1, 7.2) */}
      <div
        ref={cardRef}
        className="absolute bg-white dark:bg-neutral-800 rounded-lg shadow-2xl 
                   transition-all duration-300 w-full md:w-auto md:max-w-md"
        style={{
          top: `${cardPosition.top}px`,
          left: `${cardPosition.left}px`,
          right: window.innerWidth < 768 ? "16px" : "auto",
          maxWidth: window.innerWidth < 768 ? `calc(100vw - 32px)` : "28rem",
        }}
        role="document"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 id="tour-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentStep.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1" aria-label={t('onboarding.tour.step', { current: currentStep.id.split("-")[1] || 1, total: totalSteps })}>
                {t('onboarding.tour.step', { current: currentStep.id.split("-")[1] || 1, total: totalSteps })}
              </p>
            </div>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                       transition-colors p-2 rounded-md hover:bg-gray-100 
                       dark:hover:bg-neutral-700 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label={t('onboarding.tour.close')}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p id="tour-description" className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Footer with actions - Responsive layout (Requirement 7.1) */}
        <div className="px-4 md:px-6 py-4 bg-gray-50 dark:bg-neutral-900/50 
                       border-t border-gray-200 dark:border-neutral-700 
                       rounded-b-lg">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Progress indicator */}
            <div className="flex gap-1.5 justify-center md:justify-start" role="progressbar" aria-valuenow={parseInt(currentStep.id.split("-")[1] || "1")} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={t('onboarding.tour.progress')}>
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index < parseInt(currentStep.id.split("-")[1] || "1")
                      ? "w-8 bg-primary-600"
                      : "w-1.5 bg-gray-300 dark:bg-neutral-600"
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>

            {/* Action buttons - Stack on mobile */}
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto" role="group" aria-label={t('onboarding.tour.title')}>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                icon={SkipForward}
                iconPosition="left"
                className="text-gray-600 dark:text-gray-400 w-full md:w-auto justify-center"
                aria-label={t('onboarding.tour.skipGuidedTour')}
              >
                {t('onboarding.tour.skipTour')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={isLastStep ? onComplete : onNext}
                icon={ChevronRight}
                iconPosition="right"
                className="w-full md:w-auto justify-center"
                aria-label={isLastStep ? t('onboarding.tour.completeTour') : t('onboarding.tour.nextStep')}
              >
                {isLastStep ? t('onboarding.tour.complete') : t('onboarding.tour.next')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
