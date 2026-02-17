import { ref } from 'vue';
import axios from 'axios';

export function usePublishPreview() {
  const previewData = ref(null);
  const isLoading = ref(false);
  const isOptimizing = ref(false);
  const isPublishing = ref(false);
  const error = ref(null);

  /**
   * Genera la previsualización de una publicación
   */
  const generatePreview = async (publicationId, platformIds, autoOptimize = false) => {
    isLoading.value = true;
    error.value = null;
    previewData.value = null;

    try {
      const response = await axios.post(
        `/api/v1/publications/${publicationId}/preview`,
        {
          platform_ids: platformIds,
          auto_optimize: autoOptimize
        }
      );

      previewData.value = response.data.data;
      return previewData.value;
    } catch (err) {
      console.error('Error generating preview:', err);
      error.value = err.response?.data?.message || 'Error al generar la previsualización';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Aplica optimización automática
   */
  const autoOptimize = async (publicationId, platformIds) => {
    isOptimizing.value = true;
    error.value = null;

    try {
      const response = await axios.post(
        `/api/v1/publications/${publicationId}/auto-optimize`,
        {
          platform_ids: platformIds
        }
      );

      previewData.value = response.data.data.preview;
      return previewData.value;
    } catch (err) {
      console.error('Error auto-optimizing:', err);
      error.value = err.response?.data?.message || 'Error al optimizar automáticamente';
      return null;
    } finally {
      isOptimizing.value = false;
    }
  };

  /**
   * Actualiza la configuración de una plataforma específica
   */
  const updatePlatformConfig = async (publicationId, accountId, type, customSettings = {}) => {
    try {
      const response = await axios.put(
        `/api/v1/publications/${publicationId}/platform-config/${accountId}`,
        {
          type: type,
          custom_settings: customSettings
        }
      );

      // Actualizar la configuración en previewData
      if (previewData.value) {
        const index = previewData.value.platform_configurations.findIndex(
          c => c.account_id === accountId
        );
        if (index !== -1) {
          previewData.value.platform_configurations[index] = response.data.data;
        }
      }

      return response.data.data;
    } catch (err) {
      console.error('Error updating platform config:', err);
      error.value = err.response?.data?.message || 'Error al actualizar la configuración';
      throw err;
    }
  };

  /**
   * Publica con la configuración actual
   */
  const publish = async (publicationId, platformConfigs, scheduledAt = null) => {
    isPublishing.value = true;
    error.value = null;

    try {
      const response = await axios.post(
        `/api/v1/publications/${publicationId}/publish`,
        {
          platform_configs: platformConfigs,
          scheduled_at: scheduledAt
        }
      );

      return response.data;
    } catch (err) {
      console.error('Error publishing:', err);
      error.value = err.response?.data?.message || 'Error al publicar';
      return null;
    } finally {
      isPublishing.value = false;
    }
  };

  /**
   * Obtiene las configuraciones guardadas
   */
  const getSavedConfigurations = async (publicationId) => {
    try {
      const response = await axios.get(
        `/api/v1/publications/${publicationId}/saved-configurations`
      );

      return response.data.data.platform_settings;
    } catch (err) {
      console.error('Error getting saved configurations:', err);
      return null;
    }
  };

  /**
   * Genera una miniatura personalizada
   */
  const generateThumbnail = async (publicationId, platform, timestamp = 1) => {
    try {
      const response = await axios.post(
        `/api/v1/publications/${publicationId}/generate-thumbnail`,
        {
          platform: platform,
          timestamp: timestamp
        }
      );

      return response.data.data.thumbnail_url;
    } catch (err) {
      console.error('Error generating thumbnail:', err);
      return null;
    }
  };

  /**
   * Limpia los datos de previsualización
   */
  const clearPreview = () => {
    previewData.value = null;
    error.value = null;
  };

  /**
   * Verifica si hay plataformas compatibles
   */
  const hasCompatiblePlatforms = () => {
    if (!previewData.value?.platform_configurations) return false;
    return previewData.value.platform_configurations.some(c => c.is_compatible);
  };

  /**
   * Verifica si hay plataformas incompatibles
   */
  const hasIncompatiblePlatforms = () => {
    if (!previewData.value?.platform_configurations) return false;
    return previewData.value.platform_configurations.some(c => !c.is_compatible);
  };

  /**
   * Obtiene solo las plataformas compatibles
   */
  const getCompatiblePlatforms = () => {
    if (!previewData.value?.platform_configurations) return [];
    return previewData.value.platform_configurations.filter(c => c.is_compatible);
  };

  /**
   * Obtiene solo las plataformas incompatibles
   */
  const getIncompatiblePlatforms = () => {
    if (!previewData.value?.platform_configurations) return [];
    return previewData.value.platform_configurations.filter(c => !c.is_compatible);
  };

  return {
    // State
    previewData,
    isLoading,
    isOptimizing,
    isPublishing,
    error,

    // Methods
    generatePreview,
    autoOptimize,
    updatePlatformConfig,
    publish,
    getSavedConfigurations,
    generateThumbnail,
    clearPreview,

    // Helpers
    hasCompatiblePlatforms,
    hasIncompatiblePlatforms,
    getCompatiblePlatforms,
    getIncompatiblePlatforms
  };
}
