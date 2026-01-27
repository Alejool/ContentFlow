import { useUploadQueue } from "@/stores/uploadQueueStore";
import { PageProps } from "@/types";
import { Publication } from "@/types/Publication";
import { usePage } from "@inertiajs/react";
import axios from "axios";
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
  const { props } = usePage<PageProps>();
  const queue = useUploadQueue((state) => state.queue);
  const removeUpload = useUploadQueue((state) => state.removeUpload);
  const [isMinimized, setIsMinimized] = useState(false);
  const [processingItems, setProcessingItems] = useState<Publication[]>([]);

  const uploads = Object.values(queue);

  // Fetch publications in 'processing' or 'publishing' state from the workspace
  const fetchProcessingItems = async () => {
    try {
      const response = await axios.get(route("api.v1.publications.index"), {
        params: { status: "processing,publishing", simplified: "true" },
      });
      if (response.data?.success && response.data?.publications) {
        // Handle both paginated and simple collections
        const items = Array.isArray(response.data.publications)
          ? response.data.publications
          : response.data.publications.data || [];
        setProcessingItems(items);
      }
    } catch (err) {
      console.error("Failed to fetch processing items", err);
    }
  };

  useEffect(() => {
    fetchProcessingItems();
    // Poll every 15 seconds for external processing/publishing changes
    const interval = setInterval(fetchProcessingItems, 15000);

    // Listen for real-time status updates
    if (props.auth?.user?.id) {
      const channel = window.Echo.private(`users.${props.auth.user.id}`);
      channel.listen("PublicationStatusUpdated", () => {
        fetchProcessingItems();
      });

      return () => {
        clearInterval(interval);
        channel.stopListening("PublicationStatusUpdated");
      };
    }

    return () => clearInterval(interval);
  }, [props.auth?.user?.id]);

  const activeUploads = uploads.filter(
    (u) => u.status === "uploading" || u.status === "pending",
  );
  const completedUploads = uploads.filter((u) => u.status === "completed");
  const errorUploads = uploads.filter((u) => u.status === "error");

  // Differentiate between processing and publishing items
  const actualProcessingItems = processingItems.filter(
    (i) => i.status === "processing",
  );
  const publishingItems = processingItems.filter(
    (i) => i.status === "publishing",
  );

  const totalActiveTasks =
    activeUploads.length +
    actualProcessingItems.length +
    publishingItems.length;

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

  if (uploads.length === 0 && processingItems.length === 0) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-[100] transition-all duration-300 ${isMinimized ? "w-auto" : "w-80"} bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden`}
    >
      <div
        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-700/50 cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          {totalActiveTasks > 0 ? (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          ) : errorUploads.length > 0 ? (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
          <span className="font-medium text-sm text-gray-700 dark:text-neutral-200">
            {totalActiveTasks > 0
              ? publishingItems.length > 0
                ? t("publications.modal.upload.publishingSocial", {
                    count: publishingItems.length,
                    defaultValue: `Publicando en redes (${publishingItems.length})...`,
                  })
                : t("publications.modal.upload.uploadingFiles", {
                    count: totalActiveTasks,
                    defaultValue: `Subiendo/Procesando (${totalActiveTasks})...`,
                  })
              : errorUploads.length > 0
                ? t("publications.modal.upload.uploadFailed", {
                    defaultValue: "Upload Failed",
                  })
                : t("publications.modal.upload.uploadsCompleted", {
                    defaultValue: "Uploads Completed",
                  })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded text-gray-500 dark:text-neutral-400">
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
          {/* Current Local Uploads */}
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="p-3 border-b border-gray-100 dark:border-neutral-700 last:border-0 relative group"
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className="text-xs font-medium truncate max-w-[180px] text-neutral-900 dark:text-neutral-100"
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
                <span className="text-[10px] text-gray-500 dark:text-neutral-400 w-8 text-right">
                  {upload.progress}%
                </span>
              </div>

              <div className="flex justify-between text-[10px] text-gray-400 dark:text-neutral-500">
                <span>
                  {upload.status === "uploading" && upload.stats?.speed
                    ? `${formatSpeed(upload.stats.speed)}`
                    : ""}
                </span>
                <span>
                  {upload.status === "uploading" && upload.stats?.eta
                    ? `~${formatTime(upload.stats.eta)} ${t("publications.modal.upload.left", { defaultValue: "left" })}`
                    : upload.status === "error"
                      ? upload.error
                      : upload.status === "completed"
                        ? t("publications.modal.upload.done", {
                            defaultValue: "Done",
                          })
                        : t("publications.modal.upload.pending", {
                            defaultValue: "Pending",
                          })}
                </span>
              </div>
            </div>
          ))}

          {/* External Processing/Publishing Items */}
          {processingItems.map((item) => (
            <div
              key={item.id}
              className="p-3 border-b border-gray-100 dark:border-neutral-700 last:border-0"
            >
              <div className="flex items-center gap-2 mb-1">
                <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                <span
                  className="text-xs font-medium truncate text-neutral-900 dark:text-neutral-100 flex-1"
                  title={item.title}
                >
                  {item.title}
                </span>
                {item.status === "publishing" && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-bold uppercase tracking-wider">
                    {t("common.publishing") || "Publicando"}
                  </span>
                )}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 dark:text-neutral-500">
                <span>
                  {item.status === "publishing"
                    ? t("publications.gallery.sendingToSocial", {
                        defaultValue: "Enviando a plataformas sociales...",
                      })
                    : t("publications.gallery.processing", {
                        defaultValue: "Procesando en segundo plano...",
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
