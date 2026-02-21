import { useUploadQueue } from "@/stores/uploadQueueStore";
import { AlertCircle, Upload, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { router } from "@inertiajs/react";
import toast from "react-hot-toast";

export function ResumeUploadsPrompt() {
  const persistedState = useUploadQueue((state) => state.persistedState);
  const showResumePrompt = useUploadQueue((state) => state.showResumePrompt);
  const dismissResumePrompt = useUploadQueue((state) => state.dismissResumePrompt);
  const clearAllPersistedUploads = useUploadQueue((state) => state.clearAllPersistedUploads);
  
  const { t } = useTranslation();

  const incompleteUploads = Object.values(persistedState).filter(
    (upload) => upload.status === "uploading" || upload.status === "paused" || upload.status === "pending"
  );

  if (!showResumePrompt || incompleteUploads.length === 0) {
    return null;
  }

  const handleGoToContent = () => {
    // Navigate to content page where user can manage publications
    router.visit('/content');
    dismissResumePrompt();
  };

  const handleDiscard = () => {
    clearAllPersistedUploads();
    toast.success(t("common.upload.resume_prompt.discarded"));
  };

  return (
    <div className="fixed top-4 right-4 z-[101] w-96 bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-primary-200 dark:border-primary-700 overflow-hidden animate-slide-in-right">
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 p-4 border-b border-primary-200 dark:border-primary-700">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary-500 dark:bg-primary-600 rounded-lg">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-neutral-100 text-sm">
                {t("common.upload.resume_prompt.title")}
              </h3>
              <p className="text-xs text-gray-600 dark:text-neutral-400 mt-1">
                {incompleteUploads.length === 1 
                  ? t("common.upload.resume_prompt.description", { count: incompleteUploads.length })
                  : t("common.upload.resume_prompt.description_plural", { count: incompleteUploads.length })}
              </p>
            </div>
          </div>
          <button
            onClick={handleDiscard}
            className="text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
            aria-label={t("common.close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-2 mb-4 max-h-32 overflow-y-auto custom-scrollbar">
          {incompleteUploads.slice(0, 3).map((upload) => (
            <div
              key={upload.id}
              className="flex items-center gap-2 text-xs text-gray-700 dark:text-neutral-300 bg-gray-50 dark:bg-neutral-700/50 p-2 rounded"
            >
              <AlertCircle className="w-3 h-3 text-primary-500 flex-shrink-0" />
              <span className="truncate flex-1" title={upload.id}>
                {upload.publicationTitle || upload.id}
              </span>
              <span className="text-gray-500 dark:text-neutral-400">
                {upload.progress}%
              </span>
            </div>
          ))}
          {incompleteUploads.length > 3 && (
            <div className="text-xs text-gray-500 dark:text-neutral-400 text-center">
              {t("common.upload.resume_prompt.more", { count: incompleteUploads.length - 3 })}
            </div>
          )}
        </div>

        <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            {t("common.upload.resume_prompt.info")}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleGoToContent}
            className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {t("common.upload.resume_prompt.go_to_content")}
          </button>
          <button
            onClick={handleDiscard}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-700 dark:text-neutral-300 text-sm font-medium rounded-lg transition-colors"
          >
            {t("common.upload.resume_prompt.discard")}
          </button>
        </div>
      </div>
    </div>
  );
}
