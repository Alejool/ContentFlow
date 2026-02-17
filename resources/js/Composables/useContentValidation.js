import { ref } from 'vue';
import axios from 'axios';

export function useContentValidation() {
  const validationResult = ref(null);
  const isValidating = ref(false);
  const validationError = ref(null);

  /**
   * Valida el contenido de una publicación
   * @param {number} publicationId - ID de la publicación
   * @param {array} platformIds - IDs de las plataformas seleccionadas
   */
  const validateContent = async (publicationId, platformIds) => {
    if (!publicationId || !platformIds || platformIds.length === 0) {
      validationError.value = 'Datos de validación incompletos';
      return null;
    }

    isValidating.value = true;
    validationError.value = null;
    validationResult.value = null;

    try {
      const response = await axios.post(
        `/api/v1/publications/${publicationId}/validate`,
        { platform_ids: platformIds }
      );

      validationResult.value = response.data.data;
      return validationResult.value;
    } catch (error) {
      console.error('Error validating content:', error);
      validationError.value = error.response?.data?.message || 'Error al validar el contenido';
      return null;
    } finally {
      isValidating.value = false;
    }
  };

  /**
   * Verifica si hay errores críticos que bloquean la publicación
   */
  const hasBlockingErrors = () => {
    if (!validationResult.value) return false;
    return !validationResult.value.is_valid;
  };

  /**
   * Verifica si hay advertencias
   */
  const hasWarnings = () => {
    if (!validationResult.value) return false;
    return validationResult.value.warnings?.length > 0 ||
           Object.values(validationResult.value.platform_results || {})
             .some(r => r.warnings?.length > 0);
  };

  /**
   * Obtiene las plataformas compatibles
   */
  const getCompatiblePlatforms = () => {
    if (!validationResult.value?.platform_results) return [];
    return Object.entries(validationResult.value.platform_results)
      .filter(([_, result]) => result.is_compatible)
      .map(([platform, _]) => platform);
  };

  /**
   * Obtiene las plataformas incompatibles
   */
  const getIncompatiblePlatforms = () => {
    if (!validationResult.value?.platform_results) return [];
    return Object.entries(validationResult.value.platform_results)
      .filter(([_, result]) => !result.is_compatible)
      .map(([platform, _]) => platform);
  };

  /**
   * Limpia los resultados de validación
   */
  const clearValidation = () => {
    validationResult.value = null;
    validationError.value = null;
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
    clearValidation
  };
}
