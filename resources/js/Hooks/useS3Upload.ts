import { useMediaStore } from "@/stores/mediaStore";
import { useUploadQueue } from "@/stores/uploadQueueStore";
import { router } from "@inertiajs/react";
import axios from "axios";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export const useS3Upload = () => {
  // Use global store state
  const queue = useUploadQueue((state) => state.queue);
  const addUpload = useUploadQueue((state) => state.addUpload);
  const updateUpload = useUploadQueue((state) => state.updateUpload);
  const removeUpload = useUploadQueue((state) => state.removeUpload);
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
  const MULTIPART_THRESHOLD = 100 * 1024 * 1024;
  const CHUNK_SIZE = 6 * 1024 * 1024;

  const uploadFile = useCallback(
    async (file: File, tempId: string) => {
      // Add to global queue
      addUpload(tempId, file);
      updateUpload(tempId, { status: "uploading", progress: 0 });

      const startTime = Date.now();

      const performUpload = async () => {
        try {
          let result;
          if (file.size >= MULTIPART_THRESHOLD) {
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
              removeUpload(tempId); // Clean up on success
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
          console.error("Upload failed", error);
          updateUpload(tempId, {
            status: "error",
            error: error.message || "Upload failed",
          });
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
    const { data: signData } = await axios.post(route("api.v1.uploads.sign"), {
      filename: file.name,
      content_type: file.type,
    });

    const { upload_url, key } = signData;

    await axios.put(upload_url, file, {
      headers: { "Content-Type": file.type },
      withCredentials: false,
      onUploadProgress: (p) => handleProgress(p, id, startTime, 0, file.size),
    });

    return { key, filename: file.name, mime_type: file.type, size: file.size };
  };

  const uploadMultipart = async (file: File, id: string, startTime: number) => {
    const { data: initData } = await axios.post(
      route("api.v1.uploads.multipart.init"),
      {
        filename: file.name,
        content_type: file.type,
      },
    );

    const { uploadId, key } = initData;
    const totalParts = Math.ceil(file.size / CHUNK_SIZE);
    const parts: { ETag: string; PartNumber: number }[] = [];
    let uploadedBytes = 0;

    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
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

      const response = await axios.put(signData.url, chunk, {
        withCredentials: false,
        headers: { "Content-Type": "" },
        onUploadProgress: (p) => {
          handleProgress(
            { loaded: uploadedBytes + p.loaded, total: file.size } as any,
            id,
            startTime,
            0,
            file.size,
          );
        },
      });

      uploadedBytes += chunk.size;
      const etag = response.headers["etag"]?.replaceAll('"', "");
      if (!etag) throw new Error(`Missing ETag for part ${partNumber}`);
      parts.push({ ETag: etag, PartNumber: partNumber });
    }

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
      const elapsedTime = (Date.now() - startTime) / 1000;
      let stats = {};

      if (elapsedTime > 1) {
        const speed = loaded / elapsedTime;
        const remainingBytes = total - loaded;
        const eta = Math.ceil(remainingBytes / speed);
        stats = { eta, speed };
      }

      updateUpload(id, { progress: percent, stats });
    }
  };

  return {
    uploadFile,
    uploading: isUploading,
    progress,
    stats,
    errors,
  };
};
