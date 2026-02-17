import React, { useState, useEffect } from 'react';
import Modal from '@/Components/common/ui/Modal';
import ContentValidationPanel from './ContentValidationPanel';
import { Publication, SocialAccount } from '@/types/Publication';
import axios from 'axios';

interface ValidationResult {
  platform_results?: Record<string, any>;
  recommendations?: string[];
  media_info?: any;
}

interface PublishModalExampleProps {
  show: boolean;
  publication: Publication;
  socialAccounts: SocialAccount[];
  onClose: () => void;
  onPublished: (data: any) => void;
}

export default function PublishModalExample({
  show,
  publication,
  socialAccounts,
  onClose,
  onPublished,
}: PublishModalExampleProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);
  const [schedulePost, setSchedulePost] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPlatforms.length > 0) {
      validateContent();
    } else {
      setValidationResult(null);
      setValidationError(null);
    }
  }, [selectedPlatforms]);

  useEffect(() => {
    if (!show) {
      // Reset state when modal closes
      setSelectedPlatforms([]);
      setSchedulePost(false);
      setScheduledAt('');
      setValidationResult(null);
      setValidationError(null);
    }
  }, [show]);

  const validateContent = async () => {
    setIsValidating(true);
    setValidationError(null);

    try {
      const response = await axios.post(`/api/v1/publications/${publication.id}/validate`, {
        platform_ids: selectedPlatforms,
      });
      setValidationResult(response.data);
    } catch (error: any) {
      setValidationError(error.response?.data?.message || 'Error al validar contenido');
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handlePlatformChange = (accountId: number) => {
    setSelectedPlatforms((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
  };

  const hasBlockingErrors = (): boolean => {
    if (!validationResult?.platform_results) return false;
    return Object.values(validationResult.platform_results).some((r: any) => !r.is_compatible);
  };

  const hasWarnings = (): boolean => {
    if (!validationResult?.platform_results) return false;
    return Object.values(validationResult.platform_results).some((r: any) => r.warnings?.length > 0);
  };

  const canPublish =
    selectedPlatforms.length > 0 && !isPublishing && !isValidating && !hasBlockingErrors();

  const publish = async () => {
    if (!canPublish) return;

    setIsPublishing(true);

    try {
      const response = await axios.post(`/api/v1/publications/${publication.id}/publish`, {
        platform_ids: selectedPlatforms,
        scheduled_at: schedulePost ? scheduledAt : null,
      });

      onPublished(response.data);
      handleClose();
    } catch (error: any) {
      alert('Error al publicar: ' + (error.response?.data?.message || 'Error desconocido'));
    } finally {
      setIsPublishing(false);
    }
  };

  const publishAnyway = async () => {
    if (hasBlockingErrors()) {
      alert('No se puede publicar debido a errores críticos');
      return;
    }
    await publish();
  };

  const handleClose = () => {
    setSelectedPlatforms([]);
    setSchedulePost(false);
    setScheduledAt('');
    setValidationResult(null);
    setValidationError(null);
    onClose();
  };

  return (
    <Modal show={show} onClose={handleClose} maxWidth="2xl">
      <div className="bg-white dark:bg-neutral-900 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Publicar Contenido</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Platform Selection */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Selecciona las plataformas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {socialAccounts.map((account) => (
                <label
                  key={account.id}
                  className={`flex items-center gap-2 p-3 border-2 rounded-md cursor-pointer transition-all ${
                    selectedPlatforms.includes(account.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                  }`}
                >
                  <input
                    type="checkbox"
                    value={account.id}
                    checked={selectedPlatforms.includes(account.id)}
                    onChange={() => handlePlatformChange(account.id)}
                    className="rounded"
                  />
                  <span
                    className={`text-sm ${
                      selectedPlatforms.includes(account.id)
                        ? 'font-semibold text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {account.platform}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Validation Section */}
          {selectedPlatforms.length > 0 && (
            <div className="mb-6">
              {isValidating ? (
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg text-gray-600 dark:text-gray-400">
                  <div className="w-5 h-5 border-2 border-gray-300 dark:border-neutral-600 border-t-blue-500 rounded-full animate-spin" />
                  <span>Validando contenido...</span>
                </div>
              ) : validationResult ? (
                <ContentValidationPanel validationResult={validationResult} showMediaInfo={true} />
              ) : validationError ? (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-900 dark:text-red-300">
                  <span className="text-lg">⚠</span>
                  <span>{validationError}</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Additional Settings */}
          {selectedPlatforms.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">Configuración</h3>

              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={schedulePost}
                  onChange={(e) => setSchedulePost(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Programar publicación</span>
              </label>

              {schedulePost && (
                <div className="ml-7">
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-md font-medium text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-600 transition-colors"
          >
            Cancelar
          </button>

          {hasWarnings() && !hasBlockingErrors() && (
            <button
              onClick={publishAnyway}
              disabled={isPublishing}
              className="px-5 py-2.5 rounded-md font-medium text-sm text-yellow-900 dark:text-yellow-100 bg-yellow-400 hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Publicar de todas formas
            </button>
          )}

          <button
            onClick={publish}
            disabled={!canPublish}
            className="px-5 py-2.5 rounded-md font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPublishing ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
