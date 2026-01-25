import { useUploadQueue } from "@/stores/uploadQueueStore";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function GlobalUploadIndicator() {
  const { t } = useTranslation();
  const queue = useUploadQueue((state) => state.queue);
  const removeUpload = useUploadQueue((state) => state.removeUpload);
  const [isMinimized, setIsMinimized] = useState(false);

  const uploads = Object.values(queue);
  const activeUploads = uploads.filter(
    (u) => u.status === "uploading" || u.status === "pending",
  );
  const completedUploads = uploads.filter((u) => u.status === "completed");
  const errorUploads = uploads.filter((u) => u.status === "error");

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeUploads.length > 0) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeUploads.length]);

  if (uploads.length === 0) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-[100] transition-all duration-300 ${isMinimized ? "w-auto" : "w-80"} bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-700/50 cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          {activeUploads.length > 0 ? (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          ) : errorUploads.length > 0 ? (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
          <span className="font-medium text-sm text-gray-700 dark:text-gray-200">
            {activeUploads.length > 0
              ? t("publications.upload.uploadingFiles", {
                  count: activeUploads.length,
                  defaultValue: `Uploading ${activeUploads.length} file(s)...`,
                })
              : errorUploads.length > 0
                ? t("publications.upload.uploadFailed", {
                    defaultValue: "Upload Failed",
                  })
                : t("publications.upload.uploadsCompleted", {
                    defaultValue: "Uploads Completed",
                  })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded">
            {isMinimized ? (
              <Maximize2 className="w-3 h-3" />
            ) : (
              <Minimize2 className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div className="max-h-60 overflow-y-auto custom-scrollbar">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="p-3 border-b border-gray-100 dark:border-neutral-700 last:border-0 relative group"
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className="text-xs font-medium truncate max-w-[180px]"
                  title={upload.file.name}
                >
                  {upload.file.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeUpload(upload.id);
                  }}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 bg-gray-200 dark:bg-neutral-600 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      upload.status === "error"
                        ? "bg-red-500"
                        : upload.status === "completed"
                          ? "bg-green-500"
                          : "bg-blue-500"
                    }`}
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 w-8 text-right">
                  {upload.progress}%
                </span>
              </div>

              <div className="flex justify-between text-[10px] text-gray-400">
                <span>
                  {upload.status === "uploading" && upload.stats?.speed
                    ? `${formatSpeed(upload.stats.speed)}`
                    : ""}
                </span>
                <span>
                  {upload.status === "uploading" && upload.stats?.eta
                    ? `~${formatTime(upload.stats.eta)} ${t("publications.upload.left", { defaultValue: "left" })}`
                    : upload.status === "error"
                      ? upload.error
                      : upload.status === "completed"
                        ? t("publications.upload.done", {
                            defaultValue: "Done",
                          })
                        : t("publications.upload.pending", {
                            defaultValue: "Pending",
                          })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatSpeed(bytesPerSecond: number) {
  if (bytesPerSecond === 0) return "0 B/s";
  const k = 1024;
  const sizes = ["B/s", "KB/s", "MB/s"];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  return (
    parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  );
}

function formatTime(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  return `${mins}m`;
}
