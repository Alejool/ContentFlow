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
  onRequestReview
}: PublishActionsProps) {
  const { canPublishDirectly, mustSendToReview, buttonText, isLoading } = usePublicationAction();

  // Determine the primary action based on user role
  const primaryAction = mustSendToReview ? onRequestReview : onPublish;
  const primaryButtonText = mustSendToReview 
    ? (isPublishing ? 'Enviando...' : buttonText)
    : (isPublishing ? 'Publicando...' : buttonText);

  return (
    <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
      <button
        onClick={onCancel}
        className="px-5 py-2.5 rounded-md font-medium text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-600 transition-colors"
      >
        Cancelar
      </button>

      {hasWarnings && !hasBlockingErrors && canPublishDirectly && (
        <button
          onClick={onPublishAnyway}
          disabled={isPublishing}
          className="px-5 py-2.5 rounded-md font-medium text-sm text-yellow-900 dark:text-yellow-100 bg-yellow-400 hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Publicar de todas formas
        </button>
      )}

      <button
        onClick={primaryAction}
        disabled={!canPublish || isPublishing || isLoading}
        className={`px-5 py-2.5 rounded-md font-medium text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          mustSendToReview 
            ? 'bg-purple-600 hover:bg-purple-700' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        title={mustSendToReview ? 'Enviar contenido a revisión para aprobación' : 'Publicar contenido directamente'}
      >
        {primaryButtonText}
      </button>
    </div>
  );
}