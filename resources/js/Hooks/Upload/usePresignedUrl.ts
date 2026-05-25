import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useMemo } from 'react';

/**
 * Hook para obtener presigned URLs de archivos privados en S3
 * 
 * Características:
 * - Cachea URLs con TTL menor al de S3 (55 minutos vs 60 minutos)
 * - Obtiene URLs bajo demanda (lazy)
 * - Soporta dos estrategias: por ID de MediaFile o por S3 key
 * - Manejo de errores con reintentos
 */

interface PresignedUrlResponse {
  success: boolean;
  preview_url?: string;
  download_url?: string;
  mime_type?: string;
  filename?: string;
  expires_in: number;
}

interface UsePresignedUrlOptions {
  enabled?: boolean; // Para queries condicionales
  type?: 'preview' | 'download'; // Tipo de URL a obtener
  mediaType?: 'image' | 'video' | 'pdf' | 'audio'; // Hint de tipo para by-key
}

/**
 * Hook para obtener presigned URL por ID de MediaFile
 * 
 * @param mediaFileId - ID del archivo en la BD
 * @param options - Opciones del hook
 * @returns Query result con la presigned URL
 */
export const usePresignedUrl = (
  mediaFileId: number | null | undefined,
  options: UsePresignedUrlOptions = {}
) => {
  const { enabled = true, type = 'preview' } = options;

  return useQuery({
    queryKey: ['presigned-url', mediaFileId, type],
    queryFn: async () => {
      if (!mediaFileId) throw new Error('Media file ID is required');

      const { data } = await axios.get<PresignedUrlResponse>(
        `/api/v1/files/${mediaFileId}/access`,
        { timeout: 10_000 }
      );

      return {
        success: true,
        preview_url: data.url,
        download_url: data.url,
        mime_type: data.mimeType,
        expires_in: data.expiresIn,
      };
    },
    enabled: enabled && !!mediaFileId,
    staleTime: 55 * 60 * 1000, // 55 min (URL expira en 60 min)
    gcTime: 60 * 60 * 1000, // 60 min cache
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * Hook para obtener presigned URL por S3 key
 * 
 * Útil para archivos sin MediaFile (derivados, reels, branding, etc)
 * 
 * @param s3Key - Ruta del archivo en S3
 * @param options - Opciones del hook
 * @returns Query result con la presigned URL
 */
export const usePresignedUrlByKey = (
  s3Key: string | null | undefined,
  options: UsePresignedUrlOptions = {}
) => {
  const { enabled = true, mediaType } = options;

  return useQuery({
    queryKey: ['presigned-url-by-key', s3Key, mediaType],
    queryFn: async () => {
      if (!s3Key) throw new Error('S3 key is required');

      const { data } = await axios.get<PresignedUrlResponse>(
        route('api.v1.media.by-key.preview'),
        {
          params: {
            key: s3Key,
            type: mediaType || 'image',
          },
          timeout: 10_000,
        }
      );

      return data;
    },
    enabled: enabled && !!s3Key,
    staleTime: 55 * 60 * 1000, // 55 min
    gcTime: 60 * 60 * 1000, // 60 min
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * Hook para obtener múltiples presigned URLs
 *
 * Usa una única query batch para evitar violar las Rules of Hooks.
 *
 * @param mediaFileIds - Array de IDs de MediaFile
 * @param options - Opciones del hook
 * @returns Objeto con URLs por ID
 */
export const usePresignedUrls = (
  mediaFileIds: (number | undefined)[] | undefined,
  options: UsePresignedUrlOptions = {}
) => {
  const { enabled = true, type = 'preview' } = options;

  const validIds = useMemo(
    () => (Array.isArray(mediaFileIds) ? mediaFileIds : []).filter((id): id is number => id !== undefined),
    [mediaFileIds]
  );

  const query = useQuery({
    queryKey: ['presigned-urls-batch', validIds, type],
    queryFn: async () => {
      const results = await Promise.all(
        validIds.map(async (id) => {
          const { data } = await axios.get<PresignedUrlResponse>(
            `/api/v1/files/${id}/access`,
            { timeout: 10_000 }
          );
          return {
            id,
            preview_url: data.url,
            download_url: data.url,
            mime_type: data.mimeType,
            expires_in: data.expiresIn,
          };
        })
      );
      return results;
    },
    enabled: enabled && validIds.length > 0,
    staleTime: 55 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const urlsById = useMemo(() => {
    const result: Record<number, string | undefined> = {};
    (query.data ?? []).forEach((item) => {
      result[item.id] = item.preview_url;
    });
    return result;
  }, [query.data]);

  return {
    urlsById,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};

/**
 * Hook para obtener múltiples presigned URLs por S3 key
 *
 * Usa una única query batch para evitar violar las Rules of Hooks.
 *
 * @param s3Keys - Array de S3 keys
 * @param options - Opciones del hook
 * @returns Objeto con URLs por key
 */
export const usePresignedUrlsByKey = (
  s3Keys: (string | null | undefined)[] | undefined,
  options: UsePresignedUrlOptions = {}
) => {
  const { enabled = true, mediaType } = options;

  const validKeys = useMemo(
    () => (Array.isArray(s3Keys) ? s3Keys : []).filter((key): key is string => !!key),
    [s3Keys]
  );

  const query = useQuery({
    queryKey: ['presigned-urls-by-key-batch', validKeys, mediaType],
    queryFn: async () => {
      const results = await Promise.all(
        validKeys.map(async (key) => {
          const { data } = await axios.get<PresignedUrlResponse>(
            route('api.v1.media.by-key.preview'),
            {
              params: { key, type: mediaType || 'image' },
              timeout: 10_000,
            }
          );
          return { key, preview_url: data.preview_url };
        })
      );
      return results;
    },
    enabled: enabled && validKeys.length > 0,
    staleTime: 55 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const urlsByKey = useMemo(() => {
    const result: Record<string, string | undefined> = {};
    (query.data ?? []).forEach((item) => {
      if (item.preview_url) result[item.key] = item.preview_url;
    });
    return result;
  }, [query.data]);

  return {
    urlsByKey,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};

/**
 * Hook para generar presigned URL manualmente (mutation)
 * 
 * Útil cuando necesitas obtener URL en respuesta a una acción del usuario
 * 
 * @param type - Tipo de URL (preview o download)
 * @returns Mutation para generar URL
 */
export const useGeneratePresignedUrl = (type: 'preview' | 'download' = 'preview') => {
  return useMutation({
    mutationFn: async (mediaFileId: number) => {
      const { data } = await axios.get<PresignedUrlResponse>(
        `/api/v1/files/${mediaFileId}/access`,
        { timeout: 10_000 }
      );
      return {
        success: true,
        preview_url: data.url,
        download_url: data.url,
        mime_type: data.mimeType,
        expires_in: data.expiresIn,
      };
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * Hook para generar presigned URL por S3 key manualmente
 * 
 * @param mediaType - Tipo de media (image, video, pdf, audio)
 * @returns Mutation para generar URL
 */
export const useGeneratePresignedUrlByKey = (mediaType: string = 'image') => {
  return useMutation({
    mutationFn: async (s3Key: string) => {
      const { data } = await axios.get<PresignedUrlResponse>(
        route('api.v1.media.by-key.preview'),
        {
          params: {
            key: s3Key,
            type: mediaType,
          },
          timeout: 10_000,
        }
      );
      return data;
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * Componente helper: obtener URL presignada de forma segura
 * 
 * Retorna URL si está disponible, undefined mientras carga, error si falla
 */
export const usePresignedImageUrl = (mediaFileId: number | null | undefined) => {
  const { data, isLoading, error } = usePresignedUrl(mediaFileId);

  return {
    url: data?.preview_url,
    isLoading,
    error: error as Error | null,
  };
};

/**
 * Componente helper: obtener URL presignada por S3 key
 */
export const usePresignedImageUrlByKey = (s3Key: string | null | undefined) => {
  const { data, isLoading, error } = usePresignedUrlByKey(s3Key, { mediaType: 'image' });

  return {
    url: data?.preview_url,
    isLoading,
    error: error as Error | null,
  };
};
