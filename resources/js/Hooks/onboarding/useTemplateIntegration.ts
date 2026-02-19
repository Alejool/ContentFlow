import { useCallback } from "react";
import { router } from "@inertiajs/react";
import type { PublicationTemplate } from "@/types/onboarding";
import { useOnboardingStore } from "@/stores/onboardingStore";
import {
  storeTemplateInSession,
  applyTemplateToForm as applyTemplateToFormUtil,
} from "@/Utils/templateUtils";

/**
 * Hook for integrating publication templates with the publication editor.
 * 
 * This hook provides functionality to:
 * - Apply template content to the publication form
 * - Track template usage
 * - Navigate to the publication editor with pre-filled data
 */
export function useTemplateIntegration() {
  const selectTemplate = useOnboardingStore((s) => s.selectTemplate);

  /**
   * Applies a template to the publication editor and tracks usage.
   * 
   * @param template - The template to apply
   * @param onSuccess - Optional callback after successful template selection
   */
  const applyTemplate = useCallback(
    async (template: PublicationTemplate, onSuccess?: () => void) => {
      try {
        // Store template in session for retrieval in publication editor
        storeTemplateInSession(template);

        // Track template selection in onboarding state
        await selectTemplate(template.id);

        // Call success callback
        onSuccess?.();
      } catch (error) {
        console.error("Failed to apply template:", error);
        throw error;
      }
    },
    [selectTemplate]
  );

  /**
   * Populates form fields with template content.
   * This is used when the template is applied within an existing form context.
   * 
   * @param template - The template to apply
   * @param setValue - React Hook Form setValue function
   */
  const populateFormWithTemplate = useCallback(
    (
      template: PublicationTemplate,
      setValue: (name: string, value: any, options?: any) => void
    ) => {
      applyTemplateToFormUtil(template, setValue);
    },
    []
  );

  return {
    applyTemplate,
    populateFormWithTemplate,
  };
}
