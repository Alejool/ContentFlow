interface ValidationResult {
  can_publish?: boolean;
  platform_results?: Record<string, any>;
  global_errors?: string[];
  global_warnings?: string[];
  recommendations?: string[];
}

interface ValidationPanelProps {
  validationResult: ValidationResult | null;
  validationError: string | null;
  isValidating: boolean;
}

export default function ValidationPanel({
  validationResult,
  validationError,
  isValidating,
}: ValidationPanelProps) {
  if (isValidating) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg text-gray-600 dark:text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-300 dark:border-neutral-600 border-t-blue-500 rounded-full animate-spin" />
          <span>Validando contenido...</span>
        </div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-900 dark:text-red-300">
          <span className="text-lg">⚠</span>
          <span>{validationError}</span>
        </div>
      </div>
    );
  }

  if (!validationResult) {
    return null;
  }

  const hasErrors =
    validationResult.global_errors && validationResult.global_errors.length > 0;
  const hasWarnings =
    validationResult.global_warnings &&
    validationResult.global_warnings.length > 0;
  const hasRecommendations =
    validationResult.recommendations &&
    validationResult.recommendations.length > 0;

  return (
    <div className="mb-6">
      {/* Global Errors */}
      {hasErrors && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400 text-lg">❌</span>
            <div className="flex-1">
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                Errores que impiden la publicación:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                {validationResult.global_errors!.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Global Warnings */}
      {hasWarnings && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 dark:text-yellow-400 text-lg">
              ⚠
            </span>
            <div className="flex-1">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Advertencias:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                {validationResult.global_warnings!.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Platform-specific Results */}
      {validationResult.platform_results && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
            Estado por plataforma:
          </h4>
          <div className="space-y-2">
            {Object.entries(validationResult.platform_results).map(
              ([platform, result]: [string, any]) => (
                <div
                  key={platform}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    result.compatible
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  }`}
                >
                  <span className="text-lg mt-0.5">
                    {result.compatible ? "✅" : "❌"}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-medium ${
                          result.compatible
                            ? "text-green-800 dark:text-green-200"
                            : "text-red-800 dark:text-red-200"
                        }`}
                      >
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </span>
                      {result.account_name &&
                        result.account_name !== platform && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({result.account_name})
                          </span>
                        )}
                    </div>

                    {result.errors && result.errors.length > 0 && (
                      <div className="text-sm text-red-700 dark:text-red-300 mb-1">
                        <ul className="list-disc list-inside space-y-0.5">
                          {result.errors.map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.warnings && result.warnings.length > 0 && (
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        <ul className="list-disc list-inside space-y-0.5">
                          {result.warnings.map(
                            (warning: string, index: number) => (
                              <li key={index}>{warning}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {hasRecommendations && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 text-lg">💡</span>
            <div className="flex-1">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Recomendaciones:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300">
                {validationResult.recommendations!.map(
                  (recommendation, index) => (
                    <li key={index}>{recommendation}</li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Success message when everything is compatible */}
      {validationResult.can_publish && !hasErrors && !hasWarnings && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400 text-lg">
              ✅
            </span>
            <span className="font-medium text-green-800 dark:text-green-200">
              ¡Contenido listo para publicar!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
