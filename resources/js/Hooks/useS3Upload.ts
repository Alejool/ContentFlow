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

  const uploadFile = useCallback(async (file: File) => {
    const fileId = file.name; // Simple ID for now
    setUploading(true);
    setProgress((prev) => ({ ...prev, [fileId]: 0 }));

    const startTime = Date.now();

    try {
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
        onUploadProgress: (p) => {
          if (p.total) {
            const percent = Math.round((p.loaded * 100) / p.total);
            setProgress((prev) => ({ ...prev, [fileId]: percent }));

            // Calculate ETA
            const elapsedTime = (Date.now() - startTime) / 1000; // seconds
            if (elapsedTime > 1) {
              // Wait a bit for stable speed
              const speed = p.loaded / elapsedTime; // bytes/sec
              const remainingBytes = p.total - p.loaded;
              const eta = Math.ceil(remainingBytes / speed);

              setStats((prev) => ({
                ...prev,
                [fileId]: { eta, speed },
              }));
            }
          }
        },
      });

      setUploading(false);
      return {
        key,
        filename: file.name,
        mime_type: file.type,
        size: file.size,
        status: "uploaded",
      };
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

  return {
    uploadFile,
    uploading,
    progress,
    stats, // Expose stats
    errors,
  };
};
