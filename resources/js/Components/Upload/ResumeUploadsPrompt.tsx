import { useUploadQueue } from '@/stores/uploadQueueStore';
import { AlertCircle, Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';

export function ResumeUploadsPrompt() {
  const persistedState = useUploadQueue((state) => state.persistedState);
  const showResumePrompt = useUploadQueue((state) => state.showResumePrompt);
  const dismissResumePrompt = useUploadQueue((state) => state.dismissResumePrompt);
  const clearAllPersistedUploads = useUploadQueue((state) => state.clearAllPersistedUploads);

  const { t } = useTranslation();

  const incompleteUploads = Object.values(persistedState).filter(
    (upload) =>
      upload.status === 'uploading' || upload.status === 'paused' || upload.status === 'pending',
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
    toast.success(t('common.upload.resume_prompt.discarded'));
  };

  return (
    <div className="animate-slide-in-right fixed right-4 top-4 z-[101] w-96 overflow-hidden rounded-lg border border-primary-200 bg-white shadow-2xl dark:border-primary-700 dark:bg-neutral-800">
      <div className="border-b border-primary-200 bg-gradient-to-r from-primary-50 to-primary-100 p-4 dark:border-primary-700 dark:from-primary-900/30 dark:to-primary-800/30">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary-500 p-2 dark:bg-primary-600">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-100">
                {t('common.upload.resume_prompt.title')}
              </h3>
              <p className="mt-1 text-xs text-gray-600 dark:text-neutral-400">
                {incompleteUploads.length === 1
                  ? t('common.upload.resume_prompt.description', {
                      count: incompleteUploads.length,
                    })
                  : t('common.upload.resume_prompt.description_plural', {
                      count: incompleteUploads.length,
                    })}
              </p>
            </div>
          </div>
          <button
            onClick={handleDiscard}
            className="text-gray-400 transition-colors hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="custom-scrollbar mb-4 max-h-32 space-y-2 overflow-y-auto">
          {incompleteUploads.slice(0, 3).map((upload) => (
            <div
              key={upload.id}
              className="flex items-center gap-2 rounded bg-gray-50 p-2 text-xs text-gray-700 dark:bg-neutral-700/50 dark:text-neutral-300"
            >
              <AlertCircle className="h-3 w-3 flex-shrink-0 text-primary-500" />
              <span className="flex-1 truncate" title={upload.id}>
                {upload.publicationTitle || upload.id}
              </span>
              <span className="text-gray-500 dark:text-neutral-400">{upload.progress}%</span>
            </div>
          ))}
          {incompleteUploads.length > 3 && (
            <div className="text-center text-xs text-gray-500 dark:text-neutral-400">
              {t('common.upload.resume_prompt.more', {
                count: incompleteUploads.length - 3,
              })}
            </div>
          )}
        </div>

        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            {t('common.upload.resume_prompt.info')}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleGoToContent}
            className="flex-1 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700"
          >
            {t('common.upload.resume_prompt.go_to_content')}
          </button>
          <button
            onClick={handleDiscard}
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
          >
            {t('common.upload.resume_prompt.discard')}
          </button>
        </div>
      </div>
    </div>
  );
}
