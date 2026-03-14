import { useMediaStore } from "@/stores/mediaStore";
import { useUploadQueue } from "@/stores/uploadQueueStore";
import axios, { AxiosError } from "axios";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

/**
 * Extract video metadata from file
 */
const extractVideoMetadata = (file: File): Promise<{
  duration: number;
  width: number;
  height: number;
  aspectRatio: number;
}> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      const duration = Math.floor(video.duration);
      const width = video.videoWidth;
      const height = video.videoHeight;
      const aspectRatio = width / height;
      
      URL.revokeObjectURL(video.src);
      
      resolve({
        duration,
        width,
        height,
        aspectRatio
      });
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

export const useS3Upload = () => {
  // Use global store state
  const queue = useUploadQueue((state) => state.queue);
  const addUpload = useUploadQueue((state) => state.addUpload);
  const updateUpload = useUploadQueue((state) => state.updateUpload);
  const removeUpload = useUploadQueue((state) => state.removeUpload);
  const pauseUpload = useUploadQueue((state) => state.pauseUpload);
  const resumeUpload = useUploadQueue((state) => state.resumeUpload);
  const cancelUpload = useUploadQueue((state) => state.cancelUpload);
  const retryUpload = useUploadQueue((state) => state.retryUpload);
  const { t } = useTranslation();

  // Derived state for the consuming component (EditPublicationModal)
  const progress: Record<string, number> = {};
  const stats: Record<string, { eta?: number; speed?: number }> = {};
  const errors: Record<string, string> = {};
  let isUploading = false;

  Object.values(queue).forEach((item) => {
    progress[item.id] = item.progress;
    if (item.stats) stats[item.id] = item.stats;
    if (item.error) errors[item.id] = item.error;
    if (item.status === "uploading") isUploading = true;
  });

  // Threshold for switching to Multipart Upload
  const MULTIPART_THRESHOLD = 5 * 1024 * 1024; // 5MB threshold for videos
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks (S3 minimum)
  const CONCURRENCY = 3; // 3 parallel chunks as requested
  const MAX_RETRIES = 3; // Maximum retry attempts

  // Calculate exponential backoff delay
  const getRetryDelay = (retryCount: number): number => {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, retryCount), 8000);
  };

  // Helper to determine if error is retryable
  const isRetryableError = (error: any): boolean => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      // Network errors are retryable
      if (!axiosError.response) return true;
      
      const status = axiosError.response.status;
      // Server errors (5xx) and some client errors are retryable
      if (status >= 500) return true;
      if (status === 408 || status === 429) return true; // Timeout or rate limit
      
      // Storage limit errors (402) are not retryable
      if (status === 402) return false;
      
      // Other client errors (4xx) are generally not retryable
      if (status >= 400 && status < 500) return false;
    }
    
    // Timeout errors are retryable
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return true;
    }
    
    // Network errors are retryable
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      return true;
    }
    
    return false;
  };

  // Helper to get user-friendly error message
  const getErrorMessage = (error: any, retryCount: number): string => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.status === 402) {
        const data = axiosError.response.data as any;
        return data?.error || 'Storage limit exceeded';
      }
      
      if (axiosError.response?.status === 413) {
        return 'File too large for upload';
      }
      
      if (axiosError.response?.status === 429) {
        return `Upload rate limited. Retrying in ${getRetryDelay(retryCount) / 1000}s...`;
      }
      
      if (!axiosError.response) {
        return retryCount < MAX_RETRIES 
          ? `Network error. Retrying in ${getRetryDelay(retryCount) / 1000}s...`
          : 'Network error. Please check your connection.';
      }
    }
    
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return retryCount < MAX_RETRIES
        ? `Upload timed out. Retrying in ${getRetryDelay(retryCount) / 1000}s...`
        : 'Upload timed out. Please try again.';
    }
    
    return error.message || 'Upload failed';
  };

  // Helper to calculate pending bytes from queue
  const calculatePendingBytes = (excludeId?: string): number => {
    const currentQueue = useUploadQueue.getState().queue;
    return Object.values(currentQueue)
      .filter(
        (item) =>
          item.id !== excludeId &&
          (item.status === "uploading" || item.status === "pending")
      )
      .reduce((total, item) => total + item.file.size, 0);
  };

  // Progress handler
  const handleProgress = (
    progressEvent: any,
    id: string,
    startTime: number,
    uploadedBytes: number,
    totalBytes: number
  ) => {
    const loaded = uploadedBytes + (progressEvent.loaded || 0);
    const total = totalBytes;
    const percentage = Math.round((loaded / total) * 100);
    
    const now = Date.now();
    const elapsed = (now - startTime) / 1000; // seconds
    const speed = elapsed > 0 ? loaded / elapsed : 0;
    const remaining = total - loaded;
    const eta = speed > 0 ? remaining / speed : 0;

    updateUpload(id, {
      progress: percentage,
      stats: {
        eta,
        speed,
        startTime,
        bytesUploaded: loaded,
        lastUpdateTime: now,
      },
    });
  };

  const uploadSingle = async (file: File, id: string, startTime: number) => {
    try {
      // Calculate pending bytes from other uploads in queue
      const pendingBytes = calculatePendingBytes(id);
      
      const { data: signData } = await axios.post(
        route("api.v1.uploads.sign"),
        {
          filename: file.name,
          content_type: file.type,
          file_size: file.size,
          pending_bytes: pendingBytes,
        },
        { timeout: 30000 } // 30 second timeout for signing
      );

      const { upload_url, key } = signData;

      // Get abort controller from store
      const currentUpload = useUploadQueue.getState().queue[id];
      const abortController = currentUpload?.abortController;

      // Calculate timeout based on file size (minimum 60s, +30s per 10MB)
      const uploadTimeout = Math.max(60000, Math.ceil(file.size / (10 * 1024 * 1024)) * 30000);

      await axios.put(upload_url, file, {
        headers: { "Content-Type": file.type },
        withCredentials: false,
        signal: abortController?.signal,
        timeout: uploadTimeout,
        onUploadProgress: (p) => handleProgress(p, id, startTime, 0, file.size),
      });

      return {
        key,
        filename: file.name,
        mime_type: file.type,
        size: file.size,
      };
    } catch (error: any) {
      // Check if error is due to cancellation
      if (axios.isCancel(error) || error.name === "CanceledError") {
        throw error; // Re-throw to be handled by caller
      }
      throw error;
    }
  };

  const uploadMultipart = async (file: File, id: string, startTime: number) => {
    // Check if we're resuming a paused upload
    const currentUpload = useUploadQueue.getState().queue[id];
    let uploadId = currentUpload?.uploadId;
    let key = currentUpload?.s3Key;
    let completedParts = currentUpload?.uploadedParts || [];

    // Initialize multipart upload if not resuming
    if (!uploadId || !key) {
      // Calculate pending bytes from other uploads in queue
      const pendingBytes = calculatePendingBytes(id);
      
      const { data: initData } = await axios.post(
        route("api.v1.uploads.multipart.init"),
        {
          filename: file.name,
          content_type: file.type,
          file_size: file.size,
          pending_bytes: pendingBytes,
        },
        { timeout: 30000 }
      );

      uploadId = initData.uploadId;
      key = initData.key;

      // Mark as pausable and store multipart upload info
      updateUpload(id, {
        uploadId,
        s3Key: key,
        isPausable: true,
        uploadedParts: [],
        abortController: new AbortController(),
      });
    } else {
      // Resuming - create new abort controller
      updateUpload(id, {
        abortController: new AbortController(),
      });
    }

    const totalParts = Math.ceil(file.size / CHUNK_SIZE);
    const parts: { ETag: string; PartNumber: number }[] = [...completedParts];

    // Internal state to track progress of each parallel chunk
    const partProgress: Record<number, number> = {};

    // Initialize progress for already completed parts
    completedParts.forEach((part) => {
      partProgress[part.PartNumber] = CHUNK_SIZE;
    });

    const uploadPart = async (partNumber: number) => {
      const start = (partNumber - 1) * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      // Get presigned URL for this part
      const { data: partData } = await axios.post(
        route("api.v1.uploads.multipart.sign-part"),
        {
          uploadId,
          partNumber,
          key,
        },
        { timeout: 30000 }
      );

      const currentUpload = useUploadQueue.getState().queue[id];
      const abortController = currentUpload?.abortController;

      // Upload the part
      const response = await axios.put(partData.upload_url, chunk, {
        headers: { "Content-Type": "application/octet-stream" },
        withCredentials: false,
        signal: abortController?.signal,
        timeout: 120000, // 2 minute timeout per part
        onUploadProgress: (p) => {
          partProgress[partNumber] = p.loaded || 0;
          const totalUploaded = Object.values(partProgress).reduce((sum, bytes) => sum + bytes, 0);
          
          // Calculate percentage directly here to avoid confusion
          const percentage = Math.round((totalUploaded / file.size) * 100);
          const now = Date.now();
          const elapsed = (now - startTime) / 1000;
          const speed = elapsed > 0 ? totalUploaded / elapsed : 0;
          const remaining = file.size - totalUploaded;
          const eta = speed > 0 ? remaining / speed : 0;

          updateUpload(id, {
            progress: percentage,
            stats: {
              eta,
              speed,
              startTime,
              bytesUploaded: totalUploaded,
              lastUpdateTime: now,
            },
          });
        },
      });

      const etag = response.headers.etag?.replace(/"/g, "");
      if (!etag) {
        throw new Error(`No ETag received for part ${partNumber}`);
      }

      return { ETag: etag, PartNumber: partNumber };
    };

    // Upload remaining parts with concurrency control
    const remainingParts = Array.from(
      { length: totalParts },
      (_, i) => i + 1
    ).filter(
      (partNumber) => !completedParts.some((p) => p.PartNumber === partNumber)
    );

    // Process parts in batches
    for (let i = 0; i < remainingParts.length; i += CONCURRENCY) {
      const batch = remainingParts.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map((partNumber) => uploadPart(partNumber))
      );
      parts.push(...batchResults);

      // Update stored parts for resumption
      updateUpload(id, { uploadedParts: parts });
    }

    // Complete multipart upload
    const { data: completeData } = await axios.post(
      route("api.v1.uploads.multipart.complete"),
      {
        uploadId,
        key,
        parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
      },
      { timeout: 60000 }
    );

    return {
      key: completeData.key,
      filename: file.name,
      mime_type: file.type,
      size: file.size,
    };
  };

  const uploadFile = useCallback(
    async (file: File, tempId: string) => {
      // Check if already uploading or completed
      const existingItem = useUploadQueue.getState().queue[tempId];
      if (existingItem && (existingItem.status === "uploading" || existingItem.status === "completed")) {
        if (existingItem.status === "completed" && existingItem.s3Key) {
          return {
            key: existingItem.s3Key,
            filename: file.name,
            mime_type: file.type,
            size: file.size,
          };
        }
        return;
      }

      // Add to global queue
      addUpload(tempId, file);
      updateUpload(tempId, {
        status: "uploading",
        progress: 0,
        abortController: new AbortController(),
      });

      const startTime = Date.now();

      try {
        let result;
        // Apply optimization primarily to videos or files over threshold
        const isVideo = file.type.startsWith("video/");
        if (file.size >= MULTIPART_THRESHOLD || isVideo) {
          result = await uploadMultipart(file, tempId, startTime);
        } else {
          result = await uploadSingle(file, tempId, startTime);
        }

        // Success!
        updateUpload(tempId, {
          status: "completed",
          progress: 100,
          s3Key: result.key,
        });

        // Sync status back to mediaStore
        console.log('✅ Upload completed, updating mediaStore:', {
          tempId,
          key: result.key,
          filename: file.name
        });
        
        useMediaStore.getState().updateFile(tempId, {
          status: "completed",
          file: {
            key: result.key,
            filename: file.name,
            mime_type: file.type,
            size: file.size,
          } as any,
        });

        // CRITICAL: If this upload is linked to a publication, attach it automatically
        const currentUpload = useUploadQueue.getState().queue[tempId];
        if (currentUpload?.publicationId) {
          console.log('🔗 Auto-attaching media to publication:', {
            publicationId: currentUpload.publicationId,
            key: result.key,
            filename: file.name
          });
          
          // Call attach-media endpoint in background (fire and forget)
          axios.post(
            route("api.v1.publications.attach-media", currentUpload.publicationId),
            {
              key: result.key,
              filename: file.name,
              mime_type: file.type,
              size: file.size,
            }
          ).then(() => {
            console.log('✅ Media attached successfully to publication', currentUpload.publicationId);
            toast.success(
              `${file.name} vinculado correctamente`,
              { duration: 3000 }
            );
          }).catch((error) => {
            console.error('❌ Failed to attach media to publication:', error);
            toast.error(
              `Error al vincular ${file.name}. Intenta refrescar la página.`
            );
          });
        }

        return result;
      } catch (error: any) {
        // Check if error is due to cancellation/pause
        if (axios.isCancel(error) || error.name === "CanceledError") {
          const currentUpload = useUploadQueue.getState().queue[tempId];
          if (currentUpload?.status === "paused") {
            return;
          } else if (currentUpload?.status === "cancelled") {
            removeUpload(tempId);
            useMediaStore.getState().removeFile(tempId);
            return;
          }
        }

        console.error("Upload failed", error);

        const currentUpload = useUploadQueue.getState().queue[tempId];
        const retryCount = currentUpload?.retryCount || 0;
        const canRetry = retryCount < MAX_RETRIES && isRetryableError(error);
        const errorMessage = getErrorMessage(error, retryCount);

        updateUpload(tempId, {
          status: "error",
          error: errorMessage,
          lastError: error.message,
          canRetry,
        });

        // Sync error back to mediaStore
        useMediaStore.getState().updateFile(tempId, {
          status: "failed",
        });

        // Show toast for non-retryable errors
        if (!canRetry || (axios.isAxiosError(error) && error.response?.status === 402)) {
          toast.error(errorMessage);
        }

        throw error;
      }
    },
    [addUpload, updateUpload],
  );

  return {
    uploadFile,
    uploading: isUploading,
    progress,
    stats,
    errors,
  };
};