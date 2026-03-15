import React, { useEffect, useState } from "react";
import SocialMediaLimitsService, {
  ValidationResponse,
} from "@/Services/SocialMediaLimitsService";

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
      console.error("Validation error:", error);
    } finally {
      setIsValidating(false);
    }
  };

  if (!validation && !isValidating) {
    return null;
  }

  if (isValidating) {
    return (
      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-blue-700 dark:text-blue-300">
          Validando contenido...
        </span>
      </div>
    );
  }

  const summary = SocialMediaLimitsService.getValidationSummary(
    validation.validation_results,
  );

  if (summary.incompatible === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <span className="text-lg">✅</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            Contenido compatible con todas las plataformas
          </p>
          {summary.withWarnings > 0 && (
            <p className="text-xs text-green-700 dark:text-green-400 mt-1">
              {summary.withWarnings} plataforma(s) con advertencias menores
            </p>
          )}
        </div>
      </div>
    );
  }

  if (summary.compatible === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <span className="text-lg">❌</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">
            Contenido no compatible con ninguna plataforma
          </p>
          <p className="text-xs text-red-700 dark:text-red-400 mt-1">
            Ajusta el contenido según las recomendaciones
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <span className="text-lg">⚠️</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
          Compatible con {summary.compatible} de {summary.total} plataformas
        </p>
        <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
          {summary.incompatible} plataforma(s) requieren ajustes
        </p>
      </div>
    </div>
  );
}
