import { formatDuration } from "@/Utils/contentTypeUtils";
import {
  CheckIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import React from "react";
import { useTranslation } from "react-i18next";

interface ContentTypeSuggestionProps {
  currentType: string;
  suggestedType: string;
  reason?: string;
  duration?: number;
  onApply: () => void;
  onDismiss: () => void;
  className?: string;
}

export const ContentTypeSuggestion: React.FC<ContentTypeSuggestionProps> = ({
  currentType,
  suggestedType,
  reason,
  duration,
  onApply,
  onDismiss,
  className = "",
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-medium text-blue-900">
              {t("publications.modal.contentType.suggestion.title", {
                defaultValue: "Content Type Suggestion",
              })}
            </h4>
            {duration && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {formatDuration(duration)}
              </span>
            )}
          </div>

          <p className="text-sm text-blue-800 mb-3">
            {reason ||
              t("publications.modal.contentType.suggestion.reason", {
                defaultValue:
                  "Based on your video duration, we recommend changing to {{suggested}} format",
                duration: duration ? formatDuration(duration) : "",
                suggested: suggestedType.toUpperCase(),
              })}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onApply}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <CheckIcon className="h-4 w-4" />
              {t("publications.modal.contentType.suggestion.apply", {
                defaultValue: "Change to {{type}}",
                type: suggestedType.toUpperCase(),
              })}
            </button>

            <button
              onClick={onDismiss}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              {t("publications.modal.contentType.suggestion.keep", {
                defaultValue: "Keep {{type}}",
                type: currentType.toUpperCase(),
              })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
