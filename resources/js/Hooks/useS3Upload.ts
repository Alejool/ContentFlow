import { useMediaStore } from '@/stores/mediaStore';
import { useUploadQueue } from '@/stores/uploadQueueStore';
import { useMutation } from '@tanstack/react-query';
import axios, { type AxiosError } from 'axios';
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MULTIPART_THRESHOLD = 5 * 1024 * 1024; // 5 MB
const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB (S3 minimum)
const CONCURRENCY = 3;
const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Helpers (module-level, no hook deps needed)
// ---------------------------------------------------------------------------
const getRetryDelay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 8000);

const isRetryableError = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    const e = error as AxiosError;
    if (!e.response) return true;
    const s = e.response.status;
    if (s >= 500 || s === 408 || s === 429) return true;
    if (s === 402 || (s >= 400 && s < 500)) return false;
  }
  if (error instanceof Error) {
    const msg = error.message ?? '';
    if ((error as any).code === 'ECONNABORTED' || msg.includes('timeout')) return true;
    if ((error as any).code === 'NETWORK_ERROR' || msg.includes('Network Error')) return true;
  }
  return false;
};

const getErrorMessage = (error: unknown, retryCount: number): string => {
  if (axios.isAxiosError(error)) {
    const e = error as AxiosError;
    if (e.response?.status === 402) {
      const data = e.response.data as any;
      return data?.error ?? 'Storage limit exceeded';
    }
    if (e.response?.status === 413) return 'File too large for upload';
    if (e.response?.status === 429)
      return `Upload rate limited. Retrying in ${getRetryDelay(retryCount) / 1000}s…`;
    if (!e.response)
      return retryCount < MAX_RETRIES
        ? `Network error. Retrying in ${getRetryDelay(retryCount) / 1000}s…`
        : 'Network error. Please check your connection.';
  }
  if (error instanceof Error) {
    const msg = error.message ?? '';
    if ((error as any).code === 'ECONNABORTED' || msg.includes('timeout'))
      return retryCount < MAX_RETRIES
        ? `Upload timed out. Retrying in ${getRetryDelay(retryCount) / 1000}s…`
        : 'Upload timed out. Please try again.';
    return msg;
  }
  return 'Upload failed';
};

const extractVideoMetadata = (
  file: File,
): Promise<{
  duration: number;
  width: number;
  height: number;
  aspectRatio: number;
}> =>
  new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const { duration, videoWidth: width, videoHeight: height } = video;
      URL.revokeObjectURL(video.src);
      resolve({ duration: Math.floor(duration), width, height, aspectRatio: width / height });
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    video.src = URL.createObjectURL(file);
  });

// ---------------------------------------------------------------------------
// Core upload logic (plain async functions, no hook deps)
// These are called by useMutation's mutationFn
// ---------------------------------------------------------------------------

const calculatePendingBytes = (excludeId?: string): number =>
  Object.values(useUploadQueue.getState().queue)
    .filter((i) => i.id !== excludeId && (i.status === 'uploading' || i.status === 'pending'))
    .reduce((total, i) => total + i.file.size, 0);

const handleProgress = (
  progressEvent: any,
  id: string,
  startTime: number,
  uploadedBytes: number,
  totalBytes: number,
) => {
  const loaded = uploadedBytes + (progressEvent.loaded ?? 0);
  const elapsed = (Date.now() - startTime) / 1000;
  const speed = elapsed > 0 ? loaded / elapsed : 0;
  const eta = speed > 0 ? (totalBytes - loaded) / speed : 0;
  useUploadQueue.getState().updateUpload(id, {
    progress: Math.round((loaded / totalBytes) * 100),
    stats: { eta, speed, startTime, bytesUploaded: loaded, lastUpdateTime: Date.now() },
  });
};

const uploadSingle = async (file: File, id: string, startTime: number, context?: string) => {
  const { data: signData } = await axios.post(
    route('api.v1.uploads.sign'),
    {
      filename: file.name,
      content_type: file.type,
      file_size: file.size,
      pending_bytes: calculatePendingBytes(id),
      context: context || 'publication', // default to publication
    },
    { timeout: 30_000 },
  );

  const abortController = useUploadQueue.getState().queue[id]?.abortController;
  const uploadTimeout = Math.max(60_000, Math.ceil(file.size / (10 * 1024 * 1024)) * 30_000);

  await axios.put(signData.upload_url, file, {
    headers: { 'Content-Type': file.type },
    withCredentials: false,
    signal: abortController?.signal,
    timeout: uploadTimeout,
    onUploadProgress: (p) => handleProgress(p, id, startTime, 0, file.size),
  });

  return { key: signData.key, filename: file.name, mime_type: file.type, size: file.size };
};

const uploadMultipart = async (file: File, id: string, startTime: number, context?: string) => {
  const existing = useUploadQueue.getState().queue[id];
  let uploadId = existing?.uploadId;
  let key = existing?.s3Key;
  const completedParts = existing?.uploadedParts ?? [];

  if (!uploadId || !key) {
    const { data } = await axios.post(
      route('api.v1.uploads.multipart.init'),
      {
        filename: file.name,
        content_type: file.type,
        file_size: file.size,
        pending_bytes: calculatePendingBytes(id),
        context: context || 'publication', // default to publication
      },
      { timeout: 30_000 },
    );
    uploadId = data.uploadId;
    key = data.key;
    useUploadQueue.getState().updateUpload(id, {
      uploadId,
      s3Key: key,
      isPausable: true,
      uploadedParts: [],
      abortController: new AbortController(),
    });
  } else {
    useUploadQueue.getState().updateUpload(id, { abortController: new AbortController() });
  }

  const totalParts = Math.ceil(file.size / CHUNK_SIZE);
  const parts: { ETag: string; PartNumber: number }[] = [...completedParts];
  const partProgress: Record<number, number> = {};
  completedParts.forEach((p) => {
    partProgress[p.PartNumber] = CHUNK_SIZE;
  });

  const uploadPart = async (partNumber: number) => {
    const start = (partNumber - 1) * CHUNK_SIZE;
    const chunk = file.slice(start, Math.min(start + CHUNK_SIZE, file.size));

    const { data: partData } = await axios.post(
      route('api.v1.uploads.multipart.sign-part'),
      { uploadId, partNumber, key },
      { timeout: 30_000 },
    );

    const abortController = useUploadQueue.getState().queue[id]?.abortController;

    const response = await axios.put(partData.upload_url, chunk, {
      headers: { 'Content-Type': 'application/octet-stream' },
      withCredentials: false,
      signal: abortController?.signal,
      timeout: 120_000,
      onUploadProgress: (p) => {
        partProgress[partNumber] = p.loaded ?? 0;
        const totalUploaded = Object.values(partProgress).reduce((s, b) => s + b, 0);
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? totalUploaded / elapsed : 0;
        const eta = speed > 0 ? (file.size - totalUploaded) / speed : 0;
        useUploadQueue.getState().updateUpload(id, {
          progress: Math.round((totalUploaded / file.size) * 100),
          stats: {
            eta,
            speed,
            startTime,
            bytesUploaded: totalUploaded,
            lastUpdateTime: Date.now(),
          },
        });
      },
    });

    const etag = response.headers.etag?.replace(/"/g, '');
    if (!etag) throw new Error(`No ETag received for part ${partNumber}`);
    return { ETag: etag, PartNumber: partNumber };
  };

  const remaining = Array.from({ length: totalParts }, (_, i) => i + 1).filter(
    (n) => !completedParts.some((p) => p.PartNumber === n),
  );

  for (let i = 0; i < remaining.length; i += CONCURRENCY) {
    const batch = remaining.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(uploadPart));
    parts.push(...results);
    useUploadQueue.getState().updateUpload(id, { uploadedParts: parts });
  }

  await axios.post(
    route('api.v1.uploads.multipart.complete'),
    { uploadId, key, parts: parts.sort((a, b) => a.PartNumber - b.PartNumber) },
    { timeout: 60_000 },
  );

  return { key: key!, filename: file.name, mime_type: file.type, size: file.size };
};

// ---------------------------------------------------------------------------
// The actual mutationFn — pure async, no hook deps
// ---------------------------------------------------------------------------
interface UploadInput {
  file: File;
  tempId: string;
  context?: 'publication' | 'profile' | 'workspace'; // upload context for validation
}
interface UploadResult {
  key: string;
  filename: string;
  mime_type: string;
  size: number;
}

const performUpload = async ({ file, tempId, context }: UploadInput): Promise<UploadResult> => {
  const { addUpload, updateUpload, removeUpload } = useUploadQueue.getState();

  const existing = useUploadQueue.getState().queue[tempId];
  if (existing?.status === 'completed' && existing.s3Key) {
    return { key: existing.s3Key, filename: file.name, mime_type: file.type, size: file.size };
  }
  if (existing?.status === 'uploading') {
    throw new Error('Already uploading');
  }

  addUpload(tempId, file);
  updateUpload(tempId, {
    status: 'uploading',
    progress: 0,
    abortController: new AbortController(),
  });

  const startTime = Date.now();

  try {
    const isVideo = file.type.startsWith('video/');
    const result =
      file.size >= MULTIPART_THRESHOLD || isVideo
        ? await uploadMultipart(file, tempId, startTime, context)
        : await uploadSingle(file, tempId, startTime, context);

    updateUpload(tempId, { status: 'completed', progress: 100, s3Key: result.key });
    useMediaStore.getState().updateFile(tempId, {
      status: 'completed',
      file: { key: result.key, filename: file.name, mime_type: file.type, size: file.size } as any,
    });

    // Auto-attach to publication if linked
    const currentUpload = useUploadQueue.getState().queue[tempId];
    if (currentUpload?.publicationId) {
      try {
        let metadata: Record<string, any> = {};
        if (isVideo) {
          try {
            const m = await extractVideoMetadata(file);
            if (m.duration > 0)
              metadata = {
                duration: m.duration,
                width: m.width,
                height: m.height,
                aspect_ratio: m.aspectRatio,
              };
          } catch {
            /* skip metadata on error */
          }
        }

        const { data } = await axios.post(
          route('api.v1.publications.attach-media', currentUpload.publicationId),
          {
            key: result.key,
            filename: file.name,
            mime_type: file.type,
            size: file.size,
            ...metadata,
          },
        );

        if (data.media_file?.id) {
          useMediaStore.getState().updateFile(tempId, { id: data.media_file.id, isNew: false });
        }
      } catch (attachErr) {
        console.error('Failed to attach media after upload', attachErr);
        updateUpload(tempId, { error: 'Failed to attach to publication' });
      }
    }

    return result;
  } catch (error: any) {
    // Pause / cancel — not a real error
    if (axios.isCancel(error) || error.name === 'CanceledError') {
      const current = useUploadQueue.getState().queue[tempId];
      if (current?.status === 'paused') return Promise.reject(error);
      if (current?.status === 'cancelled') {
        removeUpload(tempId);
        useMediaStore.getState().removeFile(tempId);
      }
      return Promise.reject(error);
    }

    const retryCount = useUploadQueue.getState().queue[tempId]?.retryCount ?? 0;
    const canRetry = retryCount < MAX_RETRIES && isRetryableError(error);
    const errorMessage = getErrorMessage(error, retryCount);

    updateUpload(tempId, {
      status: 'error',
      error: errorMessage,
      lastError: error.message,
      canRetry,
    });
    useMediaStore.getState().updateFile(tempId, { status: 'failed' });

    throw error; // let useMutation handle retry
  }
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export const useS3Upload = () => {
  const { t } = useTranslation();

  // Zustand — granular state (progress, stats, errors, pause/resume/cancel)
  const queue = useUploadQueue((s) => s.queue);
  const pauseUpload = useUploadQueue((s) => s.pauseUpload);
  const resumeUpload = useUploadQueue((s) => s.resumeUpload);
  const cancelUpload = useUploadQueue((s) => s.cancelUpload);
  const retryUpload = useUploadQueue((s) => s.retryUpload);

  // Derived maps for consumers
  const progress: Record<string, number> = {};
  const stats: Record<string, { eta?: number; speed?: number }> = {};
  const errors: Record<string, string> = {};
  let isUploading = false;

  for (const item of Object.values(queue)) {
    progress[item.id] = item.progress;
    if (item.stats) stats[item.id] = item.stats;
    if (item.error) errors[item.id] = item.error;
    if (item.status === 'uploading') isUploading = true;
  }

  // useMutation — handles trigger, retry with exponential backoff, callbacks
  const mutation = useMutation<UploadResult, Error, UploadInput>({
    mutationFn: performUpload,

    // Let useMutation drive the retry loop for retryable errors
    retry: (failureCount, error) => {
      if (axios.isCancel(error) || (error as any).name === 'CanceledError') return false;
      return failureCount < MAX_RETRIES && isRetryableError(error);
    },
    retryDelay: (attempt) => getRetryDelay(attempt),

    onSuccess: (result, { file, tempId }) => {
      const currentUpload = useUploadQueue.getState().queue[tempId];
      if (currentUpload?.publicationId) {
        toast.success(
          t('publications.messages.mediaAttached', {
            defaultValue: `${file.name} vinculado correctamente`,
          }),
          { duration: 3000 },
        );
      }
    },

    onError: (error, { file, tempId }) => {
      // Don't toast for pause/cancel
      if (axios.isCancel(error) || (error as any).name === 'CanceledError') return;
      const retryCount = useUploadQueue.getState().queue[tempId]?.retryCount ?? 0;
      const canRetry = retryCount < MAX_RETRIES && isRetryableError(error);
      // Only toast when we've exhausted retries or it's non-retryable
      if (
        !canRetry ||
        (axios.isAxiosError(error) && (error as AxiosError).response?.status === 402)
      ) {
        toast.error(getErrorMessage(error, retryCount));
      }
    },
  });

  // Public uploadFile — accepts optional context parameter
  const uploadFile = useCallback(
    (file: File, tempId: string, context?: 'publication' | 'profile' | 'workspace') => 
      mutation.mutateAsync({ file, tempId, context }),
    [mutation.mutateAsync],
  );

  return {
    uploadFile,
    uploading: isUploading || mutation.isPending,
    progress,
    stats,
    errors,
    // Expose queue controls so consumers don't need to import the store directly
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    // Expose raw mutation state for consumers that want finer control
    uploadStatus: mutation.status, // 'idle' | 'pending' | 'success' | 'error'
    uploadError: mutation.error,
    resetUpload: mutation.reset,
  };
};
