import React, { useState } from 'react';

interface MediaInfo {
  extension?: string;
  duration?: number;
  width?: number;
  height?: number;
  aspect_ratio?: string;
  size?: number;
}

interface PlatformResult {
  is_compatible: boolean;
  errors?: string[];
  warnings?: string[];
}

interface ValidationResult {
  platform_results?: Record<string, PlatformResult>;
  recommendations?: string[];
  media_info?: MediaInfo;
}

interface ContentValidationPanelProps {
  validationResult: ValidationResult | null;
  showMediaInfo?: boolean;
}

export default function ContentValidationPanel({
  validationResult,
  showMediaInfo = true,
}: ContentValidationPanelProps) {
  const [mediaInfoExpanded, setMediaInfoExpanded] = useState(false);

  if (!validationResult) return null;

  const platformResults = validationResult.platform_results || {};
  
  const compatiblePlatforms = Object.entries(platformResults).filter(
    ([_, r]) => r.is_compatible
  );
  
  const incompatiblePlatforms = Object.entries(platformResults).filter(
    ([_, r]) => !r.is_compatible
  );
  
  const platformsWithWarnings = Object.entries(platformResults).filter(
    ([_, r]) => r.warnings && r.warnings.length > 0
  );

  const hasCompatiblePlatforms = compatiblePlatforms.length > 0;
  const hasIncompatiblePlatforms = incompatiblePlatforms.length > 0;
  const hasWarnings = platformsWithWarnings.length > 0;
  const hasRecommendations = validationResult.recommendations && validationResult.recommendations.length > 0;

  const formatPlatform = (platform: string): string => {
    const names: Record<string, string> = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      youtube: 'YouTube',
      twitter: 'Twitter',
      linkedin: 'LinkedIn',
    };
    return names[platform] || platform;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const compatiblePlatformsText = (): string => {
    const platforms = compatiblePlatforms.map(([p]) => formatPlatform(p));
    if (platforms.length === 0) return '';
    if (platforms.length === 1) return platforms[0];
    if (platforms.length === 2) return platforms.join(' y ');
    return platforms.slice(0, -1).join(', ') + ' y ' + platforms[platforms.length - 1];
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg">
      {/* Resumen General */}
      {hasCompatiblePlatforms && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="text-xl text-green-600 dark:text-green-400">✓</div>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-green-800 dark:text-green-300">Listo para publicar</span>
            <span className="text-sm text-green-700 dark:text-green-400">{compatiblePlatformsText()}</span>
          </div>
        </div>
      )}

      {/* Errores Críticos */}
      {hasIncompatiblePlatforms && (
        <div className="flex flex-col gap-2">
          {incompatiblePlatforms.map(([platform, result]) => (
            <div key={platform} className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base text-red-600 dark:text-red-400">✗</span>
                <span className="font-semibold text-sm text-red-900 dark:text-red-300">{formatPlatform(platform)}</span>
              </div>
              <ul className="list-disc pl-6 space-y-1">
                {result.errors?.map((error, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300">{error}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Advertencias */}
      {hasWarnings && (
        <div className="flex flex-col gap-2">
          {platformsWithWarnings.map(([platform, result]) => (
            <div key={platform} className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base text-yellow-600 dark:text-yellow-400">⚠</span>
                <span className="font-semibold text-sm text-yellow-900 dark:text-yellow-300">{formatPlatform(platform)}</span>
              </div>
              <ul className="list-disc pl-6 space-y-1">
                {result.warnings?.map((warning, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300">{warning}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Recomendaciones */}
      {hasRecommendations && (
        <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">💡</span>
            <span className="font-semibold text-sm text-blue-900 dark:text-blue-300">Recomendaciones</span>
          </div>
          <ul className="list-disc pl-6 space-y-1">
            {validationResult.recommendations?.map((recommendation, index) => (
              <li key={index} className="text-sm text-blue-900 dark:text-blue-200">{recommendation}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Información de Media */}
      {showMediaInfo && validationResult.media_info && (
        <div className="border-t border-gray-200 dark:border-neutral-700 pt-3">
          <button
            onClick={() => setMediaInfoExpanded(!mediaInfoExpanded)}
            className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <span>{mediaInfoExpanded ? '▼' : '▶'}</span>
            <span>Detalles técnicos</span>
          </button>
          {mediaInfoExpanded && (
            <div className="mt-3 p-3 bg-white dark:bg-neutral-900 rounded-md border border-gray-200 dark:border-neutral-700">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {validationResult.media_info.extension && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Formato:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {validationResult.media_info.extension.toUpperCase()}
                    </span>
                  </div>
                )}
                {validationResult.media_info.duration && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Duración:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatDuration(validationResult.media_info.duration)}
                    </span>
                  </div>
                )}
                {validationResult.media_info.width && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Resolución:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {validationResult.media_info.width}x{validationResult.media_info.height}
                    </span>
                  </div>
                )}
                {validationResult.media_info.aspect_ratio && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Aspecto:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {validationResult.media_info.aspect_ratio}
                    </span>
                  </div>
                )}
                {validationResult.media_info.size && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Tamaño:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatFileSize(validationResult.media_info.size)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
