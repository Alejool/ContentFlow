import { useState } from 'react';
import axios, { type AxiosError } from 'axios';
import type {
  PreviewData,
  PlatformConfiguration,
  PublishResponse,
} from '@/types/preview';

export function usePublishPreview() {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Genera la previsualización de una publicación
   */
  const generatePreview = async (
    publicationId: number,
    platformIds: number[],
    autoOptimize = false
  ): Promise<PreviewData | null> => {
    setIsLoading(true);
    setError(null);
    setPreviewData(null);

    try {
      const response = await axios.post<{ data: PreviewData }>(
        `/api/v1/publications/${publicationId}/preview`,
        {
          platform_ids: platformIds,
          auto_optimize: autoOptimize,
        }
      );

      setPreviewData(response.data.data);
      return response.data.data;
    } catch (err) {
      console.error('Error generating preview:', err);
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || 'Error al generar la previsualización');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Aplica optimización automática
   */
  const autoOptimize = async (
    publicationId: number,
    platformIds: number[]
  ): Promise<PreviewData | null> => {
    setIsOptimizing(true);
    setError(null);

    try {
      const response = await axios.post<{ data: { preview: PreviewData } }>(
        `/api/v1/publications/${publicationId}/auto-optimize`,
        {
          platform_ids: platformIds,
        }
      );

      setPreviewData(response.data.data.preview);
      return response.data.data.preview;
    } catch (err) {
      console.error('Error auto-optimizing:', err);
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || 'Error al optimizar automáticamente');
      return null;
    } finally {
      setIsOptimizing(false);
    }
  };

  /**
   * Actualiza la configuración de una plataforma específica
   */
  const updatePlatformConfig = async (
    publicationId: number,
    accountId: number,
    type: string,
    customSettings: Record<string, any> = {}
  ): Promise<PlatformConfiguration> => {
    try {
      const response = await axios.put<{ data: PlatformConfiguration }>(
        `/api/v1/publications/${publicationId}/platform-config/${accountId}`,
        {
          type: type,
          custom_settings: customSettings,
        }
      );

      // Actualizar la configuración en previewData
      setPreviewData((prev) => {
        if (!prev) return prev;
        
        const index = prev.platform_configurations.findIndex(
          (c) => c.account_id === accountId
        );
        
        if (index !== -1) {
          const updated = { ...prev };
          updated.platform_configurations[index] = response.data.data;
          return updated;
        }
        
        return prev;
      });

      return response.data.data;
    } catch (err) {
      console.error('Error updating platform config:', err);
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || 'Error al actualizar la configuración');
      throw err;
    }
  };

  /**
   * Publica con la configuración actual
   */
  const publish = async (
    publicationId: number,
    platformConfigs: PlatformConfiguration[],
    scheduledAt: string | null = null
  ): Promise<PublishResponse | null> => {
    setIsPublishing(true);
    setError(null);

    try {
      const response = await axios.post<PublishResponse>(
        `/api/v1/publications/${publicationId}/publish`,
        {
          platform_configs: platformConfigs,
          scheduled_at: scheduledAt,
        }
      );

      return response.data;
    } catch (err) {
      console.error('Error publishing:', err);
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || 'Error al publicar');
      return null;
    } finally {
      setIsPublishing(false);
    }
  };

  /**
   * Obtiene las configuraciones guardadas
   */
  const getSavedConfigurations = async (
    publicationId: number
  ): Promise<Record<string, any> | null> => {
    try {
      const response = await axios.get<{ data: { platform_settings: Record<string, any> } }>(
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
  const generateThumbnail = async (
    publicationId: number,
    platform: string,
    timestamp = 1
  ): Promise<string | null> => {
    try {
      const response = await axios.post<{ data: { thumbnail_url: string } }>(
        `/api/v1/publications/${publicationId}/generate-thumbnail`,
        {
          platform: platform,
          timestamp: timestamp,
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
  const clearPreview = (): void => {
    setPreviewData(null);
    setError(null);
  };

  /**
   * Verifica si hay plataformas compatibles
   */
  const hasCompatiblePlatforms = (): boolean => {
    if (!previewData?.platform_configurations) return false;
    return previewData.platform_configurations.some((c) => c.is_compatible);
  };

  /**
   * Verifica si hay plataformas incompatibles
   */
  const hasIncompatiblePlatforms = (): boolean => {
    if (!previewData?.platform_configurations) return false;
    return previewData.platform_configurations.some((c) => !c.is_compatible);
  };

  /**
   * Obtiene solo las plataformas compatibles
   */
  const getCompatiblePlatforms = (): PlatformConfiguration[] => {
    if (!previewData?.platform_configurations) return [];
    return previewData.platform_configurations.filter((c) => c.is_compatible);
  };

  /**
   * Obtiene solo las plataformas incompatibles
   */
  const getIncompatiblePlatforms = (): PlatformConfiguration[] => {
    if (!previewData?.platform_configurations) return [];
    return previewData.platform_configurations.filter((c) => !c.is_compatible);
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
    getIncompatiblePlatforms,
  };
}
