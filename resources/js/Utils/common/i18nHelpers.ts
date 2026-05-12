/**
 * @deprecated Use `@/Utils/formatters` instead.
 * This file is kept for backward compatibility and re-exports everything
 * from the centralized formatters module.
 *
 * MIGRATION: Replace all imports from '@/Utils/common/i18nHelpers' with '@/Utils/formatters'.
 */
export {
  // Date formatting
  formatDate,
  formatOptionalDate,
  formatDateString,
  formatDateTimeString,
  formatTimeString,
  formatRelativeTime,
  formatDateTimeStyled,
  dateTimeFormats,
  getUserTimezone,
  getUserLocale,
  // Number & currency formatting
  formatNumber,
  formatCurrency,
  formatPercent,
  formatCompactNumber,
  // Storage
  formatBytes,
  formatStorageUsage,
  // Locale helpers
  getBrowserLocale,
  formatList,
  pluralize,
} from '@/Utils/formatters';
