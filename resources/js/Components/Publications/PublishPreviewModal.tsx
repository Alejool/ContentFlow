import React, { useState, useEffect } from "react";
import Modal from "@/Components/common/ui/Modal";
import PlatformConfigCard from "./PlatformConfigCard";
import ValidationLimitsCard from "./ValidationLimitsCard";
import { Publication } from "@/types/Publication";
import { DateTimePicker } from "@/Components/common/DateTimePicker";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { formatDateString } from "@/Utils/dateHelpers";
import SocialMediaLimitsService, {
  ValidationResponse,
} from "@/Services/SocialMediaLimitsService";

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
  const [validationData, setValidationData] =
    useState<ValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSimpleMode, setIsSimpleMode] = useState(simpleMode);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
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
      setScheduledAt("");
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
      console.error("Error validating content:", error);
    } finally {
      setIsValidating(false);
    }
  };

  const loadPreview = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `/api/v1/publications/${publication.id}/preview`,
        {
          platform_ids: selectedPlatforms,
          simple_mode: isSimpleMode,
        },
      );
      setPreviewData(response.data);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoOptimize = async () => {
    setIsOptimizing(true);
    try {
      const response = await axios.post(
        `/api/v1/publications/${publication.id}/auto-optimize`,
        {
          platform_ids: selectedPlatforms,
        },
      );
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
          "No se puede publicar en ninguna plataforma seleccionada. Por favor, ajusta el contenido según las recomendaciones.",
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
      alert("Por favor selecciona una fecha y hora");
      return;
    }

    if (isScheduled) {
      if (
        !confirm(
          `¿Confirmar publicación programada para ${formatScheduledDate(scheduledAt)}?`,
        )
      ) {
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

      const response = await axios.post(
        `/api/v1/publications/${publication.id}/publish`,
        {
          platform_configs: platformConfigs,
          scheduled_at: isScheduled ? scheduledAt : null,
        },
      );

      onPublished(response.data);
      handleClose();
    } catch (error: any) {
      // Manejar errores de validación del backend
      if (
        error.response?.status === 422 &&
        error.response?.data?.data?.validation_errors
      ) {
        const backendValidation = error.response.data.data;
        setValidationData({
          can_publish: false,
          validation_results: backendValidation.validation_errors,
          recommendations: backendValidation.recommendations || [],
          message: error.response.data.message,
        });
        alert("Error de validación: " + error.response.data.message);
      } else {
        alert(
          "Error al publicar: " +
            (error.response?.data?.message || "Error desconocido"),
        );
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const publishCompatibleOnly = async () => {
    const compatibleCount = previewData!.platform_configurations.filter(
      (c) => c.is_compatible,
    ).length;

    if (
      !confirm(
        `¿Publicar solo en las ${compatibleCount} plataformas compatibles?`,
      )
    ) {
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
    setScheduledAt("");
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
      reel: t("common.videoTypes.reel"),
      short: t("common.videoTypes.short"),
      standard: t("common.videoTypes.standard"),
      feed: t("common.videoTypes.feed"),
      story: t("common.videoTypes.story"),
    };
    return types[type] || type;
  };

  const formatScheduledDate = (dateString: string): string => {
    return formatDateString(dateString, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
    ? SocialMediaLimitsService.getValidationSummary(
        validationData.validation_results,
      )
    : null;

  const hasValidationErrors =
    validationSummary && validationSummary.incompatible > 0;
  const canPublishWithValidation = validationSummary
    ? validationSummary.compatible > 0
    : true;

  const canPublish =
    previewData &&
    !isPublishing &&
    (previewData.all_compatible || hasCompatiblePlatforms) &&
    canPublishWithValidation;

  return (
    <Modal show={show} onClose={handleClose} maxWidth="2xl">
      <div className="bg-white dark:bg-neutral-900 rounded-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Previsualización de Publicación
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700 hover:text-gray-600 dark:hover:text-gray-200 text-4xl leading-none w-9 h-9 flex items-center justify-center rounded-md transition-all"
          >
            ×
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 gap-4">
            <div className="w-12 h-12 border-4 border-gray-200 dark:border-neutral-700 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">
              Generando previsualización...
            </p>
          </div>
        ) : (
          previewData && (
            <>
              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {/* Media Info Section */}
                <div className="flex gap-5 mb-6 p-5 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                  <div className="flex-shrink-0">
                    {previewData.main_thumbnail ? (
                      <img
                        src={previewData.main_thumbnail}
                        alt="Video thumbnail"
                        className="w-40 h-40 object-cover rounded-lg border-2 border-gray-200 dark:border-neutral-700"
                      />
                    ) : (
                      <div className="w-40 h-40 bg-gray-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                        <span className="text-5xl opacity-50">🎬</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-3">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {publication.title}
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {previewData.media_info.duration && (
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          ⏱ {formatDuration(previewData.media_info.duration)}
                        </span>
                      )}
                      {previewData.media_info.quality?.resolution && (
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          📐 {previewData.media_info.quality.resolution}
                        </span>
                      )}
                      {previewData.media_info.format?.extension && (
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          📄 {previewData.media_info.format.extension}
                        </span>
                      )}
                      {previewData.media_info.quality?.size_mb && (
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          💾 {previewData.media_info.quality.size_mb} MB
                        </span>
                      )}
                    </div>
                    {previewData.detected_type && (
                      <div className="mt-auto">
                        <span className="inline-block px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-xs font-semibold">
                          {formatType(previewData.detected_type)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Global Warnings */}
                {previewData.global_warnings &&
                  previewData.global_warnings.length > 0 && (
                    <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-3 font-semibold text-sm text-yellow-900 dark:text-yellow-300">
                        <span className="text-lg">⚠</span>
                        <span>Advertencias</span>
                      </div>
                      <ul className="list-disc pl-6 space-y-1.5">
                        {previewData.global_warnings.map((warning, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-700 dark:text-gray-300"
                          >
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Validation Limits Section */}
                {validationData && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span>🔍</span>
                        <span>Validación de Límites por Plataforma</span>
                      </h3>
                      <button
                        onClick={() =>
                          setShowValidationDetails(!showValidationDetails)
                        }
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {showValidationDetails
                          ? "Ocultar detalles"
                          : "Mostrar detalles"}
                      </button>
                    </div>

                    {/* Validation Summary */}
                    {(() => {
                      const summary =
                        SocialMediaLimitsService.getValidationSummary(
                          validationData.validation_results,
                        );
                      return (
                        <>
                          <div className="mb-4 p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                  {summary.compatible}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  Compatible
                                  {summary.compatible !== 1 ? "s" : ""}
                                </div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                  {summary.incompatible}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  Incompatible
                                  {summary.incompatible !== 1 ? "s" : ""}
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
                            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-lg">
                              <div className="flex items-start gap-3">
                                <span className="text-3xl">🚫</span>
                                <div className="flex-1">
                                  <h4 className="font-bold text-red-900 dark:text-red-200 text-lg mb-2">
                                    No se puede publicar
                                  </h4>
                                  <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                                    El contenido no cumple con los requisitos de
                                    ninguna de las plataformas seleccionadas.
                                  </p>
                                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                                    <p className="text-xs font-semibold text-red-900 dark:text-red-200 mb-1">
                                      ¿Qué puedes hacer?
                                    </p>
                                    <ul className="text-xs text-red-800 dark:text-red-300 space-y-1 list-disc list-inside">
                                      <li>
                                        Revisa los errores específicos de cada
                                        plataforma abajo
                                      </li>
                                      <li>
                                        Ajusta la duración o tamaño del video
                                        según las recomendaciones
                                      </li>
                                      <li>
                                        Verifica tus cuentas para desbloquear
                                        límites más altos
                                      </li>
                                      <li>
                                        Considera publicar en plataformas
                                        diferentes
                                      </li>
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
                      <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">🚫</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2">
                              No se puede publicar en todas las plataformas
                            </h4>
                            <p className="text-sm text-red-800 dark:text-red-400 whitespace-pre-line">
                              {validationData.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {validationData.recommendations &&
                      validationData.recommendations.length > 0 && (
                        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-center gap-2 mb-3 font-semibold text-sm text-blue-900 dark:text-blue-300">
                            <span className="text-lg">💡</span>
                            <span>Recomendaciones</span>
                          </div>
                          <ul className="space-y-2">
                            {validationData.recommendations.map(
                              (recommendation, index) => (
                                <li
                                  key={index}
                                  className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                                >
                                  <span className="text-blue-500 dark:text-blue-400 mt-0.5">
                                    •
                                  </span>
                                  <span>{recommendation}</span>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}

                    {/* Optimization Suggestions from Service */}
                    {(() => {
                      const suggestions =
                        SocialMediaLimitsService.getOptimizationSuggestions(
                          validationData.validation_results,
                        );
                      return suggestions.length > 0 ? (
                        <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                          <div className="flex items-center gap-2 mb-3 font-semibold text-sm text-purple-900 dark:text-purple-300">
                            <span className="text-lg">✨</span>
                            <span>Sugerencias de Optimización</span>
                          </div>
                          <ul className="space-y-2">
                            {suggestions.map((suggestion, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-700 dark:text-gray-300"
                              >
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null;
                    })()}

                    {/* Validation Results per Platform */}
                    {showValidationDetails && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-3 font-semibold text-sm text-blue-900 dark:text-blue-300">
                        <span className="text-lg">💡</span>
                        <span>Sugerencias</span>
                      </div>
                      <ul className="list-disc pl-6 space-y-1.5">
                        {previewData.optimization_suggestions.map(
                          (suggestion, index) => (
                            <li
                              key={index}
                              className="text-sm text-gray-700 dark:text-gray-300"
                            >
                              {suggestion}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}

                {/* Platform Configurations */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Configuración por Plataforma
                    </h3>
                    {!isSimpleMode && (
                      <button
                        onClick={handleAutoOptimize}
                        disabled={isOptimizing}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isOptimizing
                          ? `⏳ ${t("common.optimizing")}`
                          : `⚡ ${t("common.optimize_automatically")}`}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer font-medium mb-3">
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
                          onChange={(value) => setScheduledAt(value || "")}
                          min={minDateTime()}
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Mode Toggle */}
                <div className="text-center pt-4 border-t border-gray-200 dark:border-neutral-700">
                  <button
                    onClick={toggleMode}
                    className="px-4 py-2 bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-neutral-600 rounded-md text-xs hover:bg-gray-50 dark:hover:bg-neutral-700 hover:border-gray-400 dark:hover:border-neutral-500 transition-all"
                  >
                    {isSimpleMode ? "⚙ Modo avanzado" : "⚡ Modo simplificado"}
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col gap-3 p-5 border-t border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
                {/* Validation Warning in Footer */}
                {hasValidationErrors && validationSummary && (
                  <div
                    className={`p-3 border rounded-lg ${
                      validationSummary.compatible === 0
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        validationSummary.compatible === 0
                          ? "text-red-800 dark:text-red-300"
                          : "text-yellow-800 dark:text-yellow-300"
                      }`}
                    >
                      {validationSummary.compatible === 0 ? (
                        <>
                          🚫 No se puede publicar en ninguna plataforma
                          seleccionada.
                          <span className="block mt-1 text-xs opacity-90">
                            Ajusta el contenido según las recomendaciones
                            mostradas arriba.
                          </span>
                        </>
                      ) : (
                        <>
                          ⚠️ {validationSummary.incompatible} plataforma(s) no
                          cumplen los requisitos de contenido.
                          <span className="ml-1">
                            Puedes publicar en las{" "}
                            {validationSummary.compatible} plataforma(s)
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
                    className="px-6 py-3 rounded-lg font-semibold text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-600 transition-colors"
                  >
                    Cancelar
                  </button>

                  {hasIncompatiblePlatforms && hasCompatiblePlatforms && (
                    <button
                      onClick={publishCompatibleOnly}
                      disabled={isPublishing || !canPublishWithValidation}
                      className="px-6 py-3 rounded-lg font-semibold text-sm text-yellow-900 dark:text-yellow-100 bg-yellow-400 hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Publicar solo en compatibles
                    </button>
                  )}

                  <button
                    onClick={handlePublish}
                    disabled={!canPublish || isPublishing}
                    className={`px-6 py-3 rounded-lg font-semibold text-sm text-white shadow-md transition-all ${
                      !canPublish
                        ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-600 to-green-700 hover:shadow-lg hover:-translate-y-0.5"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={
                      !canPublishWithValidation
                        ? "No hay plataformas compatibles con el contenido"
                        : !canPublish
                          ? "Verifica que el contenido cumpla con los requisitos"
                          : ""
                    }
                  >
                    {isPublishing
                      ? "⏳ Publicando..."
                      : !canPublishWithValidation
                        ? "🚫 No se puede publicar"
                        : !canPublish
                          ? "⚠️ Contenido no compatible"
                          : isScheduled
                            ? "📅 Programar"
                            : "🚀 Publicar ahora"}
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
