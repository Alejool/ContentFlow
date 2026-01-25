import axios from "axios";
import { useCallback, useState } from "react";

interface UploadProgress {
  [key: string]: number;
}

interface UploadStats {
  [key: string]: {
    eta?: number; // seconds
    speed?: number; // bytes per second
  };
}

export const useS3Upload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({});
  const [stats, setStats] = useState<UploadStats>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Threshold for switching to Multipart Upload (e.g., 100MB for robustness)
  const MULTIPART_THRESHOLD = 100 * 1024 * 1024;
  const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB chunks (S3 requires min 5MB)

  const uploadFile = useCallback(async (file: File) => {
    const fileId = file.name;
    setUploading(true);
    setProgress((prev) => ({ ...prev, [fileId]: 0 }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fileId];
      return newErrors;
    });

    const startTime = Date.now();

    try {
      if (file.size >= MULTIPART_THRESHOLD) {
        return await uploadMultipart(file, fileId, startTime);
      } else {
        return await uploadSingle(file, fileId, startTime);
      }
    } catch (error: any) {
      console.error("Upload failed", error);
      setErrors((prev) => ({
        ...prev,
        [fileId]: error.message || "Upload failed",
      }));
      setUploading(false);
      throw error;
    }
  }, []);

  const uploadSingle = async (
    file: File,
    fileId: string,
    startTime: number,
  ) => {
    // 1. Get presigned URL from backend
    const { data: signData } = await axios.post(route("upload.sign"), {
      filename: file.name,
      content_type: file.type,
    });

    const { upload_url, key } = signData;

    // 2. Upload directly to S3
    await axios.put(upload_url, file, {
      headers: {
        "Content-Type": file.type,
      },
      withCredentials: false,
      onUploadProgress: (p) =>
        handleProgress(p, fileId, startTime, 0, file.size),
    });

    setUploading(false);
    return {
      key,
      filename: file.name,
      mime_type: file.type,
      size: file.size,
      status: "uploaded",
    };
  };

  const uploadMultipart = async (
    file: File,
    fileId: string,
    startTime: number,
  ) => {
    // 1. Initiate Multipart Upload
    const { data: initData } = await axios.post(
      route("upload.multipart.init"),
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

      // 2. Sign Part
      const { data: signData } = await axios.post(
        route("upload.multipart.sign-part"),
        {
          key,
          uploadId,
          partNumber,
        },
      );

      // 3. Upload Part
      const response = await axios.put(signData.url, chunk, {
        withCredentials: false,
        headers: { "Content-Type": "" }, // S3 quirks: sometimes empty content type for parts helps avoid signature mismatch? Or should match? Usually empty for parts works best or just let browser set it.
        onUploadProgress: (p) => {
          const partLoaded = p.loaded;
          const totalLoadedSoFar = uploadedBytes + partLoaded;
          // Emulate a total progress event
          handleProgress(
            { loaded: totalLoadedSoFar, total: file.size } as any,
            fileId,
            startTime,
            0,
            file.size,
          );
        },
      });

      uploadedBytes += chunk.size;

      // 4. Collect ETag
      // ETag header is often quoted like "etag", verify if we need to trim quotes
      const etag = response.headers["etag"]?.replaceAll('"', "");
      if (!etag) throw new Error(`Missing ETag for part ${partNumber}`);

      parts.push({ ETag: etag, PartNumber: partNumber });
    }

    // 5. Complete Multipart Upload
    await axios.post(route("upload.multipart.complete"), {
      key,
      uploadId,
      parts,
    });

    setUploading(false);
    return {
      key,
      filename: file.name,
      mime_type: file.type,
      size: file.size,
      status: "uploaded",
    };
  };

  const handleProgress = (
    p: any,
    fileId: string,
    startTime: number,
    offset: number = 0,
    totalSize?: number,
  ) => {
    const loaded = p.loaded + offset;
    const total = totalSize || p.total;

    if (total) {
      const percent = Math.round((loaded * 100) / total);
      setProgress((prev) => ({ ...prev, [fileId]: percent }));

      // Calculate ETA
      const elapsedTime = (Date.now() - startTime) / 1000; // seconds
      if (elapsedTime > 1) {
        const speed = loaded / elapsedTime; // bytes/sec
        const remainingBytes = total - loaded;
        const eta = Math.ceil(remainingBytes / speed);

        setStats((prev) => ({
          ...prev,
          [fileId]: { eta, speed },
        }));
      }
    }
  };

  return {
    uploadFile,
    uploading,
    progress,
    stats, // Expose stats
    errors,
  };
};
