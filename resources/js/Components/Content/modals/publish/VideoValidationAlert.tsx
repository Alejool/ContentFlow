import Button from '@/Components/common/Modern/Button';
import { getPlatformConfig } from '@/Constants/socialPlatforms';
import {
  formatDurationLimit,
  formatFileSizeLimit,
  getUpgradeMessage,
  useValidateVideo,
  type VideoValidationResult,
} from '@/Hooks/usePlatformCapabilities';
import { AlertTriangle, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * VideoValidationAlert Component
 *
 * Purpose: Shows validation errors/warnings when content EXCEEDS platform limits
 *
 * IMPORTANT DISTINCTION:
 * - This component is for platforms that SUPPORT the content type but the content exceeds their limits
 * - Example: YouTube allows videos, but unverified accounts can't upload >15 minutes
 * - Example: Twitter allows videos, but non-premium accounts limited to 2 minutes
 *
 * This is DIFFERENT from platform incompatibility:
 * - Platform incompatibility = platform doesn't support the content type at all
 * - Example: carousel on Twitter (Twitter doesn't support carousel)
 * - Those cases should show in the "incompatibleAccounts" banner, NOT here
 *
 * Usage:
 * - Only pass compatible account IDs (accounts that support the content type)
 * - Shows errors when content exceeds limits (duration, file size)
 * - Shows warnings when content is close to limits
 * - Provides upgrade messages when account limitations are the issue
 */

interface VideoValidationAlertProps {
  selectedAccountIds: number[];
  videoDuration?: number; // in seconds
  fileSizeMb?: number;
  onValidationComplete?: (valid: boolean, results: VideoValidationResult[]) => void;
}

export default function VideoValidationAlert({
  selectedAccountIds,
  videoDuration,
  fileSizeMb,
  onValidationComplete,
}: VideoValidationAlertProps) {
  const { t } = useTranslation();
  const validateVideoMutation = useValidateVideo();
  const [validationResults, setValidationResults] = useState<VideoValidationResult[] | null>(null);
  const [hasValidated, setHasValidated] = useState(false);

  // Auto-validate when video info is available
  useEffect(() => {
    if (
      selectedAccountIds.length > 0 &&
      videoDuration !== undefined &&
      fileSizeMb !== undefined &&
      !hasValidated
    ) {
      handleValidate();
    }
  }, [selectedAccountIds, videoDuration, fileSizeMb]);

  const handleValidate = async () => {
    if (!videoDuration || !fileSizeMb || selectedAccountIds.length === 0) {
      return;
    }

    try {
      const result = await validateVideoMutation.mutateAsync({
        accountIds: selectedAccountIds,
        videoDuration,
        fileSizeMb,
      });

      setValidationResults(result.results);
      setHasValidated(true);

      if (onValidationComplete) {
        onValidationComplete(result.valid, result.results);
      }
    } catch (error) {
      console.error('Video validation failed:', error);
    }
  };

  // Reset validation when accounts or video changes
  useEffect(() => {
    setHasValidated(false);
    setValidationResults(null);
  }, [selectedAccountIds.join(','), videoDuration, fileSizeMb]);

  if (!videoDuration || !fileSizeMb) {
    return null;
  }

  if (validateVideoMutation.isPending) {
    return (
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-100">
              {t('publications.modal.validation.checking') || 'Validando video...'}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t('publications.modal.validation.checkingLimits') ||
                'Verificando límites de las plataformas seleccionadas'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!validationResults || validationResults.length === 0) {
    return null;
  }

  const hasErrors = validationResults.some((r) => !r.valid);
  const hasWarnings = validationResults.some((r) => r.warnings.length > 0);

  if (!hasErrors && !hasWarnings) {
    return (
      <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-semibold text-green-900 dark:text-green-100">
              {t('publications.modal.validation.allValid') || 'Video válido'}
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              {t('publications.modal.validation.allValidMessage') ||
                'Tu video cumple con los límites de todas las plataformas seleccionadas'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-3">
      {hasErrors && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="mb-4 flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="font-bold text-red-900 dark:text-red-100">
                {t('publications.modal.validation.cannotPublish') ||
                  'No se puede publicar en algunas plataformas'}
              </p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {t('publications.modal.validation.videoExceedsLimits') ||
                  'Tu video excede los límites de las siguientes cuentas:'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {validationResults
              .filter((r) => !r.valid)
              .map((result) => {
                const platformConfig = getPlatformConfig(result.platform);
                return (
                  <div
                    key={result.account_id}
                    className="rounded-lg border border-red-300 bg-white p-4 shadow-sm dark:border-red-700 dark:bg-red-950/30"
                  >
                    {/* Platform Header */}
                    <div className="mb-3 flex items-center gap-3 border-b border-red-200 pb-3 dark:border-red-800">
                      <img
                        src={platformConfig.logo}
                        alt={result.platform}
                        className="h-6 w-6 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {result.platform.toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @{result.account_name}
                        </p>
                      </div>
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/50 dark:text-red-300">
                        {t('common.failed') || 'Fallido'}
                      </span>
                    </div>

                    {/* Errors List */}
                    <div className="space-y-2">
                      {result.errors.map((error, idx) => (
                        <div key={idx} className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                          <p className="text-sm font-medium text-red-900 dark:text-red-100">
                            • {error.message}
                          </p>
                          {error.limit && error.actual && (
                            <div className="mt-2 flex items-center justify-between text-xs text-red-700 dark:text-red-300">
                              <span>
                                <strong>{t('common.limit') || 'Límite'}:</strong>{' '}
                                {error.type === 'duration_exceeded'
                                  ? formatDurationLimit(error.limit)
                                  : formatFileSizeLimit(error.limit)}
                              </span>
                              <span>
                                <strong>{t('common.yourVideo') || 'Tu video'}:</strong>{' '}
                                {error.type === 'duration_exceeded'
                                  ? formatDurationLimit(error.actual)
                                  : formatFileSizeLimit(error.actual)}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Upgrade Message */}
                    {(() => {
                      const upgradeMsg = getUpgradeMessage(result.platform, result.capabilities);
                      if (upgradeMsg) {
                        return (
                          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/30">
                            <div className="flex items-start gap-2">
                              <span className="text-lg">💡</span>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-blue-900 dark:text-blue-100">
                                  {t('common.tip') || 'Consejo'}:
                                </p>
                                <p className="mt-1 text-xs text-blue-800 dark:text-blue-200">
                                  {upgradeMsg}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {hasWarnings && !hasErrors && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="mb-4 flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div className="flex-1">
              <p className="font-bold text-yellow-900 dark:text-yellow-100">
                {t('publications.modal.validation.warnings') || 'Advertencias'}
              </p>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                {t('publications.modal.validation.warningsMessage') ||
                  'Tu video está cerca de los límites en algunas plataformas'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {validationResults
              .filter((r) => r.warnings.length > 0)
              .map((result) => {
                const platformConfig = getPlatformConfig(result.platform);
                return (
                  <div
                    key={result.account_id}
                    className="rounded-lg border border-yellow-300 bg-white p-4 shadow-sm dark:border-yellow-700 dark:bg-yellow-950/30"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <img
                        src={platformConfig.logo}
                        alt={result.platform}
                        className="h-6 w-6 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {result.platform.toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @{result.account_name}
                        </p>
                      </div>
                    </div>

                    <ul className="space-y-2">
                      {result.warnings.map((warning, idx) => (
                        <li
                          key={idx}
                          className="rounded-md bg-yellow-50 p-2 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
                        >
                          • {warning.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleValidate}
          disabled={validateVideoMutation.isPending}
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          {t('publications.modal.validation.revalidate') || 'Revalidar'}
        </Button>
      </div>
    </div>
  );
}
