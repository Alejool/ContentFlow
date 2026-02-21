import { useMediaStore } from "@/stores/mediaStore";
import { useUploadQueue, type UploadStats } from "@/stores/uploadQueueStore";
import { router } from "@inertiajs/react";
import axios, { AxiosError } from "axios";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

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
  // We recreate the 'progress', 'stats', 'errors' objects for compatibility
  const progress: Record<string, number> = {};
  const stats: Record<string, { eta?: number; speed?: number }> = {};
  const errors: Record<string, string> = {};
  let isUploading = false;

  Object.values(queue).forEach((item) => {
    // We use tempId (item.id) as key.
    // BUT the existing code used file.name. To maintain compat without massive refactor in Modal,
    // we might need to map it, OR update Modal to look up by tempId.
    // Given we are refactoring Modal anyway to pass tempId, let's use tempId as key here.
    // However, the Modal expects keys to be file names currently?
    // Let's check: Modal accesses `uploadProgress[preview.file?.name]`.
    // We should probably migrate Modal to use tempId for robustness, but for now let's direct the Modal
    // to use the file name OR just key by tempId and update Modal.
    // Ideally key by tempId.

    // For now, let's stick to generating these objects keyed by ID (tempId).
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
      // 5xx server errors are retryable
      if (axiosError.response.status >= 500) return true;
      // 408 Request Timeout, 429 Too Many Requests are retryable
      if ([408, 429].includes(axiosError.response.status)) return true;
    }
    // Timeout errors are retryable
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) return true;
    return false;
  };

  // Get user-friendly error message
  const getErrorMessage = (error: any, retryCount: number): string => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (!axiosError.response) {
        return t("publications.modal.upload.errors.network", {
          defaultValue: "Network error. Please check your connection.",
        });
      }
      if (axiosError.response.status === 413) {
        return t("publications.modal.upload.errors.fileSize", {
          defaultValue: "File is too large. Please try a smaller file.",
        });
      }
      if (axiosError.response.status === 415) {
        return t("publications.modal.upload.errors.fileType", {
          defaultValue: "File type not supported.",
        });
      }
      if (axiosError.response.status >= 500) {
        return t("publications.modal.upload.errors.server", {
          defaultValue: "Server error. Retrying...",
        });
      }
    }
    
    if (error.message?.includes("timeout")) {
      return t("publications.modal.upload.errors.timeout", {
        defaultValue: "Upload timed out. Retrying...",
      });
    }

    return error.message || t("publications.modal.upload.errors.unknown", {
      defaultValue: "Upload failed. Please try again.",
    });
  };

  const uploadFile = useCallback(
    async (file: File, tempId: string) => {
      // PROACTIVELY CHECK if this file is already being uploaded or is completed
      const existingItem = useUploadQueue.getState().queue[tempId];
      if (
        existingItem &&
        (existingItem.status === "uploading" ||
          existingItem.status === "completed")
      ) {
        // If it's already uploading, we don't want to reset it or re-fire the whole process
        // But we might want to return the existing promise if we were tracking it.
        // For now, just skip the reset to avoid the "jumping progress" (5% -> 0%).

        // If it's already completed, we can just return the result (if we stored it)
        if (existingItem.status === "completed" && existingItem.s3Key) {
          return {
            key: existingItem.s3Key,
            filename: file.name,
            mime_type: file.type,
            size: file.size,
          };
        }

        // If it's uploading but we called it again (e.g. from a redundant wrapper),
        // we should ideally wait for the existing one. However, the existing 'performUpload'
        // will update the store when done.
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

      const performUpload = async () => {
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

          // Check if we need to attach to a publication (Background Upload feature)
          const currentItem = useUploadQueue.getState().queue[tempId];

          // SYNC status back to mediaStore so UI reflects completion even before saving
          useMediaStore.getState().updateFile(tempId, {
            status: "completed",
            file: {
              key: result.key,
              filename: file.name,
              mime_type: file.type,
              size: file.size,
            } as any,
          });

          if (currentItem?.publicationId) {
            try {
              const { data } = await axios.post(
                route(
                  "api.v1.publications.attach-media",
                  currentItem.publicationId,
                ),
                {
                  key: result.key,
                  filename: file.name,
                  mime_type: file.type,
                  size: file.size,
                },
              );

              // SYNC DB ID back to mediaStore so deletion works correctly!
              if (data.media_file?.id) {
                useMediaStore.getState().updateFile(tempId, {
                  id: data.media_file.id,
                  isNew: false, // Mark as existing now
                });
              }

              toast.success(
                t("publications.messages.mediaAttached", {
                  title:
                    currentItem.publicationTitle ||
                    data.publication?.title ||
                    "...",
                }),
              );
              router.reload({ only: ["publications", "publication"] }); // Refresh data to show new media
              // removeUpload(tempId); // REMOVED: Keep in queue for GlobalUploadIndicator visibility
            } catch (attachErr) {
              console.error(
                "Failed to attach media after background upload",
                attachErr,
              );
              toast.error(
                "Upload finished but failed to attach to publication",
              );
              updateUpload(tempId, { error: "Failed to attach" });
            }
          }

          return result;
        } catch (error: any) {
          // Check if error is due to cancellation/pause
          if (axios.isCancel(error) || error.name === "CanceledError") {
            const currentUpload = useUploadQueue.getState().queue[tempId];
            if (currentUpload?.status === "paused") {
              // Upload was paused, don't treat as error
              return;
            } else if (currentUpload?.status === "cancelled") {
              // Upload was cancelled, clean up S3 resources
              await handleCancelCleanup(tempId);
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

          // Auto-retry with exponential backoff if error is retryable
          if (canRetry) {
            const delay = getRetryDelay(retryCount);
            setTimeout(async () => {
              // Check if upload wasn't cancelled during delay
              const upload = useUploadQueue.getState().queue[tempId];
              if (upload && upload.status === "error") {
                await handleRetry(tempId);
              }
            }, delay);
          }

          throw error;
        }
      };

      // Fire and forget (let it run detached)
      // Note: We return the promise so the Modal *can* await it if it stays open.
      return performUpload();
    },
    [addUpload, updateUpload],
  );

  const uploadSingle = async (file: File, id: string, startTime: number) => {
    try {
      const { data: signData } = await axios.post(route("api.v1.uploads.sign"), {
        filename: file.name,
        content_type: file.type,
      });

      const { upload_url, key } = signData;

      console.log('📤 Starting single file upload', {
        filename: file.name,
        size: file.size,
        type: file.type,
        key: key,
      });

      // Get abort controller from store
      const currentUpload = useUploadQueue.getState().queue[id];
      const abortController = currentUpload?.abortController;

      await axios.put(upload_url, file, {
        headers: { "Content-Type": file.type },
        withCredentials: false,
        signal: abortController?.signal,
        onUploadProgress: (p) => handleProgress(p, id, startTime, 0, file.size),
      });

      console.log('✅ Single file upload completed', {
        filename: file.name,
        key: key,
      });

      return { key, filename: file.name, mime_type: file.type, size: file.size };
    } catch (error: any) {
      // Check if error is due to cancellation
      if (axios.isCancel(error) || error.name === "CanceledError") {
        console.log('Upload cancelled:', file.name);
        throw error; // Re-throw to be handled by caller
      }

      console.error('❌ Single file upload failed', {
        filename: file.name,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
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
      const { data: initData } = await axios.post(
        route("api.v1.uploads.multipart.init"),
        {
          filename: file.name,
          content_type: file.type,
        },
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

      const { data: signData } = await axios.post(
        route("api.v1.uploads.multipart.sign-part"),
        {
          key,
          uploadId,
          partNumber,
        },
      );

      // Get current abort controller
      const upload = useUploadQueue.getState().queue[id];
      const abortController = upload?.abortController;

      const response = await axios.put(signData.url, chunk, {
        withCredentials: false,
        headers: { "Content-Type": "" },
        signal: abortController?.signal,
        onUploadProgress: (p) => {
          partProgress[partNumber] = p.loaded;
          // Calculate collective progress across all parallel chunks
          const totalLoaded = Object.values(partProgress).reduce(
            (a, b) => a + b,
            0,
          );
          handleProgress(
            { loaded: totalLoaded, total: file.size } as any,
            id,
            startTime,
            0,
            file.size,
          );
        },
      });

      const etag = response.headers["etag"]?.replaceAll('"', "");
      if (!etag) throw new Error(`Missing ETag for part ${partNumber}`);
      
      const partResult = { ETag: etag, PartNumber: partNumber };
      
      // Update stored parts in real-time for pause/resume
      const currentParts = useUploadQueue.getState().queue[id]?.uploadedParts || [];
      updateUpload(id, {
        uploadedParts: [...currentParts, partResult],
      });
      
      return partResult;
    };

    // Determine which parts still need to be uploaded
    const completedPartNumbers = new Set(completedParts.map((p) => p.PartNumber));
    const remainingParts = Array.from({ length: totalParts }, (_, i) => i + 1)
      .filter((partNum) => !completedPartNumbers.has(partNum));

    // Parallel processing with concurrency limit
    const queue = [...remainingParts];
    const workers = Array(Math.min(CONCURRENCY, queue.length))
      .fill(null)
      .map(async () => {
        while (queue.length > 0) {
          const partNumber = queue.shift()!;
          const res = await uploadPart(partNumber);
          parts.push(res);
        }
      });

    await Promise.all(workers);

    // Sort parts by part number before completing
    parts.sort((a, b) => a.PartNumber - b.PartNumber);

    await axios.post(route("api.v1.uploads.multipart.complete"), {
      key,
      uploadId,
      parts,
    });
    
    return { key, filename: file.name, mime_type: file.type, size: file.size };
  };

  const handleProgress = (
    p: any,
    id: string,
    startTime: number,
    offset: number,
    totalSize?: number,
  ) => {
    const loaded = p.loaded + offset;
    const total = totalSize || p.total;

    if (total) {
      const percent = Math.round((loaded * 100) / total);
      const currentTime = Date.now();
      const elapsedTime = (currentTime - startTime) / 1000;
      let stats: UploadStats | undefined = undefined;

      if (elapsedTime > 1) {
        const speed = loaded / elapsedTime;
        const remainingBytes = total - loaded;
        const eta = Math.ceil(remainingBytes / speed);
        stats = {
          eta,
          speed,
          startTime,
          bytesUploaded: loaded,
          lastUpdateTime: currentTime,
        };
      }

      updateUpload(id, { progress: percent, stats });
    }
  };

  const handleCancelCleanup = async (id: string) => {
    const upload = useUploadQueue.getState().queue[id];
    if (!upload) return;

    try {
      // Call the cancel endpoint with the upload ID and S3 key
      await axios.delete(route("api.v1.uploads.cancel", { uploadId: id }), {
        data: {
          s3_key: upload.s3Key,
          multipart_upload_id: upload.uploadId || null,
        },
      });
    } catch (error) {
      console.error("Failed to cleanup cancelled upload:", error);
      // Continue anyway - the upload is cancelled from user perspective
    }

    // Update the file status in mediaStore to remove "uploading" state
    const { updateFile } = useMediaStore.getState();
    updateFile(id, { status: "failed" }); // Mark as failed so it can be removed or retried
  };

  const handlePause = useCallback(
    (id: string) => {
      pauseUpload(id);
    },
    [pauseUpload],
  );

  const handleResume = useCallback(
    async (id: string) => {
      const upload = useUploadQueue.getState().queue[id];
      if (!upload || upload.status !== "paused") return;

      // Resume the upload
      resumeUpload(id);

      // Restart the upload process from where it left off
      const startTime = upload.stats?.startTime || Date.now();
      
      try {
        let result;
        const isVideo = upload.file.type.startsWith("video/");
        if (upload.file.size >= MULTIPART_THRESHOLD || isVideo) {
          result = await uploadMultipart(upload.file, id, startTime);
        } else {
          // Single uploads can't really resume, would need to restart
          result = await uploadSingle(upload.file, id, startTime);
        }

        // Success!
        updateUpload(id, {
          status: "completed",
          progress: 100,
          s3Key: result.key,
        });

        // Sync to mediaStore
        useMediaStore.getState().updateFile(id, {
          status: "completed",
          file: {
            key: result.key,
            filename: upload.file.name,
            mime_type: upload.file.type,
            size: upload.file.size,
          } as any,
        });

        // Handle publication attachment if needed
        if (upload.publicationId) {
          try {
            const { data } = await axios.post(
              route("api.v1.publications.attach-media", upload.publicationId),
              {
                key: result.key,
                filename: upload.file.name,
                mime_type: upload.file.type,
                size: upload.file.size,
              },
            );

            if (data.media_file?.id) {
              useMediaStore.getState().updateFile(id, {
                id: data.media_file.id,
                isNew: false,
              });
            }

            toast.success(
              t("publications.messages.mediaAttached", {
                title: upload.publicationTitle || data.publication?.title || "...",
              }),
            );
            router.reload({ only: ["publications", "publication"] });
          } catch (attachErr) {
            console.error("Failed to attach media after resume", attachErr);
            toast.error("Upload finished but failed to attach to publication");
            updateUpload(id, { error: "Failed to attach" });
          }
        }
      } catch (error: any) {
        if (axios.isCancel(error) || error.name === "CanceledError") {
          const currentUpload = useUploadQueue.getState().queue[id];
          if (currentUpload?.status === "paused") {
            return;
          } else if (currentUpload?.status === "cancelled") {
            await handleCancelCleanup(id);
            return;
          }
        }

        console.error("Resume failed", error);
        updateUpload(id, {
          status: "error",
          error: error.message || "Resume failed",
        });
      }
    },
    [resumeUpload, updateUpload, t],
  );

  const handleCancel = useCallback(
    async (id: string) => {
      cancelUpload(id);
      await handleCancelCleanup(id);
    },
    [cancelUpload],
  );

  const handleRetry = useCallback(
    async (id: string) => {
      const upload = useUploadQueue.getState().queue[id];
      if (!upload || upload.status !== "error") return;

      // Update retry count and reset to pending
      retryUpload(id);

      // Wait a tick for state to update
      await new Promise(resolve => setTimeout(resolve, 0));

      // Restart the upload process, attempting to resume from last chunk if possible
      const updatedUpload = useUploadQueue.getState().queue[id];
      if (!updatedUpload) return;

      const startTime = updatedUpload.stats?.startTime || Date.now();
      
      try {
        updateUpload(id, { status: "uploading" });

        let result;
        const isVideo = updatedUpload.file.type.startsWith("video/");
        
        // For multipart uploads with existing parts, try to resume
        if (updatedUpload.uploadId && updatedUpload.uploadedParts && updatedUpload.uploadedParts.length > 0) {
          result = await uploadMultipart(updatedUpload.file, id, startTime);
        } else if (updatedUpload.file.size >= MULTIPART_THRESHOLD || isVideo) {
          result = await uploadMultipart(updatedUpload.file, id, startTime);
        } else {
          result = await uploadSingle(updatedUpload.file, id, startTime);
        }

        // Success!
        updateUpload(id, {
          status: "completed",
          progress: 100,
          s3Key: result.key,
        });

        // Sync to mediaStore
        useMediaStore.getState().updateFile(id, {
          status: "completed",
          file: {
            key: result.key,
            filename: updatedUpload.file.name,
            mime_type: updatedUpload.file.type,
            size: updatedUpload.file.size,
          } as any,
        });

        // Handle publication attachment if needed
        if (updatedUpload.publicationId) {
          try {
            const { data } = await axios.post(
              route("api.v1.publications.attach-media", updatedUpload.publicationId),
              {
                key: result.key,
                filename: updatedUpload.file.name,
                mime_type: updatedUpload.file.type,
                size: updatedUpload.file.size,
              },
            );

            if (data.media_file?.id) {
              useMediaStore.getState().updateFile(id, {
                id: data.media_file.id,
                isNew: false,
              });
            }

            toast.success(
              t("publications.messages.mediaAttached", {
                title: updatedUpload.publicationTitle || data.publication?.title || "...",
              }),
            );
            router.reload({ only: ["publications", "publication"] });
          } catch (attachErr) {
            console.error("Failed to attach media after retry", attachErr);
            toast.error("Upload finished but failed to attach to publication");
            updateUpload(id, { error: "Failed to attach" });
          }
        }
      } catch (error: any) {
        if (axios.isCancel(error) || error.name === "CanceledError") {
          const currentUpload = useUploadQueue.getState().queue[id];
          if (currentUpload?.status === "paused") {
            return;
          } else if (currentUpload?.status === "cancelled") {
            await handleCancelCleanup(id);
            return;
          }
        }

        console.error("Retry failed", error);
        
        const currentUpload = useUploadQueue.getState().queue[id];
        const retryCount = currentUpload?.retryCount || 0;
        const canRetry = retryCount < MAX_RETRIES && isRetryableError(error);
        const errorMessage = getErrorMessage(error, retryCount);
        
        updateUpload(id, {
          status: "error",
          error: errorMessage,
          lastError: error.message,
          canRetry,
        });

        // Auto-retry again if still within limits
        if (canRetry) {
          const delay = getRetryDelay(retryCount);
          setTimeout(async () => {
            const upload = useUploadQueue.getState().queue[id];
            if (upload && upload.status === "error") {
              await handleRetry(id);
            }
          }, delay);
        }
      }
    },
    [retryUpload, updateUpload, t],
  );

  return {
    uploadFile,
    uploading: isUploading,
    progress,
    stats,
    errors,
    pauseUpload: handlePause,
    resumeUpload: handleResume,
    cancelUpload: handleCancel,
    retryUpload: handleRetry,
  };
};
