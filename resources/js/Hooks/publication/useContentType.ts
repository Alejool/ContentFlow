import { ContentType } from "@/Components/Content/Publication/common/ContentTypeIconSelector";
import { useMemo } from "react";

interface ContentTypeConfig {
  requiresVideo: boolean;
  requiresImage: boolean;
  allowsMultipleMedia: boolean;
  maxMediaCount: number;
  descriptionMaxLength: number;
  titleRequired: boolean;
  descriptionRequired: boolean;
  hashtagsRequired: boolean;
  goalRequired: boolean;
  showMediaSection: boolean;
  showTitle: boolean;
  showDescription: boolean;
  showGoal: boolean;
  showHashtags: boolean;
  showPollFields: boolean;
}

const contentTypeConfigs: Record<ContentType, ContentTypeConfig> = {
  post: {
    requiresVideo: false,
    requiresImage: false,
    allowsMultipleMedia: true,
    maxMediaCount: 10,
    descriptionMaxLength: 700,
    titleRequired: true,
    descriptionRequired: true,
    hashtagsRequired: true,
    goalRequired: true,
    showMediaSection: true,
    showTitle: true,
    showDescription: true,
    showGoal: true,
    showHashtags: true,
    showPollFields: false,
  },
  reel: {
    requiresVideo: true,
    requiresImage: false,
    allowsMultipleMedia: false,
    maxMediaCount: 1,
    descriptionMaxLength: 300,
    titleRequired: true,
    descriptionRequired: true,
    hashtagsRequired: true,
    goalRequired: false,
    showMediaSection: true,
    showTitle: true,
    showDescription: true,
    showGoal: false,
    showHashtags: true,
    showPollFields: false,
  },
  story: {
    requiresVideo: false,
    requiresImage: false, // Story puede ser imagen o video
    allowsMultipleMedia: false,
    maxMediaCount: 1,
    descriptionMaxLength: 150,
    titleRequired: false,
    descriptionRequired: false,
    hashtagsRequired: false,
    goalRequired: false,
    showMediaSection: true,
    showTitle: false,
    showDescription: true,
    showGoal: false,
    showHashtags: false,
    showPollFields: false,
  },
  poll: {
    requiresVideo: false,
    requiresImage: false,
    allowsMultipleMedia: false,
    maxMediaCount: 0, // Las encuestas NO permiten archivos
    descriptionMaxLength: 280,
    titleRequired: true,
    descriptionRequired: true,
    hashtagsRequired: false, // ✅ Hashtags NO requeridos para polls
    goalRequired: false,
    showMediaSection: false,
    showTitle: true,
    showDescription: true,
    showGoal: false,
    showHashtags: false, // ✅ NUNCA mostrar hashtags para polls
    showPollFields: true,
  },
  carousel: {
    requiresVideo: false,
    requiresImage: true,
    allowsMultipleMedia: true,
    maxMediaCount: 10,
    descriptionMaxLength: 500,
    titleRequired: true,
    descriptionRequired: true,
    hashtagsRequired: true,
    goalRequired: true,
    showMediaSection: true,
    showTitle: true,
    showDescription: true,
    showGoal: true,
    showHashtags: true,
    showPollFields: false,
  },
};

export function useContentType(contentType: ContentType = "post") {
  const config = useMemo(() => contentTypeConfigs[contentType], [contentType]);

  const getFieldVisibility = useMemo(
    () => ({
      showTitle: config.showTitle,
      showDescription: config.showDescription,
      showGoal: config.showGoal,
      showHashtags: config.showHashtags,
      showPollFields: config.showPollFields,
      showMediaSection: config.showMediaSection,
    }),
    [contentType, config],
  );

  const validateMedia = (mediaFiles: any[]) => {
    const errors: string[] = [];

    // Validar que no se permitan archivos si maxMediaCount es 0 (ej: poll)
    if (config.maxMediaCount === 0 && mediaFiles.length > 0) {
      errors.push("This content type does not allow media files");
      return errors;
    }

    // Validar tipo de archivo requerido
    if (config.requiresVideo) {
      const hasVideo = mediaFiles.some((m) => m.type?.startsWith("video/"));
      if (!hasVideo) {
        errors.push("This content type requires a video file");
      }
      // Reel solo permite videos
      const hasNonVideo = mediaFiles.some((m) => !m.type?.startsWith("video/"));
      if (hasNonVideo) {
        errors.push("Reels only accept video files");
      }
    }

    if (config.requiresImage) {
      const hasImage = mediaFiles.some((m) => m.type?.startsWith("image/"));
      if (!hasImage) {
        errors.push("This content type requires at least one image");
      }
      // Carousel solo permite imágenes
      const hasNonImage = mediaFiles.some((m) => !m.type?.startsWith("image/"));
      if (hasNonImage) {
        errors.push("Carousels only accept image files");
      }
    }

    // Validar cantidad de archivos
    if (!config.allowsMultipleMedia && mediaFiles.length > 1) {
      errors.push(
        `This content type only allows ${config.maxMediaCount} media file`,
      );
    }

    if (mediaFiles.length > config.maxMediaCount) {
      errors.push(`Maximum ${config.maxMediaCount} media files allowed`);
    }

    // Story: solo 1 archivo (imagen o video)
    if (contentType === "story" && mediaFiles.length > 1) {
      errors.push("Stories only allow 1 media file (image or video)");
    }

    return errors;
  };

  return {
    config,
    fieldVisibility: getFieldVisibility,
    validateMedia,
  };
}
