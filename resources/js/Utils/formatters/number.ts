import i18n from 'i18next';

export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.min(Math.floor(Math.log(bytesPerSecond) / Math.log(k)), sizes.length - 1);
  const value = bytesPerSecond / Math.pow(k, i);

  // Format with 1 decimal for values >= 10, 2 decimals for values < 10
  const decimals = value >= 10 ? 1 : 2;
  return value.toFixed(decimals) + ' ' + sizes[i];
}

export function formatTime(seconds: number): string {
  // Round to nearest second
  const roundedSeconds = Math.round(seconds);

  if (roundedSeconds < 60) return `${roundedSeconds}s`;

  const mins = Math.floor(roundedSeconds / 60);
  const secs = roundedSeconds % 60;

  // If less than 10 minutes, show minutes and seconds
  if (mins < 10 && secs > 0) {
    return `${mins}m ${secs}s`;
  }

  // For 10+ minutes, just show minutes
  return `${mins}m`;
}

export const formatNumber = (
  value: number,
  options?: Intl.NumberFormatOptions,
  locale?: string,
): string => {
  const currentLocale = locale || i18n.language || 'es';
  return new Intl.NumberFormat(currentLocale, options).format(value);
};

export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale?: string,
): string => {
  const currentLocale = locale || i18n.language || 'es';

  return new Intl.NumberFormat(currentLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatPercent = (value: number, decimals: number = 1, locale?: string): string => {
  const currentLocale = locale || i18n.language || 'es';

  return new Intl.NumberFormat(currentLocale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

export const formatCompactNumber = (value: number, locale?: string): string => {
  const currentLocale = locale || i18n.language || 'es';

  return new Intl.NumberFormat(currentLocale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
};
