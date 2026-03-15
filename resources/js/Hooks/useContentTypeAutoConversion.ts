import { suggestContentType, type ContentTypeSuggestion } from '@/Utils/contentTypeUtils';
import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface AutoConversionState {
  isChecking: boolean;
  suggestion: ContentTypeSuggestion | null;
  hasChecked: boolean;
}

interface UseContentTypeAutoConversionProps {
  currentContentType: string;
  onContentTypeChange: (newType: string, reason?: string) => void;
  autoApply?: boolean; // Whether to auto-apply suggestions
}

export const useContentTypeAutoConversion = ({
  currentContentType,
  onContentTypeChange,
  autoApply = true,
}: UseContentTypeAutoConversionProps) => {
  const { t } = useTranslation();
  const [state, setState] = useState<AutoConversionState>({
    isChecking: false,
    suggestion: null,
    hasChecked: false,
  });

  /**
   * Check if content type should be changed based on uploaded file
   */
  const checkContentType = useCallback(
    async (file: File) => {
      // Only check video files
      if (!file.type.startsWith('video/')) {
        setState((prev) => ({ ...prev, hasChecked: true }));
        return;
      }

      setState((prev) => ({ ...prev, isChecking: true }));

      try {
        const suggestion = await suggestContentType(file, currentContentType);

        setState((prev) => ({
          ...prev,
          isChecking: false,
          suggestion,
          hasChecked: true,
        }));

        // Auto-apply suggestion if enabled and change is recommended
        if (autoApply && suggestion.should_change) {
          onContentTypeChange(suggestion.suggested_type, suggestion.reason);

          // Show toast notification about the change
          toast.success(
            t('publications.modal.contentType.autoChanged', {
              defaultValue: `Content type changed to ${suggestion.suggested_type.toUpperCase()}`,
              from: suggestion.current_type.toUpperCase(),
              to: suggestion.suggested_type.toUpperCase(),
              reason: suggestion.reason,
            }),
            {
              duration: 5000,
            },
          );
        } else if (!autoApply && suggestion.should_change) {
          // Show suggestion toast without auto-applying
          toast(
            (toastInstance) => {
              const container = document.createElement('div');
              container.className = 'flex flex-col gap-2';

              const reasonEl = document.createElement('div');
              reasonEl.className = 'font-medium';
              reasonEl.textContent = suggestion.reason || 'Content type suggestion available';
              container.appendChild(reasonEl);

              const buttonsEl = document.createElement('div');
              buttonsEl.className = 'flex gap-2';

              const applyBtn = document.createElement('button');
              applyBtn.className =
                'px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600';
              applyBtn.textContent = `Change to ${suggestion.suggested_type.toUpperCase()}`;
              applyBtn.onclick = () => {
                onContentTypeChange(suggestion.suggested_type, suggestion.reason);
                toast.dismiss(toastInstance.id);
              };

              const keepBtn = document.createElement('button');
              keepBtn.className =
                'px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400';
              keepBtn.textContent = `Keep ${suggestion.current_type.toUpperCase()}`;
              keepBtn.onclick = () => toast.dismiss(toastInstance.id);

              buttonsEl.appendChild(applyBtn);
              buttonsEl.appendChild(keepBtn);
              container.appendChild(buttonsEl);

              return container.outerHTML;
            },
            {
              duration: 10000,
            },
          );
        }

        return suggestion;
      } catch (error) {
        console.error('Failed to check content type:', error);
        setState((prev) => ({
          ...prev,
          isChecking: false,
          hasChecked: true,
        }));
      }
    },
    [currentContentType, onContentTypeChange, autoApply, t],
  );

  /**
   * Reset the checking state (useful when content type changes manually)
   */
  const resetCheck = useCallback(() => {
    setState({
      isChecking: false,
      suggestion: null,
      hasChecked: false,
    });
  }, []);

  /**
   * Apply the current suggestion manually
   */
  const applySuggestion = useCallback(() => {
    if (state.suggestion?.should_change) {
      onContentTypeChange(state.suggestion.suggested_type, state.suggestion.reason);

      toast.success(
        t('publications.modal.contentType.changed', {
          defaultValue: `Content type changed to ${state.suggestion.suggested_type.toUpperCase()}`,
          to: state.suggestion.suggested_type.toUpperCase(),
        }),
      );
    }
  }, [state.suggestion, onContentTypeChange, t]);

  return {
    isChecking: state.isChecking,
    suggestion: state.suggestion,
    hasChecked: state.hasChecked,
    checkContentType,
    resetCheck,
    applySuggestion,
  };
};
