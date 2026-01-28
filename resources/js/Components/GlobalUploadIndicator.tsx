import { useConfirm } from "@/Hooks/useConfirm";
import { useUploadQueue } from "@/stores/uploadQueueStore";
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
  const { queue, removeUpload } = useUploadQueue();
  const [isMinimized, setIsMinimized] = useState(false);
  const [processingItems, setProcessingItems] = useState<Publication[]>([]);
  const [dismissedPublicationIds, setDismissedPublicationIds] = useState<
    number[]
  >([]);
  const { t } = useTranslation();
  const props = usePage().props as any;

  const uploads = Object.values(queue);

  // Fetch publications in 'processing', 'publishing', or recently 'failed' state
  const fetchProcessingItems = async () => {
    try {
      const response = await axios.get(route("api.v1.publications.index"), {
        params: {
          status: "processing,publishing,failed,published",
          simplified: "true",
        },
      });
      if (response.data?.success && response.data?.publications) {
        const items: Publication[] = Array.isArray(response.data.publications)
          ? response.data.publications
          : response.data.publications.data || [];

        // Filter: Keep all processing/publishing/published(recent/not dismissed)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const filtered = items.filter((item) => {
          if (item.status === "processing" || item.status === "publishing")
            return true;

          if (item.status === "failed" || item.status === "published") {
            // If already dismissed, hide it
            if (dismissedPublicationIds.includes(item.id)) return false;

            const updatedAt = new Date(item.updated_at || "");
            // Keep failures/successes for 5 mins automatically, OR indefinitely if they are the most recent ones
            return updatedAt > fiveMinutesAgo;
          }
          return false;
        });

        setProcessingItems(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch processing items", err);
    }
  };

  useEffect(() => {
    fetchProcessingItems();
    // Poll every 10 seconds for more responsive updates
    const interval = setInterval(fetchProcessingItems, 10000);

    // Listen for real-time status updates
    if (props.auth?.user?.id) {
      const channel = window.Echo.private(`users.${props.auth.user.id}`);
      channel.listen(".PublicationStatusUpdated", () => {
        fetchProcessingItems();
      });

      return () => {
        clearInterval(interval);
        channel.stopListening(".PublicationStatusUpdated");
      };
    }

    return () => clearInterval(interval);
  }, [props.auth?.user?.id]);

  // Filter out dismissed items for rendering
  const visibleProcessingItems = processingItems.filter(
    (item) => !dismissedPublicationIds.includes(item.id),
  );

  const activeUploads = uploads.filter(
    (u) => u.status === "uploading" || u.status === "pending",
  );
  const errorUploads = uploads.filter((u) => u.status === "error");

  // Differentiate between status types based on VISIBLE items
  const publishingItems = visibleProcessingItems.filter(
    (i) => i.status === "publishing",
  );
  const failedItems = visibleProcessingItems.filter(
    (i) => i.status === "failed",
  );
  const completedItems = visibleProcessingItems.filter(
    (i) => i.status === "published",
  );

  const totalActiveTasks =
    activeUploads.length +
    visibleProcessingItems.filter(
      (i) => i.status !== "failed" && i.status !== "published",
    ).length;

  const { confirm, ConfirmDialog } = useConfirm();

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

  const handleCancelPublication = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();

    const isConfirmed = await confirm({
      title:
        t("publications.modal.cancel_confirmation.title") ||
        "Cancelar Publicación",
      message:
        t("publications.modal.cancel_confirmation.message") ||
        "¿Estás seguro de que deseas cancelar esta publicación? El envío a redes se detendrá.",
      confirmText:
        t("publications.modal.cancel_confirmation.confirm") || "Sí, cancelar",
      cancelText:
        t("publications.modal.cancel_confirmation.cancel") || "No, continuar",
      type: "danger",
    });

    if (!isConfirmed) return;

    try {
      await axios.post(route("api.v1.publications.cancel", id));
      fetchProcessingItems();
    } catch (err) {
      console.error("Failed to cancel publication", err);
    }
  };

  const handleDismissPublication = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDismissedPublicationIds((prev) => [...prev, id]);
    // Optimization: avoid waiting for next fetch
    setProcessingItems((prev) => prev.filter((item) => item.id !== id));
  };

  if (uploads.length === 0 && visibleProcessingItems.length === 0) return null;

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
          ) : errorUploads.length > 0 || failedItems.length > 0 ? (
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
              : errorUploads.length > 0 || failedItems.length > 0
                ? t("publications.modal.upload.uploadFailed", {
                    defaultValue: "Algo salió mal",
                  })
                : completedItems.length > 0
                  ? t("publications.modal.upload.uploadsCompleted", {
                      defaultValue: "Procesos completados",
                    })
                  : t("publications.modal.upload.uploadsCompleted", {
                      defaultValue: "Subidas completadas",
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
                <div className="flex-1 bg-gray-100 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-out ${
                      upload.status === "error"
                        ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                        : upload.status === "completed"
                          ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                          : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    }`}
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300 w-8 text-right">
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
                    ? `~${formatTime(upload.stats.eta)} ${t("publications.modal.upload.left", { defaultValue: "restante" })}`
                    : upload.status === "error"
                      ? upload.error
                      : upload.status === "completed"
                        ? t("publications.modal.upload.done", {
                            defaultValue: "Listo",
                          })
                        : t("publications.modal.upload.pending", {
                            defaultValue: "Pendiente",
                          })}
                </span>
              </div>
            </div>
          ))}

          {/* External Processing/Publishing/Failed Items */}
          {visibleProcessingItems.map((item) => (
            <div
              key={item.id}
              className="p-3 border-b border-gray-100 dark:border-neutral-700 last:border-0 relative group"
            >
              <div className="flex items-center gap-2 mb-1">
                {item.status === "failed" ? (
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                ) : (
                  <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                )}
                <span
                  className="text-xs font-medium truncate text-neutral-900 dark:text-neutral-100 flex-1"
                  title={item.title}
                >
                  {item.title}
                </span>
                <div className="flex items-center gap-1.5">
                  {item.status === "failed" || item.status === "published" ? (
                    <button
                      onClick={(e) => handleDismissPublication(e, item.id)}
                      className="text-gray-400 hover:text-green-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={t("common.dismiss") || "Descartar"}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  ) : (
                    (item.status === "publishing" ||
                      item.status === "processing") && (
                      <button
                        onClick={(e) => handleCancelPublication(e, item.id)}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={
                          t("publications.publish.button.cancel") ||
                          "Cancelar envío"
                        }
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )
                  )}
                  {item.status === "publishing" && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-bold uppercase tracking-wider">
                      {t("common.publishing") || "Publicando"}
                    </span>
                  )}
                  {item.status === "published" && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-bold uppercase tracking-wider">
                      {t("common.success") || "Éxito"}
                    </span>
                  )}
                  {item.status === "failed" && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-bold uppercase tracking-wider">
                      {t("common.failed") || "Falló"}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 text-[10px] text-gray-400 dark:text-neutral-500">
                {(item as any).platform_status_summary ? (
                  <div className="space-y-2 mt-2">
                    {/* Progress Bar for Publication */}
                    {(() => {
                      const platforms = Object.values(
                        (item as any).platform_status_summary,
                      );
                      const total = platforms.length;
                      const completed = platforms.filter(
                        (p: any) =>
                          p.status === "published" || p.status === "failed",
                      ).length;
                      const progress =
                        total > 0
                          ? Math.max(5, Math.round((completed / total) * 100))
                          : 0;

                      return (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-bold">
                            <span className="text-blue-500 dark:text-blue-400">
                              {t("common.progress") || "Progreso"}
                            </span>
                            <span className="text-neutral-500 dark:text-neutral-400">
                              {completed}/{total}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)] ${item.status === "failed" ? "bg-red-500" : "bg-blue-500"}`}
                                style={{
                                  width: `${item.status === "failed" ? 100 : progress}%`,
                                }}
                              />
                            </div>
                            <span className="w-8 text-right font-medium">
                              {item.status === "failed" ? "100" : progress}%
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="space-y-1.5 pt-1 border-t border-gray-50 dark:border-neutral-700/50">
                      {Object.values((item as any).platform_status_summary)
                        .filter((platform: any) => {
                          // SMART FILTER: Only show platforms that were part of this publishing attempt.
                          // A platform is relevant if it's currently publishing, failed, or was published recently.
                          // We use 5 minutes as a safety margin for "recent" status.
                          const logDate = platform.published_at
                            ? new Date(platform.published_at)
                            : new Date(item.updated_at || "");
                          const fiveMinsAgo = new Date(
                            Date.now() - 5 * 60 * 1000,
                          );

                          return (
                            platform.status === "publishing" ||
                            platform.status === "pending" ||
                            logDate > fiveMinsAgo
                          );
                        })
                        .map((platform: any, idx) => {
                          const isDone = platform.status === "published";
                          const isFailed = platform.status === "failed";
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between"
                            >
                              <span className="capitalize text-neutral-600 dark:text-neutral-400">
                                {platform.platform}:
                              </span>
                              <div className="flex items-center gap-1.5">
                                {platform.status === "publishing" ||
                                platform.status === "pending" ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin text-blue-500" />
                                ) : isDone ? (
                                  <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                                ) : (
                                  <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
                                )}
                                <span
                                  className={`font-medium ${
                                    isDone
                                      ? "text-green-600 dark:text-green-400"
                                      : isFailed
                                        ? "text-red-500 dark:text-red-400"
                                        : "text-blue-500 dark:text-blue-400"
                                  }`}
                                >
                                  {isDone
                                    ? "Enviado"
                                    : isFailed
                                      ? "Falló"
                                      : "Enviando..."}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 mt-2">
                    <div className="flex-1 bg-gray-100 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400/50 animate-pulse w-full" />
                    </div>
                    <span className="block text-center italic opacity-70">
                      {item.status === "publishing"
                        ? t("publications.gallery.sendingToSocial", {
                            defaultValue: "Iniciando envío a redes...",
                          })
                        : item.status === "failed"
                          ? "Error en el procesamiento"
                          : t("publications.gallery.processing", {
                              defaultValue: "Procesando archivos...",
                            })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog />
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
