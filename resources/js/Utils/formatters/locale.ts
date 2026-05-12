import i18n from 'i18next';

/**
 * Obtiene el locale del navegador (código de idioma corto)
 */
export const getBrowserLocale = (): string => {
  const browserLang =
    navigator.language || (navigator as unknown as { userLanguage: string }).userLanguage;
  return browserLang?.split('-')[0] || 'es';
};

/**
 * Formatea una lista según el idioma actual (ej: "a, b y c")
 */
export const formatList = (
  items: string[],
  type: 'conjunction' | 'disjunction' = 'conjunction',
  locale?: string,
): string => {
  const currentLocale = locale || i18n.language || 'es';
  return new Intl.ListFormat(currentLocale, {
    style: 'long',
    type,
  }).format(items);
};

/**
 * Pluralización inteligente usando Intl.PluralRules
 */
export const pluralize = (
  count: number,
  singular: string,
  plural?: string,
  locale?: string,
): string => {
  const currentLocale = locale || i18n.language || 'es';
  const pluralRules = new Intl.PluralRules(currentLocale);
  const rule = pluralRules.select(count);
  if (rule === 'one') return singular;
  return plural || `${singular}s`;
};
