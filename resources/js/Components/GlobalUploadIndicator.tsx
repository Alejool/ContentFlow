import { useConfirm } from "@/Hooks/useConfirm";
import { useUploadQueue } from "@/stores/uploadQueueStore";
import axios from "axios";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { UploadItem } from "./Upload/UploadItem";
import { PublicationItem } from "./Upload/PublicationItem";
import { usePublicationStatus } from "@/Hooks/usePublicationStatus";
import { useUploadWarning } from "@/Hooks/useUploadWarning";
import Button from "@/Components/common/Modern/Button";

export default function GlobalUploadIndicator() {
  const queue = useUploadQueue((state) => state.queue);
  const removeUpload = useUploadQueue((state) => state.removeUpload);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);
  const { t } = useTranslation();
  const { confirm, ConfirmDialog } = useConfirm();

  const { publications } = usePublicationStatus({ dismissedIds });
  const uploads = Object.values(queue);

  const activeUploads = uploads.filter((u) => u.status === "uploading" || u.status === "pending");
  const errorUploads = uploads.filter((u) => u.status === "error");

  const activePublications = publications.filter(
    (p) => p.status === "processing" || p.status === "publishing"
  );
  const failedPublications = publications.filter((p) => p.status === "failed");
  const completedPublications = publications.filter((p) => p.status === "published");

  const totalActive = activeUploads.length + activePublications.length;
  const hasErrors = errorUploads.length > 0 || failedPublications.length > 0;
  const hasCompleted = completedPublications.length > 0 || uploads.some((u) => u.status === "completed");

  useUploadWarning(activeUploads.length > 0);

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
      console.error("Failed to cancel publication", err);
    }
  };

  const handleDismissPublication = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  if (uploads.length === 0 && publications.length === 0) return null;

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
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          buttonStyle="ghost"
          fullWidth
          className="!justify-between !p-3 !bg-gradient-to-r !from-gray-50 !to-gray-100 dark:!from-neutral-700/50 dark:!to-neutral-700/30 hover:!from-gray-100 hover:!to-gray-50 dark:hover:!from-neutral-700/70 dark:hover:!to-neutral-700/50 !transition-colors !rounded-none !shadow-none"
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
        </Button>

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
                  <UploadItem key={upload.id} upload={upload} onRemove={removeUpload} />
                ))}
              </div>
            )}

            {/* Publications Section */}
            {publications.length > 0 && (
              <div className={uploads.length > 0 ? "border-t-2 border-gray-200 dark:border-neutral-600" : ""}>
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
