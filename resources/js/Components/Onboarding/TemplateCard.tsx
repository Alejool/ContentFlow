import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PublicationTemplate } from "@/types/onboarding";
import { Check } from "lucide-react";

interface TemplateCardProps {
  template: PublicationTemplate;
  onSelect: (templateId: string) => void;
}

/**
 * TemplateCard displays a single publication template with preview.
 * 
 * Features:
 * - Display preview image and description
 * - Hover preview effect
 * - Select button
 * - Lazy loading for images with loading placeholder
 */
export default function TemplateCard({
  template,
  onSelect,
}: TemplateCardProps) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleSelect = async () => {
    setIsSelecting(true);
    try {
      await onSelect(template.id);
    } catch (error) {
      console.error("Failed to select template:", error);
      setIsSelecting(false);
    }
  };

  return (
    <div
      className="group relative bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleSelect}
    >
      {/* Preview Image */}
      <div className="relative aspect-video bg-gray-100 dark:bg-neutral-900 overflow-hidden">
        {template.previewImage && !imageError ? (
          <>
            {/* Loading Placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-neutral-900">
                <div className="w-12 h-12 border-4 border-gray-200 dark:border-neutral-700 border-t-primary-600 rounded-full animate-spin" />
              </div>
            )}
            
            {/* Lazy-loaded Image */}
            <img
              src={template.previewImage}
              alt={template.name}
              loading="lazy"
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-gray-300 dark:text-neutral-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm text-xs font-medium text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-neutral-600">
            {t(`onboarding.templates.categories.${template.category}`, template.category.charAt(0).toUpperCase() + template.category.slice(1))}
          </span>
        </div>

        {/* Hover Overlay */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={handleSelect}
            disabled={isSelecting}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            aria-label={t('onboarding.templates.select', { name: template.name })}
          >
            {isSelecting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('onboarding.templates.selecting')}
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                {t('onboarding.templates.useTemplate')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Template Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
          {template.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {template.description}
        </p>

        {/* Template Content Preview */}
        {template.content.hashtags && template.content.hashtags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {template.content.hashtags.slice(0, 3).map((hashtag, index) => (
              <span
                key={index}
                className="text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded"
              >
                {hashtag}
              </span>
            ))}
            {template.content.hashtags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                +{template.content.hashtags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Border Accent on Hover */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600 transition-transform duration-300 ${
          isHovered ? "scale-x-100" : "scale-x-0"
        }`}
      />
    </div>
  );
}
