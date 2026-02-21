import { useConfirm } from "@/Hooks/useConfirm";
import { useS3Upload } from "@/Hooks/useS3Upload";
import { useUploadQueue } from "@/stores/uploadQueueStore";
import { useProcessingProgress } from "@/stores/processingProgressStore";
import axios from "axios";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { UploadItem } from "./Upload/UploadItem";
import { PublicationItem } from "./Upload/PublicationItem";
import { ProgressDisplay } from "./Upload/ProgressDisplay";
import { usePublicationStatus } from "@/Hooks/usePublicationStatus";
import { useUploadWarning } from "@/Hooks/useUploadWarning";

export default function GlobalUploadIndicator() {
  const queue = useUploadQueue((state) => state.queue);
  const removeUpload = useUploadQueue((state) => state.removeUpload);
  const retryUpload = useUploadQueue((state) => state.retryUpload);
  
  const { 
    pauseUpload, 
    resumeUpload: resumeUploadWithLogic, 
    cancelUpload: cancelUploadWithCleanup 
  } = useS3Upload();
  
  const processingJobs = useProcessingProgress((state) => state.jobs);
  const cancelJob = useProcessingProgress((state) => state.cancelJob);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);
  const [uploadProgressUpdates, setUploadProgressUpdates] = useState<Record<string, number>>({});
  const [processingProgressUpdates, setProcessingProgressUpdates] = useState<Record<string, number>>({});
  
  const { t } = useTranslation();
  const { confirm, ConfirmDialog } = useConfirm();

  const { publications } = usePublicationStatus({ dismissedIds });
  const uploads = Object.values(queue);
  const jobs = Object.values(processingJobs);

  const activeUploads = uploads.filter((u) => u.status === "uploading" || u.status === "pending" || u.status === "paused");
  const errorUploads = uploads.filter((u) => u.status === "error");

  const activePublications = publications.filter(
    (p) => p.status === "processing" || p.status === "publishing"
  );
  const failedPublications = publications.filter((p) => p.status === "failed");
  const completedPublications = publications.filter((p) => p.status === "published");
  
  const activeJobs = jobs.filter((j) => j.status === "processing" || j.status === "queued");
  const failedJobs = jobs.filter((j) => j.status === "failed");

  const totalActive = activeUploads.length + activePublications.length + activeJobs.length;
  const hasErrors = errorUploads.length > 0 || failedPublications.length > 0 || failedJobs.length > 0;
  const hasCompleted = completedPublications.length > 0 || uploads.some((u) => u.status === "completed") || jobs.some((j) => j.status === "completed");

  useUploadWarning(activeUploads.length > 0);
  
  // Progress update responsiveness: 500ms for uploads, 1s for processing
  useEffect(() => {
    const uploadInterval = setInterval(() => {
      const updates: Record<string, number> = {};
      activeUploads.forEach((upload) => {
        updates[upload.id] = Date.now();
      });
      setUploadProgressUpdates(updates);
    }, 500); // 500ms for uploads

    return () => clearInterval(uploadInterval);
  }, [activeUploads.length]);

  useEffect(() => {
    const processingInterval = setInterval(() => {
      const updates: Record<string, number> = {};
      activeJobs.forEach((job) => {
        updates[job.id] = Date.now();
      });
      setProcessingProgressUpdates(updates);
    }, 1000); // 1s for processing

    return () => clearInterval(processingInterval);
  }, [activeJobs.length]);

  const handleCancelPublication = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();

    const isConfirmed = await confirm({
      title: t("publications.modal.cancel_confirmation.title") || "Cancelar Publicación",
      message: t("publications.modal.cancel_confirmation.message") || "¿Cancelar esta publicación?",
      confirmText: t("publications.modal.cancel_confirmation.confirm") || "Sí, cancelar",
      cancelText: t("publications.modal.cancel_confirmation.cancel") || "No, continuar",
      type: "danger",
    });

    if (!isConfirmed) return;

    try {
      await axios.post(route("api.v1.publications.cancel", id));
    } catch (err) {
      }
  };

  const handleCancelPlatform = async (publicationId: number, platformId: number, platformName: string) => {
    const isConfirmed = await confirm({
      title: t("publications.modal.cancel_platform.title", { platform: platformName }) || "¿Cancelar " + platformName + "?",
      message: t("publications.modal.cancel_platform.message", { platform: platformName }) || "¿Estás seguro de que deseas cancelar la publicación en " + platformName + "? Se detendrán todos los reintentos para esta plataforma.",
      confirmText: t("publications.modal.cancel_platform.confirm") || "Sí, cancelar",
      cancelText: t("publications.modal.cancel_platform.cancel") || "No",
      type: "warning",
    });

    if (!isConfirmed) return;

    try {
      await axios.post(route("api.v1.publications.cancel", publicationId), {
        platform_ids: [platformId]
      });
      
      // Force refresh of publication status after canceling
      // This will trigger a re-fetch of the publication data
      window.dispatchEvent(new CustomEvent('publication-cancelled', { 
        detail: { publicationId, platformId } 
      }));
    } catch (err) {
      }
  };

  const handleDismissPublication = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };
  
  const handlePauseUpload = (id: string) => {
    pauseUpload(id);
  };
  
  const handleResumeUpload = (id: string) => {
    resumeUploadWithLogic(id);
  };
  
  const handleCancelUpload = async (id: string) => {
    const isConfirmed = await confirm({
      title: t("publications.modal.cancel_confirmation.title") || "Cancel Upload",
      message: t("publications.modal.upload.cancel_message") || "Are you sure you want to cancel this upload?",
      confirmText: t("publications.modal.cancel_confirmation.confirm") || "Yes, cancel",
      cancelText: t("publications.modal.cancel_confirmation.cancel") || "No, continue",
      type: "danger",
    });

    if (!isConfirmed) return;
    
    // Use the hook's cancelUpload which includes cleanup
    await cancelUploadWithCleanup(id);
  };
  
  const handleCancelJob = async (id: string) => {
    const isConfirmed = await confirm({
      title: t("publications.modal.cancel_confirmation.title") || "Cancel Processing",
      message: t("publications.modal.processing.cancel_message") || "Are you sure you want to cancel this processing job?",
      confirmText: t("publications.modal.cancel_confirmation.confirm") || "Yes, cancel",
      cancelText: t("publications.modal.cancel_confirmation.cancel") || "No, continue",
      type: "danger",
    });

    if (!isConfirmed) return;
    
    cancelJob(id);
  };
  
  const handleRetryUpload = (id: string) => {
    retryUpload(id);
  };

  if (uploads.length === 0 && publications.length === 0 && jobs.length === 0) return null;

  const getHeaderIcon = () => {
    if (totalActive > 0) {
      return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    }
    if (hasErrors) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  };

  const getHeaderText = () => {
    if (totalActive > 0) {
      if (activeUploads.length > 0 && activePublications.length > 0) {
        return t("publications.modal.upload.activeTasks", {
          count: totalActive,
          defaultValue: `${totalActive} tareas activas`,
        });
      }
      if (activePublications.length > 0) {
        return t("publications.modal.upload.publishingSocial", {
          count: activePublications.length,
          defaultValue: `Publicando (${activePublications.length})`,
        });
      }
      return t("publications.modal.upload.uploadingFiles", {
        count: activeUploads.length,
        defaultValue: `Subiendo (${activeUploads.length})`,
      });
    }
    if (hasErrors) {
      return t("publications.modal.upload.uploadFailed", { defaultValue: "Algo salió mal" });
    }
    if (hasCompleted) {
      return t("publications.modal.upload.uploadsCompleted", { defaultValue: "Completado" });
    }
    return t("publications.modal.upload.uploadsCompleted", { defaultValue: "Completado" });
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[100] w-80 bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-neutral-700/50 dark:to-neutral-700/30 hover:from-gray-100 hover:to-gray-50 dark:hover:from-neutral-700/70 dark:hover:to-neutral-700/50 transition-colors"
          aria-label={isExpanded ? t("common.collapse", { defaultValue: "Collapse upload indicator" }) : t("common.expand", { defaultValue: "Expand upload indicator" })}
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-2.5">
            {getHeaderIcon()}
            <span className="font-semibold text-sm text-gray-800 dark:text-neutral-100">
              {getHeaderText()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {totalActive > 0 && (
              <span className="text-xs font-bold text-primary dark:text-primary-light bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-full">
                {totalActive}
              </span>
            )}
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
            )}
          </div>
        </button>

        {/* Content */}
        {isExpanded && (
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {/* File Uploads Section */}
            {uploads.length > 0 && (
              <div>
                <div className="bg-gray-50/70 dark:bg-neutral-700/30 px-3 py-2 flex items-center justify-between border-b border-gray-100 dark:border-neutral-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                    {t("common.files") || "Archivos"}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-neutral-400">
                    {activeUploads.length} activos
                  </span>
                </div>
                {uploads.map((upload) => (
                  <div key={upload.id} className="p-3 border-b border-gray-100 dark:border-neutral-700 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className="text-xs font-medium truncate max-w-[200px] text-neutral-900 dark:text-neutral-100"
                        title={upload.file.name}
                      >
                        {upload.file.name}
                      </span>
                    </div>
                    <ProgressDisplay
                      percentage={upload.progress}
                      eta={upload.stats?.eta}
                      speed={upload.stats?.speed}
                      status={upload.status}
                      onPause={upload.isPausable && upload.status === "uploading" ? () => handlePauseUpload(upload.id) : undefined}
                      onResume={upload.status === "paused" ? () => handleResumeUpload(upload.id) : undefined}
                      onCancel={(upload.status === "uploading" || upload.status === "paused") ? () => handleCancelUpload(upload.id) : undefined}
                      onRetry={upload.status === "error" && upload.canRetry ? () => handleRetryUpload(upload.id) : undefined}
                      isPausable={upload.isPausable}
                      isPaused={upload.status === "paused"}
                      error={upload.error}
                      retryCount={upload.retryCount}
                      canRetry={upload.canRetry}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Processing Jobs Section */}
            {jobs.length > 0 && (
              <div className={uploads.length > 0 ? "border-t-2 border-gray-200 dark:border-neutral-600" : ""}>
                <div className="bg-gray-50/70 dark:bg-neutral-700/30 px-3 py-2 flex items-center justify-between border-b border-gray-100 dark:border-neutral-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                    {t("common.processing") || "Processing"}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-neutral-400">
                    {activeJobs.length} {t("common.active") || "active"}
                  </span>
                </div>
                {jobs.map((job) => (
                  <div key={job.id} className="p-3 border-b border-gray-100 dark:border-neutral-700 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 block">
                          {job.type === "video_processing" && (t("common.video_processing") || "Video Processing")}
                          {job.type === "reel_generation" && (t("common.reel_generation") || "Reel Generation")}
                          {job.type === "thumbnail_generation" && (t("common.thumbnail_generation") || "Thumbnail Generation")}
                        </span>
                        {job.stats?.currentStep && (
                          <span className="text-[10px] text-gray-500 dark:text-neutral-400">
                            {job.stats.currentStep} ({job.stats.completedSteps}/{job.stats.totalSteps})
                          </span>
                        )}
                      </div>
                    </div>
                    <ProgressDisplay
                      percentage={job.progress}
                      eta={job.stats?.eta}
                      status={job.status === "queued" ? "pending" : job.status === "processing" ? "uploading" : job.status}
                      onCancel={(job.status === "processing" || job.status === "queued") ? () => handleCancelJob(job.id) : undefined}
                      isPausable={false}
                      isPaused={false}
                      error={job.error}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Publications Section */}
            {publications.length > 0 && (
              <div className={(uploads.length > 0 || jobs.length > 0) ? "border-t-2 border-gray-200 dark:border-neutral-600" : ""}>
                <div className="bg-gray-50/70 dark:bg-neutral-700/30 px-3 py-2 flex items-center justify-between border-b border-gray-100 dark:border-neutral-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                    {t("common.publications") || "Publicaciones"}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-neutral-400">
                    {activePublications.length} en curso
                  </span>
                </div>
                {publications.map((publication) => (
                  <PublicationItem
                    key={publication.id}
                    publication={publication}
                    onCancel={handleCancelPublication}
                    onDismiss={handleDismissPublication}
                    onCancelPlatform={handleCancelPlatform}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog />
    </>
  );
}
