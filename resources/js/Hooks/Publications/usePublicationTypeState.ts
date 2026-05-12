import type { ContentType } from '@/Constants/contentTypes';
import type { Publication } from '@/types/Publication';
import { useCallback, useRef, useState } from 'react';

interface TypeSpecificState {
  selectedPlatforms: number[];
  platformSettings: Record<string, any>;
  youtubeThumbnails: Record<number, File | null>;
}

interface UsePublicationTypeStateReturn {
  getCurrentTypeState: (type: ContentType) => TypeSpecificState;
  updateTypeState: (type: ContentType, updates: Partial<TypeSpecificState>) => void;
  clearIncompatibleData: (newType: ContentType, connectedAccounts: any[]) => void;
  getCompatiblePlatforms: (type: ContentType, connectedAccounts: any[]) => any[];
  isValidForSave: (
    publication: Publication,
    typeState: TypeSpecificState,
  ) => { valid: boolean; errors: string[] };
  resetAllStates: () => void;
}

/**
 * Hook para manejar estado independiente por tipo de publicación
 * Resuelve el problema de datos inconsistentes al cambiar tipos
 */
export const usePublicationTypeState = (): UsePublicationTypeStateReturn => {
  // Estado temporal por tipo de contenido (solo en frontend)
  const stateByType = useRef<Record<ContentType, TypeSpecificState>>({
    post: {
      selectedPlatforms: [],
      platformSettings: {},
      youtubeThumbnails: {},
    },
    reel: {
      selectedPlatforms: [],
      platformSettings: {},
      youtubeThumbnails: {},
    },
    story: {
      selectedPlatforms: [],
      platformSettings: {},
      youtubeThumbnails: {},
    },
    poll: {
      selectedPlatforms: [],
      platformSettings: {},
      youtubeThumbnails: {},
    },
    carousel: {
      selectedPlatforms: [],
      platformSettings: {},
      youtubeThumbnails: {},
    },
  });

  const [, forceUpdate] = useState(0);

  const getCurrentTypeState = useCallback((type: ContentType): TypeSpecificState => {
    return stateByType.current[type];
  }, []);

  const updateTypeState = useCallback((type: ContentType, updates: Partial<TypeSpecificState>) => {
    stateByType.current[type] = {
      ...stateByType.current[type],
      ...updates,
    };
    forceUpdate((prev) => prev + 1);
  }, []);

  const getCompatiblePlatforms = useCallback((type: ContentType, connectedAccounts: any[]) => {
    const compatiblePlatformNames = CONTENT_TYPE_CONFIG[type].platforms;
    return connectedAccounts.filter((account) =>
      (compatiblePlatformNames as readonly string[]).includes(account.platform.toLowerCase()),
    );
  }, []);

  const clearIncompatibleData = useCallback(
    (newType: ContentType, connectedAccounts: any[]) => {
      const compatibleAccounts = getCompatiblePlatforms(newType, connectedAccounts);
      const compatibleAccountIds = new Set(compatibleAccounts.map((acc) => acc.id));

      const currentState = stateByType.current[newType];

      // Filtrar plataformas seleccionadas para mantener solo las compatibles
      const filteredPlatforms = currentState.selectedPlatforms.filter((id) =>
        compatibleAccountIds.has(id),
      );

      // Filtrar configuraciones de plataforma para mantener solo las compatibles
      const compatiblePlatformNames = new Set(
        compatibleAccounts.map((acc) => acc.platform.toLowerCase()),
      );

      const filteredSettings: Record<string, any> = {};
      Object.entries(currentState.platformSettings).forEach(([platform, settings]) => {
        if (compatiblePlatformNames.has(platform.toLowerCase())) {
          filteredSettings[platform] = settings;
        }
      });

      // Actualizar estado del tipo actual
      stateByType.current[newType] = {
        ...currentState,
        selectedPlatforms: filteredPlatforms,
        platformSettings: filteredSettings,
      };

      forceUpdate((prev) => prev + 1);
    },
    [getCompatiblePlatforms],
  );

  const isValidForSave = useCallback(
    (
      publication: Publication,
      typeState: TypeSpecificState,
    ): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];
      const type = publication.content_type || 'post';

      // Validaciones por tipo
      switch (type) {
        case 'poll':
          if (!publication.poll_options || publication.poll_options.length < 2) {
            errors.push('Poll must have at least 2 options');
          }
          if (!publication.poll_duration_hours || publication.poll_duration_hours < 1) {
            errors.push('Poll duration must be at least 1 hour');
          }
          // Polls no requieren media
          break;

        case 'story':
          if (!publication.media_files || publication.media_files.length === 0) {
            errors.push('Story requires at least 1 media file');
          }
          if (publication.media_files && publication.media_files.length > 1) {
            errors.push('Story can only have 1 media file');
          }
          break;

        case 'reel':
          if (!publication.media_files || publication.media_files.length === 0) {
            errors.push('Reel requires 1 video file');
          }
          const videoFiles = publication.media_files?.filter((m) => m.file_type === 'video') || [];
          if (videoFiles.length !== 1) {
            errors.push('Reel must have exactly 1 video file');
          }
          break;

        case 'carousel':
          if (!publication.media_files || publication.media_files.length < 2) {
            errors.push('Carousel requires at least 2 media files');
          }
          if (publication.media_files && publication.media_files.length > 10) {
            errors.push('Carousel can have maximum 10 media files');
          }
          break;

        case 'post':
          // Post es flexible, no requiere validaciones específicas
          break;
      }

      // Validar que hay plataformas seleccionadas
      if (typeState.selectedPlatforms.length === 0) {
        errors.push('At least one platform must be selected');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },
    [],
  );

  const resetAllStates = useCallback(() => {
    stateByType.current = {
      post: {
        selectedPlatforms: [],
        platformSettings: {},
        youtubeThumbnails: {},
      },
      reel: {
        selectedPlatforms: [],
        platformSettings: {},
        youtubeThumbnails: {},
      },
      story: {
        selectedPlatforms: [],
        platformSettings: {},
        youtubeThumbnails: {},
      },
      poll: {
        selectedPlatforms: [],
        platformSettings: {},
        youtubeThumbnails: {},
      },
      carousel: {
        selectedPlatforms: [],
        platformSettings: {},
        youtubeThumbnails: {},
      },
    };
    forceUpdate((prev) => prev + 1);
  }, []);

  return {
    getCurrentTypeState,
    updateTypeState,
    clearIncompatibleData,
    getCompatiblePlatforms,
    isValidForSave,
    resetAllStates,
  };
};
