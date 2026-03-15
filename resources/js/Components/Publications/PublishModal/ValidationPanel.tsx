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
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4 text-gray-600 dark:bg-neutral-800 dark:text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500 dark:border-neutral-600" />
          <span>Validando contenido...</span>
        </div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          <span className="text-lg">⚠</span>
          <span>{validationError}</span>
        </div>
      </div>
    );
  }

  if (!validationResult) {
    return null;
  }

  const hasErrors = validationResult.global_errors && validationResult.global_errors.length > 0;
  const hasWarnings =
    validationResult.global_warnings && validationResult.global_warnings.length > 0;
  const hasRecommendations =
    validationResult.recommendations && validationResult.recommendations.length > 0;

  return (
    <div className="mb-6">
      {/* Global Errors */}
      {hasErrors && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start gap-2">
            <span className="text-lg text-red-600 dark:text-red-400">❌</span>
            <div className="flex-1">
              <h4 className="mb-2 font-medium text-red-800 dark:text-red-200">
                Errores que impiden la publicación:
              </h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-red-700 dark:text-red-300">
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
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-start gap-2">
            <span className="text-lg text-yellow-600 dark:text-yellow-400">⚠</span>
            <div className="flex-1">
              <h4 className="mb-2 font-medium text-yellow-800 dark:text-yellow-200">
                Advertencias:
              </h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
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
          <h4 className="mb-3 font-medium text-gray-700 dark:text-gray-300">
            Estado por plataforma:
          </h4>
          <div className="space-y-2">
            {Object.entries(validationResult.platform_results).map(
              ([platform, result]: [string, any]) => (
                <div
                  key={platform}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    result.compatible
                      ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                      : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                  }`}
                >
                  <span className="mt-0.5 text-lg">{result.compatible ? "✅" : "❌"}</span>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`font-medium ${
                          result.compatible
                            ? "text-green-800 dark:text-green-200"
                            : "text-red-800 dark:text-red-200"
                        }`}
                      >
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </span>
                      {result.account_name && result.account_name !== platform && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({result.account_name})
                        </span>
                      )}
                    </div>

                    {result.errors && result.errors.length > 0 && (
                      <div className="mb-1 text-sm text-red-700 dark:text-red-300">
                        <ul className="list-inside list-disc space-y-0.5">
                          {result.errors.map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.warnings && result.warnings.length > 0 && (
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        <ul className="list-inside list-disc space-y-0.5">
                          {result.warnings.map((warning: string, index: number) => (
                            <li key={index}>{warning}</li>
                          ))}
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
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-2">
            <span className="text-lg text-blue-600 dark:text-blue-400">💡</span>
            <div className="flex-1">
              <h4 className="mb-2 font-medium text-blue-800 dark:text-blue-200">
                Recomendaciones:
              </h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-blue-700 dark:text-blue-300">
                {validationResult.recommendations!.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Success message when everything is compatible */}
      {validationResult.can_publish && !hasErrors && !hasWarnings && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center gap-2">
            <span className="text-lg text-green-600 dark:text-green-400">✅</span>
            <span className="font-medium text-green-800 dark:text-green-200">
              ¡Contenido listo para publicar!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
