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

  // Category-specific colors
  const categoryColors = {
    promotional: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
    educational: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
    engagement: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
  };

  const categoryBorderColors = {
    promotional: 'border-purple-200 dark:border-purple-700',
    educational: 'border-blue-200 dark:border-blue-700',
    engagement: 'border-green-200 dark:border-green-700',
  };

  const categoryBadgeColors = {
    promotional: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
    educational: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    engagement: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
  };

  const bgGradient = categoryColors[template.category as keyof typeof categoryColors] || 'from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-800';
  const borderColor = categoryBorderColors[template.category as keyof typeof categoryBorderColors] || 'border-gray-200 dark:border-neutral-700';
  const badgeColor = categoryBadgeColors[template.category as keyof typeof categoryBadgeColors] || 'bg-white/90 dark:bg-neutral-800/90 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-neutral-600';

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
      className={`group relative bg-white dark:bg-neutral-800 rounded-lg border ${borderColor} overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleSelect}
    >
      {/* Preview Image or Generated Preview */}
      <div className={`relative aspect-video bg-gradient-to-br ${bgGradient} overflow-hidden`}>
        {/* Generated Content Preview */}
        <div className="absolute inset-0 p-6 flex flex-col justify-center">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-4 max-h-full overflow-hidden">
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-6 whitespace-pre-wrap">
              {template.content.text}
            </p>
            {template.content.hashtags && template.content.hashtags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {template.content.hashtags.slice(0, 4).map((hashtag, index) => (
                  <span
                    key={index}
                    className="text-xs text-primary-600 dark:text-primary-400"
                  >
                    {hashtag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 backdrop-blur-sm text-xs font-medium rounded-full border ${badgeColor}`}>
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
            aria-label={t('templates.select', { name: template.name })}
          >
            {isSelecting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('templates.selecting')}
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                {t('templates.useTemplate')}
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
