import { enUS } from 'date-fns/locale';
import { es } from 'date-fns/locale';

export function getDateFnsLocale(lang?: string) {
  if (!lang) return enUS;
  const l = lang.toLowerCase();
  if (l.startsWith('es')) return es;
  return enUS;
}

export default getDateFnsLocale;
