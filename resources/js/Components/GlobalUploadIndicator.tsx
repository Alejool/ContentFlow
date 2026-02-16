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
  const [isFetching, setIsFetching] = useState(false);
  const { t } = useTranslation();
  const props = usePage().props as any;

  const uploads = Object.values(queue);

  // Fetch publications in 'processing', 'publishing', or recently 'failed' state
  const fetchProcessingItems = async (signal?: AbortSignal) => {
    // Prevent concurrent calls
    if (isFetching) {
      return;
    }

    try {
      setIsFetching(true);
      const response = await axios.get(route("api.v1.publications.index"), {
        params: {
          status: "processing,publishing,failed,published",
          simplified: "true",
        },
        signal, // Pass abort signal for cancellation
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
      // Ignore abort errors
      if (axios.isCancel(err) || (err as any)?.name === "CanceledError") {
        return;
      }
      console.error("Failed to fetch processing items", err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();

    // Initial fetch
    fetchProcessingItems(abortController.signal);

    // Only poll if WebSocket is NOT available
    // When WebSocket is active, real-time events handle updates
    let interval: NodeJS.Timeout | null = null;

    if (!props.auth?.user?.id || !window.Echo) {
      // No WebSocket available, use polling as fallback
      interval = setInterval(() => {
        fetchProcessingItems(abortController.signal);
      }, 30000); // 30 seconds polling interval
    }

    // Listen for real-time status updates via WebSocket
    if (props.auth?.user?.id && window.Echo) {
      const channel = window.Echo.private(`users.${props.auth.user.id}`);
      channel.listen(".PublicationStatusUpdated", () => {
        fetchProcessingItems(abortController.signal);
      });

      return () => {
        if (interval) clearInterval(interval);
        abortController.abort();
        channel.stopListening(".PublicationStatusUpdated");
      };
    }

    return () => {
      if (interval) clearInterval(interval);
      abortController.abort();
    };
  }, [props.auth?.user?.id, dismissedPublicationIds]);

  useEffect(() => {
    const abortController = new AbortController();

    const handlePublicationStarted = () => {
      fetchProcessingItems(abortController.signal);
    };

    window.addEventListener("publication-started", handlePublicationStarted);

    return () => {
      abortController.abort();
      window.removeEventListener(
        "publication-started",
        handlePublicationStarted,
      );
    };
  }, []);

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
      (i) => i.status === "processing" || i.status === "publishing",
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
      // Fetch immediately after cancellation
      const abortController = new AbortController();
      fetchProcessingItems(abortController.signal);
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
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : errorUploads.length > 0 || failedItems.length > 0 ? (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
          <span className="font-medium text-sm text-gray-700 dark:text-neutral-200">
            {totalActiveTasks > 0
              ? activeUploads.length > 0 && publishingItems.length > 0
                ? t("publications.modal.upload.activeTasks", {
                    count: totalActiveTasks,
                    defaultValue: `Archivos y Publicaciones (${totalActiveTasks})...`,
                  })
                : publishingItems.length > 0
                  ? t("publications.modal.upload.publishingSocial", {
                      count: publishingItems.length,
                      defaultValue: `Publicando en redes (${publishingItems.length})...`,
                    })
                  : t("publications.modal.upload.uploadingFiles", {
                      count: activeUploads.length,
                      defaultValue: `Subiendo archivos (${activeUploads.length})...`,
                    })
              : errorUploads.length > 0 || failedItems.length > 0
                ? t("publications.modal.upload.uploadFailed", {
                    defaultValue: "Algo salió mal",
                  })
                : completedItems.length > 0 ||
                    uploads.some((u) => u.status === "completed")
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
          {/* SECTION: LOCAL FILE UPLOADS */}
          {uploads.length > 0 && (
            <div>
              <div className="bg-gray-50/50 dark:bg-neutral-700/30 px-3 py-1.5 flex items-center justify-between border-b border-gray-100 dark:border-neutral-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                  {t("common.files") || "Archivos"}
                </span>
                <span className="text-[10px] font-medium text-gray-400 dark:text-neutral-500">
                  {activeUploads.length} activos
                </span>
              </div>
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
                              : "bg-primary shadow-[0_0_8px_rgba(99,102,241,0.5)]"
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
            </div>
          )}

          {/* SECTION: SERVER PUBLICATIONS */}
          {visibleProcessingItems.length > 0 && (
            <div
              className={
                uploads.length > 0
                  ? "border-t-2 border-gray-100 dark:border-neutral-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
                  : ""
              }
            >
              <div className="bg-gray-50/50 dark:bg-neutral-700/30 px-3 py-1.5 flex items-center justify-between border-b border-gray-100 dark:border-neutral-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                  {t("common.publications") || "Publicaciones"}
                </span>
                <span className="text-[10px] font-medium text-gray-400 dark:text-neutral-500">
                  {publishingItems.length} en curso
                </span>
              </div>
              {visibleProcessingItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border-b border-gray-100 dark:border-neutral-700 last:border-0 relative group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {item.status === "failed" ? (
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    ) : item.status === "publishing" ||
                      item.status === "processing" ? (
                      <Loader2 className="w-3 h-3 text-primary animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    )}
                    <span
                      className="text-xs font-medium truncate text-neutral-900 dark:text-neutral-100 flex-1"
                      title={item.title}
                    >
                      {item.title}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.status === "failed" ||
                      item.status === "published" ? (
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
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light font-bold uppercase tracking-wider">
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
                        {Object.values((item as any).platform_status_summary)
                          .filter((platform: any) => {
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
                            const isPublishing = platform.status === "publishing" || platform.status === "pending";
                            const progress = isDone ? 100 : isFailed ? 100 : isPublishing ? 50 : 0;
                            
                            return (
                              <div
                                key={idx}
                                className="space-y-1.5 p-2 rounded-lg bg-gray-50/80 dark:bg-neutral-700/40 border border-gray-100 dark:border-neutral-600/50"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {isPublishing ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                    ) : isDone ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                    ) : (
                                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                    )}
                                    <span className="capitalize font-semibold text-[11px] text-neutral-800 dark:text-neutral-200">
                                      {platform.platform}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                      isDone
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                        : isFailed
                                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                          : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light"
                                    }`}
                                  >
                                    {isDone
                                      ? "Enviado"
                                      : isFailed
                                        ? "Falló"
                                        : "Enviando"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 dark:bg-neutral-600 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-500 ease-out ${
                                        isFailed
                                          ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                          : isDone
                                            ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                                            : "bg-primary shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                      } ${isPublishing ? "animate-pulse" : ""}`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300 w-10 text-right">
                                    {isDone || isFailed ? "100%" : "..."}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="space-y-2 mt-2">
                        <div className="flex-1 bg-gray-100 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-primary/50 animate-pulse w-full" />
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
