import ContentTypeIconSelector, { ContentType } from "./ContentTypeIconSelector";
import { AlertCircle } from "lucide-react";
import { useMemo } from "react";

interface ContentTypeSelectorBarProps {
  selectedType: ContentType;
  selectedPlatforms: string[];
  onChange: (type: ContentType) => void;
  t: (key: string) => string;
  disabled?: boolean;
  mediaFiles?: Array<{ mime_type?: string; type?: string }>;
}

// Content type validation rules (mirroring backend config/content_types.php)
const CONTENT_TYPE_RULES: Record<ContentType, {
  platforms: string[];
  media: { required: boolean; min_count: number; max_count: number; types: string[] };
}> = {
  post: {
    platforms: ['instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'pinterest'],
    media: { required: false, min_count: 0, max_count: 10, types: ['image', 'video'] },
  },
  reel: {
    platforms: ['instagram', 'tiktok', 'youtube', 'facebook'],
    media: { required: true, min_count: 1, max_count: 1, types: ['video'] },
  },
  story: {
    platforms: ['instagram', 'facebook'],
    media: { required: true, min_count: 1, max_count: 1, types: ['image', 'video'] },
  },
  carousel: {
    platforms: ['instagram', 'facebook', 'linkedin'],
    media: { required: true, min_count: 2, max_count: 10, types: ['image', 'video'] },
  },
  poll: {
    platforms: ['twitter'],
    media: { required: false, min_count: 0, max_count: 4, types: ['image', 'video'] },
  },
};

/**
 * Validates if a content type is supported by all selected platforms
 */
function validateContentTypePlatforms(
  contentType: ContentType,
  platforms: string[]
): { isValid: boolean; unsupportedPlatforms: string[] } {
  if (!platforms || platforms.length === 0) {
    return { isValid: true, unsupportedPlatforms: [] };
  }

  const rules = CONTENT_TYPE_RULES[contentType];
  const unsupportedPlatforms = platforms.filter(
    (platform) => !rules.platforms.includes(platform.toLowerCase())
  );

  return {
    isValid: unsupportedPlatforms.length === 0,
    unsupportedPlatforms,
  };
}

/**
 * Validates media files against content type requirements
 */
function validateMediaFiles(
  contentType: ContentType,
  mediaFiles?: Array<{ mime_type?: string; type?: string }>
): { isValid: boolean; error: string | null } {
  const rules = CONTENT_TYPE_RULES[contentType];
  const fileCount = mediaFiles?.length || 0;

  // Check file count
  if (rules.media.required && fileCount === 0) {
    return { isValid: false, error: 'media_required' };
  }

  if (fileCount < rules.media.min_count) {
    return { isValid: false, error: 'media_min_count' };
  }

  if (fileCount > rules.media.max_count) {
    return { isValid: false, error: 'media_max_count' };
  }

  // Check media types
  if (mediaFiles && mediaFiles.length > 0) {
    const hasVideo = mediaFiles.some((file) => {
      const mimeType = file.mime_type || file.type || '';
      return mimeType.startsWith('video/');
    });

    const hasImage = mediaFiles.some((file) => {
      const mimeType = file.mime_type || file.type || '';
      return mimeType.startsWith('image/');
    });

    // Reel requires video only
    if (contentType === 'reel' && !hasVideo) {
      return { isValid: false, error: 'reel_requires_video' };
    }

    if (contentType === 'reel' && hasImage) {
      return { isValid: false, error: 'reel_video_only' };
    }
  }

  return { isValid: true, error: null };
}

/**
 * Barra compacta de selección de tipo de contenido
 * Muestra el label, el selector de iconos y el mensaje de filtrado
 * Diseñado para usarse justo después del ModalHeader
 */
export default function ContentTypeSelectorBar({
  selectedType,
  selectedPlatforms,
  onChange,
  t,
  disabled = false,
  mediaFiles,
}: ContentTypeSelectorBarProps) {
  // Validate current selection
  const validation = useMemo(() => {
    const platformValidation = validateContentTypePlatforms(selectedType, selectedPlatforms);
    const mediaValidation = validateMediaFiles(selectedType, mediaFiles);

    return {
      platformValidation,
      mediaValidation,
      hasWarnings: !platformValidation.isValid || !mediaValidation.isValid,
    };
  }, [selectedType, selectedPlatforms, mediaFiles]);

  // Get warning message
  const warningMessage = useMemo(() => {
    if (!validation.hasWarnings) return null;

    const { platformValidation, mediaValidation } = validation;

    // Platform incompatibility warning
    if (!platformValidation.isValid) {
      const unsupported = platformValidation.unsupportedPlatforms
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(', ');
      return t('publications.validation.content_type_not_supported')
        .replace(':type', selectedType)
        .replace(':platforms', unsupported);
    }

    // Media validation warnings
    if (mediaValidation.error) {
      const rules = CONTENT_TYPE_RULES[selectedType];
      
      switch (mediaValidation.error) {
        case 'media_required':
          return t('publications.validation.media_required');
        case 'media_min_count':
          if (selectedType === 'reel') {
            return t('publications.validation.reel_requires_one_video');
          }
          if (selectedType === 'carousel') {
            return t('publications.validation.carousel_requires_multiple');
          }
          if (selectedType === 'story') {
            return t('publications.validation.story_requires_one');
          }
          return t('publications.validation.media_min_count')
            .replace(':min', rules.media.min_count.toString());
        case 'media_max_count':
          return t('publications.validation.media_max_count')
            .replace(':max', rules.media.max_count.toString());
        case 'reel_requires_video':
        case 'reel_video_only':
          return t('publications.validation.reel_requires_video_only');
        default:
          return null;
      }
    }

    return null;
  }, [validation, selectedType, t]);

  return (
    <div className="px-6 pt-4 pb-2 border-b border-gray-200 dark:border-neutral-700">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-3">
            <ContentTypeIconSelector
              selectedType={selectedType}
              selectedPlatforms={selectedPlatforms}
              onChange={onChange}
              t={t}
              disabled={disabled}
            />
          </div>
          {selectedPlatforms.length > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">
              {t("publications.modal.contentType.filteredByPlatforms") || 
                "Filtered by selected platforms"}
            </span>
          )}
        </div>

        {/* Validation Warning */}
        {validation.hasWarnings && warningMessage && (
          <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              {warningMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
