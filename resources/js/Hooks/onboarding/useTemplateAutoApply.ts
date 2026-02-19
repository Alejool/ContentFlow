import { useEffect, useRef } from "react";
import { UseFormSetValue } from "react-hook-form";
import {
  getTemplateFromSession,
  clearTemplateFromSession,
  applyTemplateToForm,
} from "@/Utils/templateUtils";
import type { PublicationFormData } from "@/schemas/publication";

/**
 * Hook that automatically applies a template from session storage
 * when a publication form is opened.
 * 
 * This hook should be used in the publication form/modal to check
 * if a template was selected during onboarding and apply it automatically.
 * 
 * @param setValue - React Hook Form setValue function
 * @param isOpen - Whether the form/modal is open
 */
export function useTemplateAutoApply(
  setValue: UseFormSetValue<PublicationFormData>,
  isOpen: boolean
) {
  const hasApplied = useRef(false);

  useEffect(() => {
    // Only apply once when the form opens
    if (!isOpen || hasApplied.current) return;

    const template = getTemplateFromSession();
    if (template) {
      // Apply template to form
      applyTemplateToForm(template, setValue);

      // Clear from session so it doesn't apply again
      clearTemplateFromSession();

      // Mark as applied
      hasApplied.current = true;
    }
  }, [isOpen, setValue]);

  // Reset the applied flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasApplied.current = false;
    }
  }, [isOpen]);
}
