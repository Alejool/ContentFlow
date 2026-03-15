import React, { useState, useEffect } from 'react';
import Modal from '@/Components/common/ui/Modal';
import PlatformConfigCard from './PlatformConfigCard';
import ValidationLimitsCard from './ValidationLimitsCard';
import { Publication } from '@/types/Publication';
import { DateTimePicker } from '@/Components/common/DateTimePicker';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { formatDateString } from '@/Utils/dateHelpers';
import SocialMediaLimitsService, { ValidationResponse } from '@/Services/SocialMediaLimitsService';

interface MediaInfo {
  duration?: number;
  quality?: {
    resolution?: string;
    size_mb?: number;
  };
  format?: {
    extension?: string;
  };
}

interface PlatformConfiguration {
  platform: string;
  account_id: number;
  account_name: string;
  is_compatible: boolean;
  type: string;
  available_types?: string[];
  can_change_type?: boolean;
  quality?: any;
  format?: any;
  warnings?: string[];
  incompatibility_reason?: string;
  suggestion?: string;
  applied_settings?: Record<string, any>;
  thumbnail_url?: string;
}

interface PreviewData {
  main_thumbnail?: string;
  media_info: MediaInfo;
  detected_type?: string;
  global_warnings?: string[];
  optimization_suggestions?: string[];
  platform_configurations: PlatformConfiguration[];
  all_compatible: boolean;
}

interface PublishPreviewModalProps {
  show: boolean;
  publication: Publication;
  selectedPlatforms: number[];
  simpleMode?: boolean;
  onClose: () => void;
  onPublished: (data: any) => void;
}

export default function PublishPreviewModal({
  show,
  publication,
  selectedPlatforms,
  simpleMode = false,
  onClose,
  onPublished,
}: PublishPreviewModalProps) {
  const { t } = useTranslation();
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [validationData, setValidationData] = useState<ValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSimpleMode, setIsSimpleMode] = useState(simpleMode);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [showValidationDetails, setShowValidationDetails] = useState(true);

  useEffect(() => {
    if (show && selectedPlatforms.length > 0) {
      loadPreview();
      loadValidation();
    }
  }, [show, selectedPlatforms]);

  useEffect(() => {
    if (!show) {
      setIsScheduled(false);
      setScheduledAt('');
      setValidationData(null);
    }
  }, [show]);

  const loadValidation = async () => {
    setIsValidating(true);
    try {
      const validation = await SocialMediaLimitsService.validatePublication(
        publication.id,
        selectedPlatforms,
      );
      setValidationData(validation);
    } catch (error) {
      console.error('Error validating content:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const loadPreview = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`/api/v1/publications/${publication.id}/preview`, {
        platform_ids: selectedPlatforms,
        simple_mode: isSimpleMode,
      });
      setPreviewData(response.data);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoOptimize = async () => {
    setIsOptimizing(true);
    try {
      const response = await axios.post(`/api/v1/publications/${publication.id}/auto-optimize`, {
        platform_ids: selectedPlatforms,
      });
      setPreviewData(response.data);
    } catch (error) {
    } finally {
      setIsOptimizing(false);
    }
  };

  const handlePlatformUpdate = async (
    accountId: number,
    type: string,
    settings: Record<string, any>,
  ) => {
    try {
      const response = await axios.post(
        `/api/v1/publications/${publication.id}/update-platform-config`,
        {
          account_id: accountId,
          type,
          settings,
        },
      );
      setPreviewData(response.data);
    } catch (error) {}
  };

  const handlePublish = async () => {
    // Validar límites antes de publicar
    if (validationData && !validationData.can_publish) {
      const summary = SocialMediaLimitsService.getValidationSummary(
        validationData.validation_results,
      );

      if (summary.compatible === 0) {
        alert(
          'No se puede publicar en ninguna plataforma seleccionada. Por favor, ajusta el contenido según las recomendaciones.',
        );
        return;
      }

      // Si hay plataformas compatibles, preguntar si quiere publicar solo en esas
      if (summary.compatible > 0 && summary.incompatible > 0) {
        if (
          !confirm(
            `Solo ${summary.compatible} de ${summary.total} plataformas son compatibles. ¿Deseas publicar solo en las plataformas compatibles?`,
          )
        ) {
          return;
        }
      }
    }

    if (isScheduled && !scheduledAt) {
      alert('Por favor selecciona una fecha y hora');
      return;
    }

    if (isScheduled) {
      if (!confirm(`¿Confirmar publicación programada para ${formatScheduledDate(scheduledAt)}?`)) {
        return;
      }
    }

    setIsPublishing(true);

    try {
      const platformConfigs = previewData!.platform_configurations
        .filter((c) => c.is_compatible)
        .map((c) => ({
          account_id: c.account_id,
          type: c.type,
          settings: c.applied_settings,
        }));

      const response = await axios.post(`/api/v1/publications/${publication.id}/publish`, {
        platform_configs: platformConfigs,
        scheduled_at: isScheduled ? scheduledAt : null,
      });

      onPublished(response.data);
      handleClose();
    } catch (error: any) {
      // Manejar errores de validación del backend
      if (error.response?.status === 422 && error.response?.data?.data?.validation_errors) {
        const backendValidation = error.response.data.data;
        setValidationData({
          can_publish: false,
          validation_results: backendValidation.validation_errors,
          recommendations: backendValidation.recommendations || [],
          message: error.response.data.message,
        });
        alert('Error de validación: ' + error.response.data.message);
      } else {
        alert('Error al publicar: ' + (error.response?.data?.message || 'Error desconocido'));
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const publishCompatibleOnly = async () => {
    const compatibleCount = previewData!.platform_configurations.filter(
      (c) => c.is_compatible,
    ).length;

    if (!confirm(`¿Publicar solo en las ${compatibleCount} plataformas compatibles?`)) {
      return;
    }

    await handlePublish();
  };

  const toggleMode = () => {
    setIsSimpleMode(!isSimpleMode);
    if (!isSimpleMode) {
      handleAutoOptimize();
    }
  };

  const handleClose = () => {
    setIsScheduled(false);
    setScheduledAt('');
    setValidationData(null);
    onClose();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatType = (type: string): string => {
    const types: Record<string, string> = {
      reel: t('common.videoTypes.reel'),
      short: t('common.videoTypes.short'),
      standard: t('common.videoTypes.standard'),
      feed: t('common.videoTypes.feed'),
      story: t('common.videoTypes.story'),
    };
    return types[type] || type;
  };

  const formatScheduledDate = (dateString: string): string => {
    return formatDateString(dateString, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const minDateTime = (): string => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  const hasCompatiblePlatforms =
    previewData?.platform_configurations.some((c) => c.is_compatible) || false;
  const hasIncompatiblePlatforms =
    previewData?.platform_configurations.some((c) => !c.is_compatible) || false;

  // Considerar también la validación de límites
  const validationSummary = validationData
    ? SocialMediaLimitsService.getValidationSummary(validationData.validation_results)
    : null;

  const hasValidationErrors = validationSummary && validationSummary.incompatible > 0;
  const canPublishWithValidation = validationSummary ? validationSummary.compatible > 0 : true;

  const canPublish =
    previewData &&
    !isPublishing &&
    (previewData.all_compatible || hasCompatiblePlatforms) &&
    canPublishWithValidation;

  return (
    <Modal show={show} onClose={handleClose} maxWidth="2xl">
      <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-lg bg-white dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-6 dark:border-neutral-700 dark:bg-neutral-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Previsualización de Publicación
          </h2>
          <button
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-md text-4xl leading-none text-gray-400 transition-all hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-neutral-700 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 p-16">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 dark:border-neutral-700" />
            <p className="text-gray-600 dark:text-gray-400">Generando previsualización...</p>
          </div>
        ) : (
          previewData && (
            <>
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Media Info Section */}
                <div className="mb-6 flex gap-5 rounded-lg bg-gray-50 p-5 dark:bg-neutral-800">
                  <div className="flex-shrink-0">
                    {previewData.main_thumbnail ? (
                      <img
                        src={previewData.main_thumbnail}
                        alt="Video thumbnail"
                        className="h-40 w-40 rounded-lg border-2 border-gray-200 object-cover dark:border-neutral-700"
                      />
                    ) : (
                      <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-gray-200 dark:bg-neutral-700">
                        <span className="text-5xl opacity-50">🎬</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-3">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {publication.title}
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {previewData.media_info.duration && (
                        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          ⏱ {formatDuration(previewData.media_info.duration)}
                        </span>
                      )}
                      {previewData.media_info.quality?.resolution && (
                        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          📐 {previewData.media_info.quality.resolution}
                        </span>
                      )}
                      {previewData.media_info.format?.extension && (
                        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          📄 {previewData.media_info.format.extension}
                        </span>
                      )}
                      {previewData.media_info.quality?.size_mb && (
                        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          💾 {previewData.media_info.quality.size_mb} MB
                        </span>
                      )}
                    </div>
                    {previewData.detected_type && (
                      <div className="mt-auto">
                        <span className="inline-block rounded-md bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {formatType(previewData.detected_type)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Global Warnings */}
                {previewData.global_warnings && previewData.global_warnings.length > 0 && (
                  <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-yellow-900 dark:text-yellow-300">
                      <span className="text-lg">⚠</span>
                      <span>Advertencias</span>
                    </div>
                    <ul className="list-disc space-y-1.5 pl-6">
                      {previewData.global_warnings.map((warning, index) => (
                        <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Validation Limits Section */}
                {validationData && (
                  <div className="mb-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                        <span>🔍</span>
                        <span>Validación de Límites por Plataforma</span>
                      </h3>
                      <button
                        onClick={() => setShowValidationDetails(!showValidationDetails)}
                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {showValidationDetails ? 'Ocultar detalles' : 'Mostrar detalles'}
                      </button>
                    </div>

                    {/* Validation Summary */}
                    {(() => {
                      const summary = SocialMediaLimitsService.getValidationSummary(
                        validationData.validation_results,
                      );
                      return (
                        <>
                          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                  {summary.compatible}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  Compatible
                                  {summary.compatible !== 1 ? 's' : ''}
                                </div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                  {summary.incompatible}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  Incompatible
                                  {summary.incompatible !== 1 ? 's' : ''}
                                </div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                  {summary.withWarnings}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  Con advertencias
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Alert when no compatible platforms */}
                          {summary.compatible === 0 && (
                            <div className="mb-4 rounded-lg border-2 border-red-300 bg-red-100 p-4 dark:border-red-700 dark:bg-red-900/30">
                              <div className="flex items-start gap-3">
                                <span className="text-3xl">🚫</span>
                                <div className="flex-1">
                                  <h4 className="mb-2 text-lg font-bold text-red-900 dark:text-red-200">
                                    No se puede publicar
                                  </h4>
                                  <p className="mb-3 text-sm text-red-800 dark:text-red-300">
                                    El contenido no cumple con los requisitos de ninguna de las
                                    plataformas seleccionadas.
                                  </p>
                                  <div className="rounded border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                                    <p className="mb-1 text-xs font-semibold text-red-900 dark:text-red-200">
                                      ¿Qué puedes hacer?
                                    </p>
                                    <ul className="list-inside list-disc space-y-1 text-xs text-red-800 dark:text-red-300">
                                      <li>
                                        Revisa los errores específicos de cada plataforma abajo
                                      </li>
                                      <li>
                                        Ajusta la duración o tamaño del video según las
                                        recomendaciones
                                      </li>
                                      <li>
                                        Verifica tus cuentas para desbloquear límites más altos
                                      </li>
                                      <li>Considera publicar en plataformas diferentes</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* Validation Error Message */}
                    {!validationData.can_publish && (
                      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">🚫</span>
                          <div className="flex-1">
                            <h4 className="mb-2 font-semibold text-red-900 dark:text-red-300">
                              No se puede publicar en todas las plataformas
                            </h4>
                            <p className="whitespace-pre-line text-sm text-red-800 dark:text-red-400">
                              {validationData.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {validationData.recommendations &&
                      validationData.recommendations.length > 0 && (
                        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-300">
                            <span className="text-lg">💡</span>
                            <span>Recomendaciones</span>
                          </div>
                          <ul className="space-y-2">
                            {validationData.recommendations.map((recommendation, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                              >
                                <span className="mt-0.5 text-blue-500 dark:text-blue-400">•</span>
                                <span>{recommendation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {/* Optimization Suggestions from Service */}
                    {(() => {
                      const suggestions = SocialMediaLimitsService.getOptimizationSuggestions(
                        validationData.validation_results,
                      );
                      return suggestions.length > 0 ? (
                        <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
                          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-purple-900 dark:text-purple-300">
                            <span className="text-lg">✨</span>
                            <span>Sugerencias de Optimización</span>
                          </div>
                          <ul className="space-y-2">
                            {suggestions.map((suggestion, index) => (
                              <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null;
                    })()}

                    {/* Validation Results per Platform */}
                    {showValidationDetails && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {Object.entries(validationData.validation_results).map(
                          ([accountId, result]) => (
                            <ValidationLimitsCard
                              key={accountId}
                              result={result}
                              showDetails={true}
                            />
                          ),
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Optimization Suggestions */}
                {previewData.optimization_suggestions &&
                  previewData.optimization_suggestions.length > 0 && (
                    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-300">
                        <span className="text-lg">💡</span>
                        <span>Sugerencias</span>
                      </div>
                      <ul className="list-disc space-y-1.5 pl-6">
                        {previewData.optimization_suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Platform Configurations */}
                <div className="mb-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Configuración por Plataforma
                    </h3>
                    {!isSimpleMode && (
                      <button
                        onClick={handleAutoOptimize}
                        disabled={isOptimizing}
                        className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isOptimizing
                          ? `⏳ ${t('common.optimizing')}`
                          : `⚡ ${t('common.optimize_automatically')}`}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {previewData.platform_configurations.map((config) => (
                      <PlatformConfigCard
                        key={config.account_id}
                        config={config}
                        editable={!isSimpleMode}
                        onUpdate={handlePlatformUpdate}
                      />
                    ))}
                  </div>
                </div>

                {/* Schedule Section */}
                {!isSimpleMode && (
                  <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-neutral-800">
                    <label className="mb-3 flex cursor-pointer items-center gap-2 font-medium">
                      <input
                        type="checkbox"
                        checked={isScheduled}
                        onChange={(e) => setIsScheduled(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        Programar publicación
                      </span>
                    </label>

                    {isScheduled && (
                      <div className="ml-7">
                        <DateTimePicker
                          value={scheduledAt}
                          onChange={(value) => setScheduledAt(value || '')}
                          min={minDateTime()}
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Mode Toggle */}
                <div className="border-t border-gray-200 pt-4 text-center dark:border-neutral-700">
                  <button
                    onClick={toggleMode}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-xs text-gray-600 transition-all hover:border-gray-400 hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-400 dark:hover:border-neutral-500 dark:hover:bg-neutral-700"
                  >
                    {isSimpleMode ? '⚙ Modo avanzado' : '⚡ Modo simplificado'}
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 p-5 dark:border-neutral-700 dark:bg-neutral-800">
                {/* Validation Warning in Footer */}
                {hasValidationErrors && validationSummary && (
                  <div
                    className={`rounded-lg border p-3 ${
                      validationSummary.compatible === 0
                        ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                        : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        validationSummary.compatible === 0
                          ? 'text-red-800 dark:text-red-300'
                          : 'text-yellow-800 dark:text-yellow-300'
                      }`}
                    >
                      {validationSummary.compatible === 0 ? (
                        <>
                          🚫 No se puede publicar en ninguna plataforma seleccionada.
                          <span className="mt-1 block text-xs opacity-90">
                            Ajusta el contenido según las recomendaciones mostradas arriba.
                          </span>
                        </>
                      ) : (
                        <>
                          ⚠️ {validationSummary.incompatible} plataforma(s) no cumplen los
                          requisitos de contenido.
                          <span className="ml-1">
                            Puedes publicar en las {validationSummary.compatible} plataforma(s)
                            compatible(s).
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleClose}
                    className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600"
                  >
                    Cancelar
                  </button>

                  {hasIncompatiblePlatforms && hasCompatiblePlatforms && (
                    <button
                      onClick={publishCompatibleOnly}
                      disabled={isPublishing || !canPublishWithValidation}
                      className="rounded-lg bg-yellow-400 px-6 py-3 text-sm font-semibold text-yellow-900 transition-colors hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-yellow-100"
                    >
                      Publicar solo en compatibles
                    </button>
                  )}

                  <button
                    onClick={handlePublish}
                    disabled={!canPublish || isPublishing}
                    className={`rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-md transition-all ${
                      !canPublish
                        ? 'cursor-not-allowed bg-gray-400 dark:bg-gray-600'
                        : 'bg-gradient-to-r from-green-600 to-green-700 hover:-translate-y-0.5 hover:shadow-lg'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    title={
                      !canPublishWithValidation
                        ? 'No hay plataformas compatibles con el contenido'
                        : !canPublish
                          ? 'Verifica que el contenido cumpla con los requisitos'
                          : ''
                    }
                  >
                    {isPublishing
                      ? '⏳ Publicando...'
                      : !canPublishWithValidation
                        ? '🚫 No se puede publicar'
                        : !canPublish
                          ? '⚠️ Contenido no compatible'
                          : isScheduled
                            ? '📅 Programar'
                            : '🚀 Publicar ahora'}
                  </button>
                </div>
              </div>
            </>
          )
        )}
      </div>
    </Modal>
  );
}
