import React, { useEffect, useState } from 'react';
import SocialMediaLimitsService from '@/Services/SocialMediaLimitsService';
import type { ValidationResponse } from '@/Services/SocialMediaLimitsService';

interface QuickValidationIndicatorProps {
  publicationId: number;
  selectedPlatforms: number[];
  onValidationComplete?: (validation: ValidationResponse) => void;
}

export default function QuickValidationIndicator({
  publicationId,
  selectedPlatforms,
  onValidationComplete,
}: QuickValidationIndicatorProps) {
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (selectedPlatforms.length > 0) {
      validateContent();
    } else {
      setValidation(null);
    }
  }, [selectedPlatforms]);

  const validateContent = async () => {
    setIsValidating(true);
    try {
      const result = await SocialMediaLimitsService.validatePublication(
        publicationId,
        selectedPlatforms,
      );
      setValidation(result);
      onValidationComplete?.(result);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  if (!validation && !isValidating) {
    return null;
  }

  if (isValidating) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <span className="text-sm text-blue-700 dark:text-blue-300">Validando contenido...</span>
      </div>
    );
  }

  const summary = SocialMediaLimitsService.getValidationSummary(validation.validation_results);

  if (summary.incompatible === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
        <span className="text-lg">✅</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            Contenido compatible con todas las plataformas
          </p>
          {summary.withWarnings > 0 && (
            <p className="mt-1 text-xs text-green-700 dark:text-green-400">
              {summary.withWarnings} plataforma(s) con advertencias menores
            </p>
          )}
        </div>
      </div>
    );
  }

  if (summary.compatible === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
        <span className="text-lg">❌</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">
            Contenido no compatible con ninguna plataforma
          </p>
          <p className="mt-1 text-xs text-red-700 dark:text-red-400">
            Ajusta el contenido según las recomendaciones
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
      <span className="text-lg">⚠️</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
          Compatible con {summary.compatible} de {summary.total} plataformas
        </p>
        <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
          {summary.incompatible} plataforma(s) requieren ajustes
        </p>
      </div>
    </div>
  );
}
