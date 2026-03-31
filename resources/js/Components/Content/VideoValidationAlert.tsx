import type { ValidationResult } from '@/Utils/videoValidation';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
      <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
        <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            {t('videoValidation.valid')}
          </p>
          <p className="mt-1 text-xs text-green-700 dark:text-green-400">
            {t('videoValidation.readyToPublish', {
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
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              {t('videoValidation.invalid')}
            </p>
            <ul className="mt-2 space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index} className="text-xs text-red-700 dark:text-red-400">
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {validation.suggestedType && onTypeChange && (
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {t('videoValidation.suggestion')}
              </p>
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
                {t('videoValidation.suggestedType', {
                  type: validation.suggestedType,
                })}
              </p>
              <button
                onClick={() => onTypeChange(validation.suggestedType!)}
                className="mt-2 rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
              >
                {t('videoValidation.changeTo', {
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
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {t('videoValidation.warnings')}
          </p>
          <ul className="mt-2 space-y-1">
            {validation.warnings.map((warning, index) => (
              <li key={index} className="text-xs text-amber-700 dark:text-amber-400">
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
