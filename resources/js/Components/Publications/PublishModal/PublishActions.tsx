import { usePublicationAction } from '@/Hooks/usePublicationAction';

interface PublishActionsProps {
  canPublish: boolean;
  hasWarnings: boolean;
  hasBlockingErrors: boolean;
  isPublishing: boolean;
  onCancel: () => void;
  onPublish: () => void;
  onPublishAnyway: () => void;
  onRequestReview?: () => void; // New: for non-owners
}

export default function PublishActions({
  canPublish,
  hasWarnings,
  hasBlockingErrors,
  isPublishing,
  onCancel,
  onPublish,
  onPublishAnyway,
  onRequestReview,
}: PublishActionsProps) {
  const { canPublishDirectly, mustSendToReview, buttonText, isLoading } = usePublicationAction();

  // Determine the primary action based on user role
  const primaryAction = mustSendToReview ? onRequestReview : onPublish;
  const primaryButtonText = mustSendToReview
    ? isPublishing
      ? 'Enviando...'
      : buttonText
    : isPublishing
      ? 'Publicando...'
      : buttonText;

  return (
    <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <button
        onClick={onCancel}
        className="rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600"
      >
        Cancelar
      </button>

      {hasWarnings && !hasBlockingErrors && canPublishDirectly && (
        <button
          onClick={onPublishAnyway}
          disabled={isPublishing}
          className="rounded-md bg-yellow-400 px-5 py-2.5 text-sm font-medium text-yellow-900 transition-colors hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-yellow-100"
        >
          Publicar de todas formas
        </button>
      )}

      <button
        onClick={primaryAction}
        disabled={!canPublish || isPublishing || isLoading}
        className={`rounded-md px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          mustSendToReview ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
        }`}
        title={
          mustSendToReview
            ? 'Enviar contenido a revisión para aprobación'
            : 'Publicar contenido directamente'
        }
      >
        {primaryButtonText}
      </button>
    </div>
  );
}
