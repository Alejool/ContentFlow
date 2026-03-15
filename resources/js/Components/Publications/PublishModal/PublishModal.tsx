import Modal from "@/Components/common/ui/Modal";
import { Publication, SocialAccount } from "@/types/Publication";
import { useEffect } from "react";
import PlatformSelector from "./PlatformSelector";
import PublishActions from "./PublishActions";
import ScheduleSettings from "./ScheduleSettings";
import ValidationPanel from "./ValidationPanel";
import { usePublishModal } from "./hooks/usePublishModal";
import { usePublishValidation } from "./hooks/usePublishValidation";

interface PublishModalProps {
  show: boolean;
  publication: Publication;
  socialAccounts: SocialAccount[];
  onClose: () => void;
  onPublished: (data: any) => void;
}

export default function PublishModal({
  show,
  publication,
  socialAccounts,
  onClose,
  onPublished,
}: PublishModalProps) {
  const {
    selectedPlatforms,
    schedulePost,
    scheduledAt,
    isPublishing,
    handlePlatformChange,
    setSchedulePost,
    setScheduledAt,
    resetState,
    publish,
    requestReview,
    publishAnyway,
  } = usePublishModal(publication, onPublished, onClose);

  const {
    validationResult,
    validationError,
    isValidating,
    hasBlockingErrors,
    hasWarnings,
    canPublish,
  } = usePublishValidation(publication, selectedPlatforms);

  useEffect(() => {
    if (!show) {
      resetState();
    }
  }, [show, resetState]);

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Modal show={show} onClose={handleClose} maxWidth="2xl">
      <div className="overflow-hidden rounded-lg bg-white dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-neutral-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Publicar Contenido
          </h2>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center text-3xl leading-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          <PlatformSelector
            socialAccounts={socialAccounts}
            selectedPlatforms={selectedPlatforms}
            onPlatformChange={handlePlatformChange}
            publication={publication}
          />

          {selectedPlatforms.length > 0 && (
            <>
              <ValidationPanel
                validationResult={validationResult}
                validationError={validationError}
                isValidating={isValidating}
              />

              <ScheduleSettings
                schedulePost={schedulePost}
                scheduledAt={scheduledAt}
                onScheduleChange={setSchedulePost}
                onScheduledAtChange={setScheduledAt}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <PublishActions
          canPublish={canPublish && selectedPlatforms.length > 0}
          hasWarnings={hasWarnings()}
          hasBlockingErrors={hasBlockingErrors()}
          isPublishing={isPublishing}
          onCancel={handleClose}
          onPublish={publish}
          onRequestReview={requestReview}
          onPublishAnyway={publishAnyway}
        />
      </div>
    </Modal>
  );
}
