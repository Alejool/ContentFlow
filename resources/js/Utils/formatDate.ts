import { parseISO } from "date-fns";

// Small helper to format UTC ISO timestamps into the user's timezone (browser-detected)
const getUserTimezone = () =>
  (window as any).USER_TIMEZONE ||
  Intl.DateTimeFormat().resolvedOptions().timeZone;
const getUserLocale = () =>
  (window as any).APP_LOCALE ||
  document.documentElement.lang ||
  Intl.DateTimeFormat().resolvedOptions().locale;

export function formatTime(iso?: string | null) {
  if (!iso) return "";
  try {
    const date = parseISO(iso);
    const tz = getUserTimezone();
    const locale = getUserLocale();
    return new Intl.DateTimeFormat(locale || undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz,
    }).format(date);
  } catch (e) {
    return "";
  }
}

export function formatDate(iso?: string | null) {
  if (!iso) return "";
  try {
    const date = parseISO(iso);
    const tz = getUserTimezone();
    const locale = getUserLocale();
    return new Intl.DateTimeFormat(locale || undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: tz,
    }).format(date);
  } catch (e) {
    return "";
  }
}

export function formatDateTime(iso?: string | null) {
  if (!iso) return "";
  try {
    const date = parseISO(iso);
    const tz = getUserTimezone();
    const locale = getUserLocale();
    return new Intl.DateTimeFormat(locale || undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz,
    }).format(date);
  } catch (e) {
    return "";
  }
}

export default { formatTime, formatDate, formatDateTime };
