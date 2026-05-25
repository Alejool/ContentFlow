/**
 * FASE 6: Frontend - React Hook para Validación
 * 
 * Para proyectos con React en lugar de Vue.
 */

import { useState, useCallback, useMemo } from 'react';
import { usePlatformConfigurationApi } from '@/services/PlatformConfigurationApiService';
import type {
  ValidationResult,
  ValidationSummary,
} from '@/types/PlatformConfiguration';

interface UseContentValidationOptions {
  publicationId?: number;
  platforms?: string[];
  userPlan?: string;
  autoValidate?: boolean;
}

export function useContentValidation(options: UseContentValidationOptions = {}) {
  const api = usePlatformConfigurationApi();

  const [publicationId, setPublicationId] = useState(options.publicationId || 0);
  const [selectedPlatforms, setSelectedPlatforms] = useState(
    options.platforms || []
  );
  const [userPlan, setUserPlan] = useState(options.userPlan || 'free');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult>({});
  const [validationSummary, setValidationSummary] = useState<ValidationSummary>({
    can_publish_to_any: false,
    compatible_count: 0,
    incompatible_count: 0,
    compatible_platforms: [],
    incompatible_platforms: [],
    warnings: {},
  });

  /**
   * Valida el contenido
   */
  const validate = useCallback(async () => {
    if (!publicationId || selectedPlatforms.length === 0) {
      setValidationError('Please select at least one platform');
      return false;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const response = await api.validateContent(
        publicationId,
        selectedPlatforms,
        userPlan
      );

      setValidationResult(response.details);
      setValidationSummary({
        can_publish_to_any: response.can_publish_to_any,
        compatible_count: response.compatible_count,
        incompatible_count: response.incompatible_count,
        compatible_platforms: response.compatible_platforms,
        incompatible_platforms: response.incompatible_platforms,
        warnings: response.warnings,
      });

      return response.can_publish_to_any;
    } catch (error: any) {
      setValidationError(
        error.response?.data?.error || 'Validation failed'
      );
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [publicationId, selectedPlatforms, userPlan, api]);

  /**
   * Valida un cambio de plataforma
   */
  const validatePlatforms = useCallback(
    async (platforms: string[]) => {
      setSelectedPlatforms(platforms);

      if (options.autoValidate) {
        // Crear nueva función con plataformas actualizadas
        const newValidate = async () => {
          try {
            const response = await api.validateContent(
              publicationId,
              platforms,
              userPlan
            );
            setValidationResult(response.details);
            setValidationSummary({
              can_publish_to_any: response.can_publish_to_any,
              compatible_count: response.compatible_count,
              incompatible_count: response.incompatible_count,
              compatible_platforms: response.compatible_platforms,
              incompatible_platforms: response.incompatible_platforms,
              warnings: response.warnings,
            });
          } catch (error: any) {
            setValidationError(error.response?.data?.error || 'Validation failed');
          }
        };

        await newValidate();
      }
    },
    [publicationId, userPlan, api, options.autoValidate]
  );

  /**
   * Obtiene estado de compatibilidad
   */
  const getCompatibilityState = useCallback(
    (platform: string) => {
      const result = validationResult[platform];
      if (!result) return 'unknown';
      return result.compatible ? 'compatible' : 'incompatible';
    },
    [validationResult]
  );

  /**
   * Obtiene errores de plataforma
   */
  const getPlatformErrors = useCallback(
    (platform: string) => {
      return validationResult[platform]?.errors || [];
    },
    [validationResult]
  );

  /**
   * Obtiene advertencias de plataforma
   */
  const getPlatformWarnings = useCallback(
    (platform: string) => {
      return validationResult[platform]?.warnings || [];
    },
    [validationResult]
  );

  return {
    // Estado
    publicationId,
    setPublicationId,
    selectedPlatforms,
    setSelectedPlatforms,
    userPlan,
    setUserPlan,
    isValidating,
    validationError,
    validationResult,
    validationSummary,

    // Métodos
    validate,
    validatePlatforms,
    getCompatibilityState,
    getPlatformErrors,
    getPlatformWarnings,
  };
}
