import { useTimezoneStore } from '@/stores/timezoneStore';
import { parseISO } from 'date-fns';

// Small helper to format UTC ISO timestamps into the workspace timezone
const getWorkspaceTimezone = () => {
  return useTimezoneStore.getState().effectiveTimezone();
};

const getUserLocale = () =>
  ((window as unknown as Record<string, unknown>).APP_LOCALE as string) ||
  document.documentElement.lang ||
  Intl.DateTimeFormat().resolvedOptions().locale;

export function formatTime(iso?: string | null) {
  if (!iso) return '';
  try {
    const date = parseISO(iso);
    const tz = getWorkspaceTimezone();
    const locale = getUserLocale();
    return date.toLocaleString(locale || undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: tz,
    });
  } catch {
    return '';
  }
}

export function formatDate(iso?: string | null) {
  if (!iso) return '';
  try {
    const date = parseISO(iso);
    const tz = getWorkspaceTimezone();
    const locale = getUserLocale();
    return date.toLocaleString(locale || undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: tz,
    });
  } catch {
    return '';
  }
}

export function formatDateTime(iso?: string | null) {
  if (!iso) return '';
  try {
    const date = parseISO(iso);
    const tz = getWorkspaceTimezone();
    const locale = getUserLocale();
    return date.toLocaleString(locale || undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: tz,
    });
  } catch {
    return '';
  }
}

export default { formatTime, formatDate, formatDateTime };
