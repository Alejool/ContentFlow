import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ValidationResult } from "@/Utils/videoValidation";

interface VideoValidationAlertProps {
  validation: ValidationResult;
  platform: string;
  currentType: string;
  onTypeChange?: (newType: string) => void;
}

export default function VideoValidationAlert({
  validation,
  platform,
  currentType,
  onTypeChange,
}: VideoValidationAlertProps) {
  const { t } = useTranslation();

  if (validation.isValid && validation.warnings.length === 0) {
    return (
      <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            {t("videoValidation.valid")}
          </p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-1">
            {t("videoValidation.readyToPublish", {
              platform,
              type: currentType,
            })}
          </p>
        </div>
      </div>
    );
  }

  if (!validation.isValid) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              {t("videoValidation.invalid")}
            </p>
            <ul className="mt-2 space-y-1">
              {validation.errors.map((error, index) => (
                <li
                  key={index}
                  className="text-xs text-red-700 dark:text-red-400"
                >
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {validation.suggestedType && onTypeChange && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {t("videoValidation.suggestion")}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                {t("videoValidation.suggestedType", {
                  type: validation.suggestedType,
                })}
              </p>
              <button
                onClick={() => onTypeChange(validation.suggestedType!)}
                className="mt-2 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60 rounded-md transition-colors"
              >
                {t("videoValidation.changeTo", {
                  type: validation.suggestedType,
                })}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (validation.warnings.length > 0) {
    return (
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {t("videoValidation.warnings")}
          </p>
          <ul className="mt-2 space-y-1">
            {validation.warnings.map((warning, index) => (
              <li
                key={index}
                className="text-xs text-amber-700 dark:text-amber-400"
              >
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return null;
}
