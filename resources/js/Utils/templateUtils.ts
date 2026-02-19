import type { PublicationTemplate } from "@/types/onboarding";

/**
 * Utility functions for working with publication templates.
 */

/**
 * Stores template data in session storage for use when creating a publication.
 * This allows the template data to persist across page navigation.
 * 
 * @param template - The template to store
 */
export function storeTemplateInSession(template: PublicationTemplate): void {
  try {
    sessionStorage.setItem("selectedTemplate", JSON.stringify(template));
  } catch (error) {
    console.error("Failed to store template in session:", error);
  }
}

/**
 * Retrieves template data from session storage.
 * 
 * @returns The stored template, or null if none exists
 */
export function getTemplateFromSession(): PublicationTemplate | null {
  try {
    const stored = sessionStorage.getItem("selectedTemplate");
    if (!stored) return null;
    return JSON.parse(stored) as PublicationTemplate;
  } catch (error) {
    console.error("Failed to retrieve template from session:", error);
    return null;
  }
}

/**
 * Clears template data from session storage.
 */
export function clearTemplateFromSession(): void {
  try {
    sessionStorage.removeItem("selectedTemplate");
  } catch (error) {
    console.error("Failed to clear template from session:", error);
  }
}

/**
 * Checks if a template is currently stored in session.
 * 
 * @returns True if a template is stored, false otherwise
 */
export function hasTemplateInSession(): boolean {
  try {
    return sessionStorage.getItem("selectedTemplate") !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Formats hashtags from an array to a space-separated string with # prefix.
 * 
 * @param hashtags - Array of hashtags (with or without # prefix)
 * @returns Formatted hashtag string
 */
export function formatHashtags(hashtags: string[]): string {
  return hashtags
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .join(" ");
}

/**
 * Applies template content to a publication form using setValue.
 * 
 * @param template - The template to apply
 * @param setValue - React Hook Form setValue function
 */
export function applyTemplateToForm(
  template: PublicationTemplate,
  setValue: (name: string, value: any, options?: any) => void
): void {
  // Populate title
  setValue("title", template.name, {
    shouldValidate: true,
    shouldDirty: true,
  });

  // Populate description
  setValue("description", template.content.text, {
    shouldValidate: true,
    shouldDirty: true,
  });

  // Populate hashtags
  if (template.content.hashtags && template.content.hashtags.length > 0) {
    const hashtagString = formatHashtags(template.content.hashtags);
    setValue("hashtags", hashtagString, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }
}
