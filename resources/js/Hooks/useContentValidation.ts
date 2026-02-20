import { useState } from 'react';
import axios, { type AxiosError } from 'axios';
import type { ContentValidationResult } from '@/types/validation';

export function useContentValidation() {
  const [validationResult, setValidationResult] = useState<ContentValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Validate content to a publication
   * @param publicationId - ID de la publicación
   * @param platformIds - IDs de las plataformas seleccionadas
   */
  const validateContent = async (
    publicationId: number,
    platformIds: number[]
  ): Promise<ContentValidationResult | null> => {
    if (!publicationId || !platformIds || platformIds.length === 0) {
      setValidationError('Datos de validación incompletos');
      return null;
    }

    setIsValidating(true);
    setValidationError(null);
    setValidationResult(null);

    try {
      const response = await axios.post<{ data: ContentValidationResult }>(
        `/api/v1/publications/${publicationId}/validate`,
        { platform_ids: platformIds }
      );

      setValidationResult(response.data.data);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setValidationError(axiosError.response?.data?.message || 'Error al validar el contenido');
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * check errores to a publication
   */
  const hasBlockingErrors = (): boolean => {
    if (!validationResult) return false;
    return !validationResult.is_valid;
  };

  /**
   * Check for warnings
   */
  const hasWarnings = (): boolean => {
    if (!validationResult) return false;
    return (
      (validationResult.warnings?.length ?? 0) > 0 ||
      Object.values(validationResult.platform_results || {}).some(
        (r) => (r.warnings?.length ?? 0) > 0
      )
    );
  };

  /**
   * Get compatible platform
   */
  const getCompatiblePlatforms = (): string[] => {
    if (!validationResult?.platform_results) return [];
    return Object.entries(validationResult.platform_results)
      .filter(([_, result]) => result.is_compatible)
      .map(([platform, _]) => platform);
  };

  /**
   * Get incompatibles platforms
   */
  const getIncompatiblePlatforms = (): string[] => {
    if (!validationResult?.platform_results) return [];
    return Object.entries(validationResult.platform_results)
      .filter(([_, result]) => !result.is_compatible)
      .map(([platform, _]) => platform);
  };

  /**
   * Clean the results validation
   */
  const clearValidation = (): void => {
    setValidationResult(null);
    setValidationError(null);
  };

  return {
    validationResult,
    isValidating,
    validationError,
    validateContent,
    hasBlockingErrors,
    hasWarnings,
    getCompatiblePlatforms,
    getIncompatiblePlatforms,
    clearValidation,
  };
}
