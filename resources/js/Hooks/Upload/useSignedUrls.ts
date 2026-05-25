import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

/**
 * Hook simplificado para upload con signed URLs
 * 
 * Flujo:
 * 1. Solicitar signed PUT URL al backend
 * 2. Subir archivo directamente a S3
 * 3. Confirmar upload en backend (crea MediaFile)
 * 4. Retorna mediaFileId para usar en publicaciones
 * 
 * Ventajas:
 * - Más seguro (sin credentials en frontend)
 * - Más rápido (upload directo a S3)
 * - Mejor manejo de errores
 * - URLs temporales (expiran)
 */

interface FileUploadResult {
  mediaFileId: number;
  s3Key: string;
  fileName: string;
  mimeType: string;
  size: number;
}

interface UseSignedUploadOptions {
  uploadType?: 'publication' | 'avatar' | 'reel' | 'document';
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  onSuccess?: (result: FileUploadResult) => void;
}

/**
 * Hook para upload con signed URLs (NEW API)
 * 
 * @example
 * const { upload, isUploading, progress } = useSignedUpload();
 * 
 * const handleUpload = async (file: File) => {
 *   try {
 *     const result = await upload(file, 'publication');
 *     console.log('Uploaded:', result.mediaFileId);
 *   } catch (err) {
 *     console.error('Upload failed:', err);
 *   }
 * };
 */
export const useSignedUpload = (options: UseSignedUploadOptions = {}) => {
  const { uploadType = 'publication', onProgress, onError, onSuccess } = options;
  const { t } = useTranslation();

  const mutation = useMutation({
    mutationFn: async (file: File): Promise<FileUploadResult> => {
      try {
        // 1. Solicitar signed PUT URL
        const uploadResponse = await axios.post<{
          uploadUrl: string;
          s3Key: string;
          expiresIn: number;
        }>('/api/v1/files/upload-url', {
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          uploadType,
        });

        const { uploadUrl, s3Key } = uploadResponse.data;

        // 2. Subir archivo directamente a S3
        await axios.put(uploadUrl, file, {
          headers: { 'Content-Type': file.type },
          withCredentials: false,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            onProgress?.(percentCompleted);
          },
        });

        // 3. Confirmar upload en backend
        const confirmResponse = await axios.post<{
          mediaFileId: number;
          s3Key: string;
        }>('/api/v1/files/confirm-upload', {
          s3Key,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        });

        const result: FileUploadResult = {
          mediaFileId: confirmResponse.data.mediaFileId,
          s3Key: confirmResponse.data.s3Key,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        };

        onSuccess?.(result);
        return result;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message = error.response?.data?.message || error.message;
          onError?.(new Error(message));
          throw new Error(message);
        }
        onError?.(error as Error);
        throw error;
      }
    },

    onError: (error) => {
      toast.error(
        t('publications.messages.uploadFailed', {
          defaultValue: `Error en upload: ${(error as Error).message}`,
        })
      );
    },

    onSuccess: (result) => {
      toast.success(
        t('publications.messages.uploadSuccess', {
          defaultValue: `${result.fileName} subido correctamente`,
        }),
        { duration: 3000 }
      );
    },
  });

  const upload = useCallback(
    (file: File) => mutation.mutateAsync(file),
    [mutation.mutateAsync]
  );

  return {
    upload,
    isUploading: mutation.isPending,
    error: mutation.error,
    result: mutation.data,
  };
};

/**
 * Hook para obtener presigned GET URL y acceder a archivo privado
 * 
 * @example
 * const { getAccessUrl } = useFileAccess();
 * 
 * const handlePlayVideo = async (mediaFileId: number) => {
 *   const { url } = await getAccessUrl(mediaFileId);
 *   video.src = url;
 * };
 */
export interface FileAccessResult {
  url: string;
  expiresIn: number;
  mimeType: string;
}

export const useFileAccess = () => {
  const mutation = useMutation({
    mutationFn: async (mediaFileId: number): Promise<FileAccessResult> => {
      const response = await axios.get<FileAccessResult>(`/api/v1/files/${mediaFileId}/access`);
      return response.data;
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const getAccessUrl = useCallback(
    (mediaFileId: number) => mutation.mutateAsync(mediaFileId),
    [mutation.mutateAsync]
  );

  return {
    getAccessUrl,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

/**
 * Hook para deletar archivo (S3 + DB)
 * 
 * @example
 * const { deleteFile } = useFileDelete();
 * 
 * const handleDelete = async (mediaFileId: number) => {
 *   await deleteFile(mediaFileId);
 * };
 */
export const useFileDelete = () => {
  const { t } = useTranslation();

  const mutation = useMutation({
    mutationFn: async (mediaFileId: number) => {
      await axios.delete(`/api/v1/files/${mediaFileId}`);
    },

    onError: () => {
      toast.error(
        t('publications.messages.deleteError', {
          defaultValue: 'No se pudo eliminar el archivo',
        })
      );
    },

    onSuccess: () => {
      toast.success(
        t('publications.messages.deleteSuccess', {
          defaultValue: 'Archivo eliminado',
        }),
        { duration: 2000 }
      );
    },
  });

  const deleteFile = useCallback(
    (mediaFileId: number) => mutation.mutateAsync(mediaFileId),
    [mutation.mutateAsync]
  );

  return {
    deleteFile,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
};
