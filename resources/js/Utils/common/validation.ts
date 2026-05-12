import type { TFunction } from 'i18next';

/**
 * Translates an error message or key from the backend.
 * Handles strings or arrays of strings.
 *
 * The backend is responsible for returning translated messages via Laravel's __().
 * This function handles translation keys (e.g. 'validation.unique') as fallback.
 */
export const getErrorMessage = (
  error: string | string[] | undefined,
  t: TFunction,
  _fieldName?: string,
): string => {
  if (!error) return '';

  const raw = Array.isArray(error) ? error.join(' ') : String(error);

  // If it's already a full sentence (not a dot-notation key), return as-is
  // The backend should have already translated it via __()
  if (raw.includes(' ') && !raw.includes('validation.')) {
    return raw;
  }

  // 1. Try exact i18n key match (e.g. 'validation.unique', 'auth.failed')
  let translated = t(raw);
  if (translated !== raw) return translated;

  // 2. Try with 'validation.' prefix
  if (!raw.startsWith('validation.')) {
    translated = t(`validation.${raw}`);
    if (translated !== `validation.${raw}`) return translated;
  }

  // 3. Try without 'validation.' prefix
  if (raw.startsWith('validation.')) {
    const keyWithoutPrefix = raw.replace('validation.', '');
    translated = t(keyWithoutPrefix);
    if (translated !== keyWithoutPrefix) return translated;
  }

  // 4. Common fallbacks
  if (raw.includes('unique')) return t('validation.unique', 'Ya ha sido registrado.');
  if (raw.includes('required')) return t('validation.required', 'Este campo es obligatorio.');
  if (raw.includes('email') && raw.includes('valid'))
    return t('validation.email', 'Debe ser un correo válido.');

  // 5. Strip namespace prefix (e.g. 'passwords.workspace_email_not_found' → try 'workspace_email_not_found')
  if (raw.includes('.')) {
    const withoutNamespace = raw.substring(raw.indexOf('.') + 1);
    translated = t(withoutNamespace);
    if (translated !== withoutNamespace) return translated;
  }

  return raw;
};
