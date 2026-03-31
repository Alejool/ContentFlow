import SocialMediaLimitsService, { ValidationResult } from '@/Services/SocialMediaLimitsService';

interface ValidationLimitsCardProps {
  result: ValidationResult;
  showDetails?: boolean;
}

export default function ValidationLimitsCard({
  result,
  showDetails = true,
}: ValidationLimitsCardProps) {
  const categorizedErrors = SocialMediaLimitsService.categorizeErrors(result.errors);
  const hasErrors = result.errors.length > 0;
  const hasWarnings = result.warnings.length > 0;

  // Determinar el color del borde y fondo según el estado
  const getBorderColor = () => {
    if (hasErrors) return 'border-red-300 dark:border-red-800';
    if (hasWarnings) return 'border-yellow-300 dark:border-yellow-800';
    return 'border-green-300 dark:border-green-800';
  };

  const getBgColor = () => {
    if (hasErrors) return 'bg-red-50 dark:bg-red-900/10';
    if (hasWarnings) return 'bg-yellow-50 dark:bg-yellow-900/10';
    return 'bg-green-50 dark:bg-green-900/10';
  };

  const getStatusIcon = () => {
    if (hasErrors) return '❌';
    if (hasWarnings) return '⚠️';
    return '✅';
  };

  const getStatusText = () => {
    if (hasErrors) return 'No compatible';
    if (hasWarnings) return 'Compatible con advertencias';
    return 'Compatible';
  };

  const platformIcons: Record<string, string> = {
    twitter: '𝕏',
    x: '𝕏',
    facebook: '📘',
    instagram: '📷',
    youtube: '▶️',
    tiktok: '🎵',
  };

  return (
    <div className={`rounded-lg border-2 p-4 transition-all ${getBorderColor()} ${getBgColor()}`}>
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{platformIcons[result.platform.toLowerCase()] || '📱'}</span>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {result.account_name}
            </h4>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs capitalize text-gray-500 dark:text-gray-400">
                {result.platform}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${SocialMediaLimitsService.getVerificationBadgeColor(
                  result.is_verified,
                )}`}
              >
                {SocialMediaLimitsService.getVerificationIcon(result.is_verified)}{' '}
                {result.is_verified ? 'Verificada' : 'No verificada'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getStatusIcon()}</span>
        </div>
      </div>

      {/* Status */}
      <div className="mb-3">
        <span
          className={`inline-block rounded-md px-3 py-1 text-sm font-medium ${
            hasErrors
              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              : hasWarnings
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
          }`}
        >
          {getStatusText()}
        </span>
      </div>

      {/* Limits Info */}
      {showDetails && (
        <div className="mb-3 rounded-md border border-gray-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
          <h5 className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
            Límites de la plataforma:
          </h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Duración máxima:</span>
              <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">
                {SocialMediaLimitsService.formatDuration(result.limits.max_video_duration)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Tamaño máximo:</span>
              <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">
                {result.limits.max_video_size_mb} MB
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500 dark:text-gray-400">Imágenes por post:</span>
              <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">
                {result.limits.max_images_per_post === 0
                  ? 'No soporta imágenes'
                  : `Máximo ${result.limits.max_images_per_post}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Errors */}
      {hasErrors && (
        <div className="mb-3">
          <h5 className="mb-2 flex items-center gap-1 text-sm font-semibold text-red-800 dark:text-red-300">
            <span>🚫</span>
            <span>Errores que impiden la publicación:</span>
          </h5>
          <ul className="space-y-2">
            {result.errors.map((error, index) => {
              const helpMessage = SocialMediaLimitsService.getHelpMessage(error);
              const isCritical = SocialMediaLimitsService.isCriticalError(error);

              return (
                <li key={index} className="text-sm">
                  <div
                    className={`rounded p-2 ${
                      isCritical
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400'
                    }`}
                  >
                    <p className="font-medium">{error}</p>
                    {helpMessage && <p className="mt-1 text-xs opacity-80"> {helpMessage}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <div>
          <h5 className="mb-2 flex items-center gap-1 text-sm font-semibold text-yellow-800 dark:text-yellow-300">
            <span>⚠️</span>
            <span>Advertencias:</span>
          </h5>
          <ul className="space-y-1">
            {result.warnings.map((warning, index) => (
              <li
                key={index}
                className="rounded bg-yellow-50 p-2 text-sm text-yellow-700 dark:bg-yellow-900/10 dark:text-yellow-400"
              >
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success message */}
      {!hasErrors && !hasWarnings && (
        <p className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
          <span>✓</span>
          <span>El contenido cumple con todos los requisitos de esta plataforma</span>
        </p>
      )}
    </div>
  );
}
