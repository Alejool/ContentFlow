import { TFunction } from "i18next";

/**
 * Translates an error message or key from the backend.
 * Handles strings or arrays of strings.
 */
export const getErrorMessage = (
  error: string | string[] | undefined,
  t: TFunction,
  fieldName?: string,
): string => {
  if (!error) return "";

  const raw = Array.isArray(error) ? error.join(" ") : String(error);

  // If it's already a full sentence (multiple words) and NOT a translation key
  // we return it as is (assuming it's already translated or a system error)
  if (raw.includes(" ") && !raw.includes("validation.")) {
    return raw;
  }

  // 1. Try exact match (e.g. 'validation.unique', 'auth.failed')
  let translated = t(raw);
  if (translated !== raw) return translated;

  // 2. Try with 'validation.' prefix if missing
  if (!raw.startsWith("validation.")) {
    translated = t(`validation.${raw}`);
    if (translated !== `validation.${raw}`) return translated;
  }

  // 3. Try without 'validation.' prefix if present
  if (raw.startsWith("validation.")) {
    const keyWithoutPrefix = raw.replace("validation.", "");
    translated = t(keyWithoutPrefix);
    if (translated !== keyWithoutPrefix) return translated;
  }

  // 4. Specific fallbacks for common keys when translation fails
  if (raw.includes("unique")) {
    return t("validation.unique", "Ya ha sido registrado.");
  }
  if (raw.includes("required")) {
    return t("validation.required", "Este campo es obligatorio.");
  }
  if (raw.includes("email") && raw.includes("valid")) {
    return t("validation.email", "Debe ser un correo válido.");
  }

  // 5. If everything fails, return the raw value but log it if it looks like a key
  if (raw.includes(".") || raw.length < 30) {
    console.warn(`[getErrorMessage] No translation found for key: ${raw}`);
  }

  return raw;
};
