import type { ContentType } from '@/Constants/contentTypes';
import { CONTENT_TYPE_CONFIG } from '@/Constants/contentTypes';
import { AlertCircle } from 'lucide-react';
import { useMemo } from 'react';
import ContentTypeIconSelector from './ContentTypeIconSelector';

interface ContentTypeSelectorBarProps {
  selectedType: ContentType;
  selectedPlatforms: string[];
  onChange: (type: ContentType) => void;
  t: (key: string) => string;
  disabled?: boolean;
  mediaFiles?: Array<{ mime_type?: string; type?: string }>;
}

/**
 * Validates if a content type is supported by all selected platforms
 */
function validateContentTypePlatforms(
  contentType: ContentType,
  platforms: string[],
): { isValid: boolean; unsupportedPlatforms: string[] } {
  if (!platforms || platforms.length === 0) {
    return { isValid: true, unsupportedPlatforms: [] };
  }

  const rules = CONTENT_TYPE_CONFIG[contentType];
  const unsupportedPlatforms = platforms.filter(
    (platform) => !(rules.platforms as readonly string[]).includes(platform.toLowerCase()),
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
  mediaFiles?: Array<{ mime_type?: string; type?: string }>,
): { isValid: boolean; error: string | null } {
  const rules = CONTENT_TYPE_CONFIG[contentType];
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

  // Warning message computed but used only for future display
  const _warningMessage = useMemo(() => {
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
      const rules = CONTENT_TYPE_CONFIG[selectedType];

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
          return t('publications.validation.media_min_count').replace(
            ':min',
            rules.media.min_count.toString(),
          );
        case 'media_max_count':
          return t('publications.validation.media_max_count').replace(
            ':max',
            rules.media.max_count.toString(),
          );
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
    <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50/80 px-6 pb-2 pt-4 dark:border-neutral-700 dark:from-neutral-900 dark:via-neutral-900/95 dark:to-neutral-800/90">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-3">
            <ContentTypeIconSelector
              selectedType={selectedType}
              selectedPlatforms={selectedPlatforms}
              onChange={onChange}
              t={t}
              disabled={disabled}
              mediaFiles={mediaFiles}
            />
          </div>
        </div>

        {/* Lock message when media is uploaded */}
        {mediaFiles && mediaFiles.length > 0 && (
          <div className="flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>
              {t('publications.modal.contentType.locked') ||
                'Content type is locked after uploading media'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
