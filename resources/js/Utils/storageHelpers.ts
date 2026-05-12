/**
 * Helpers para formateo de tamaños de almacenamiento (bytes, KB, MB, GB, TB)
 * 
 * Convierte automáticamente bytes a la unidad más apropiada y legible.
 */

/**
 * Unidades de almacenamiento
 */
export const STORAGE_UNITS = {
  BYTE: 1,
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  TB: 1024 * 1024 * 1024 * 1024,
  PB: 1024 * 1024 * 1024 * 1024 * 1024,
} as const;

/**
 * Convierte bytes a la unidad más apropiada automáticamente
 * 
 * @param bytes - Cantidad de bytes
 * @param decimals - Número de decimales (default: 2)
 * @param locale - Locale para formateo de números (default: idioma actual)
 * @returns String formateado con la unidad apropiada
 * 
 * @example
 * formatBytes(1024) // → "1 KB"
 * formatBytes(1536) // → "1.5 KB"
 * formatBytes(1048576) // → "1 MB"
 * formatBytes(704994.0 * 1024 * 1024 * 1024) // → "704.99 TB"
 * formatBytes(1073741824000.0 * 1024 * 1024 * 1024) // → "1 PB"
 */
export function formatBytes(
  bytes: number | null | undefined,
  decimals: number = 2,
  locale?: string,
): string {
  if (bytes === null || bytes === undefined || bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  // Formatear número según locale
  const currentLocale = locale || document.documentElement.lang || 'es-ES';
  const formattedNumber = new Intl.NumberFormat(currentLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: dm,
  }).format(value);

  return `${formattedNumber} ${sizes[i]}`;
}

/**
 * Convierte bytes a una unidad específica
 * 
 * @param bytes - Cantidad de bytes
 * @param unit - Unidad de destino ('KB', 'MB', 'GB', 'TB', 'PB')
 * @param decimals - Número de decimales (default: 2)
 * @returns Número convertido a la unidad especificada
 * 
 * @example
 * convertBytes(1073741824, 'GB') // → 1
 * convertBytes(1536, 'KB') // → 1.5
 * convertBytes(704994.0 * 1024 * 1024 * 1024, 'TB') // → 704.99
 */
export function convertBytes(
  bytes: number,
  unit: keyof typeof STORAGE_UNITS,
  decimals: number = 2,
): number {
  const divisor = STORAGE_UNITS[unit];
  const result = bytes / divisor;
  return Number(result.toFixed(decimals));
}

/**
 * Convierte bytes a GB con formato legible
 * 
 * @param bytes - Cantidad de bytes
 * @param decimals - Número de decimales (default: 2)
 * @param locale - Locale para formateo
 * @returns String formateado en GB
 * 
 * @example
 * formatBytesAsGB(1073741824) // → "1 GB"
 * formatBytesAsGB(536870912) // → "0.5 GB"
 * formatBytesAsGB(704994.0 * 1024 * 1024 * 1024) // → "704,994 GB"
 */
export function formatBytesAsGB(
  bytes: number | null | undefined,
  decimals: number = 2,
  locale?: string,
): string {
  if (bytes === null || bytes === undefined || bytes === 0) {
    return '0 GB';
  }

  const gb = bytes / STORAGE_UNITS.GB;
  const currentLocale = locale || document.documentElement.lang || 'es-ES';

  const formattedNumber = new Intl.NumberFormat(currentLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(gb);

  return `${formattedNumber} GB`;
}

/**
 * Convierte bytes a MB con formato legible
 * 
 * @param bytes - Cantidad de bytes
 * @param decimals - Número de decimales (default: 2)
 * @param locale - Locale para formateo
 * @returns String formateado en MB
 * 
 * @example
 * formatBytesAsMB(1048576) // → "1 MB"
 * formatBytesAsMB(524288) // → "0.5 MB"
 * formatBytesAsMB(157286400) // → "150 MB"
 */
export function formatBytesAsMB(
  bytes: number | null | undefined,
  decimals: number = 2,
  locale?: string,
): string {
  if (bytes === null || bytes === undefined || bytes === 0) {
    return '0 MB';
  }

  const mb = bytes / STORAGE_UNITS.MB;
  const currentLocale = locale || document.documentElement.lang || 'es-ES';

  const formattedNumber = new Intl.NumberFormat(currentLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(mb);

  return `${formattedNumber} MB`;
}

/**
 * Formatea un tamaño de almacenamiento con unidad personalizada
 * Útil cuando ya tienes el valor en una unidad específica
 * 
 * @param value - Valor numérico
 * @param unit - Unidad ('Bytes', 'KB', 'MB', 'GB', 'TB', 'PB')
 * @param decimals - Número de decimales (default: 2)
 * @param locale - Locale para formateo
 * @returns String formateado con la unidad
 * 
 * @example
 * formatStorageWithUnit(704994.0, 'GB') // → "704,994 GB"
 * formatStorageWithUnit(1073741824000.0, 'GB') // → "1,073,741,824,000 GB"
 * formatStorageWithUnit(1.5, 'TB') // → "1.5 TB"
 */
export function formatStorageWithUnit(
  value: number | null | undefined,
  unit: string,
  decimals: number = 2,
  locale?: string,
): string {
  if (value === null || value === undefined || value === 0) {
    return `0 ${unit}`;
  }

  const currentLocale = locale || document.documentElement.lang || 'es-ES';

  const formattedNumber = new Intl.NumberFormat(currentLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);

  return `${formattedNumber} ${unit}`;
}

/**
 * Convierte GB a bytes
 * Útil para cálculos internos
 * 
 * @param gb - Cantidad en GB
 * @returns Cantidad en bytes
 * 
 * @example
 * gbToBytes(1) // → 1073741824
 * gbToBytes(0.5) // → 536870912
 */
export function gbToBytes(gb: number): number {
  return gb * STORAGE_UNITS.GB;
}

/**
 * Convierte MB a bytes
 * 
 * @param mb - Cantidad en MB
 * @returns Cantidad en bytes
 * 
 * @example
 * mbToBytes(1) // → 1048576
 * mbToBytes(150) // → 157286400
 */
export function mbToBytes(mb: number): number {
  return mb * STORAGE_UNITS.MB;
}

/**
 * Calcula el porcentaje de uso de almacenamiento
 * 
 * @param used - Bytes usados
 * @param total - Bytes totales
 * @param decimals - Número de decimales (default: 1)
 * @returns Porcentaje de uso
 * 
 * @example
 * calculateStoragePercentage(536870912, 1073741824) // → 50
 * calculateStoragePercentage(750000000, 1000000000) // → 75
 */
export function calculateStoragePercentage(
  used: number,
  total: number,
  decimals: number = 1,
): number {
  if (total === 0) return 0;
  const percentage = (used / total) * 100;
  return Number(percentage.toFixed(decimals));
}

/**
 * Formatea el uso de almacenamiento con formato "usado / total"
 * Selecciona automáticamente la mejor unidad para ambos valores
 * 
 * @param used - Bytes usados
 * @param total - Bytes totales
 * @param decimals - Número de decimales (default: 2)
 * @param locale - Locale para formateo
 * @returns String formateado "usado / total"
 * 
 * @example
 * formatStorageUsage(536870912, 1073741824) // → "512 MB / 1 GB"
 * formatStorageUsage(750000000, 1000000000) // → "715.26 MB / 953.67 MB"
 * formatStorageUsage(704994.0 * 1024**3, 1073741824000.0 * 1024**3) // → "688.96 TB / 1 PB"
 */
export function formatStorageUsage(
  used: number | null | undefined,
  total: number | null | undefined,
  decimals: number = 2,
  locale?: string,
): string {
  if (used === null || used === undefined) used = 0;
  if (total === null || total === undefined) total = 0;

  const usedFormatted = formatBytes(used, decimals, locale);
  const totalFormatted = formatBytes(total, decimals, locale);

  return `${usedFormatted} / ${totalFormatted}`;
}

/**
 * Formatea el uso de almacenamiento en la misma unidad
 * Útil para comparaciones más claras
 * 
 * @param used - Bytes usados
 * @param total - Bytes totales
 * @param decimals - Número de decimales (default: 2)
 * @param locale - Locale para formateo
 * @returns String formateado "usado / total" en la misma unidad
 * 
 * @example
 * formatStorageUsageSameUnit(536870912, 1073741824) // → "0.5 GB / 1 GB"
 * formatStorageUsageSameUnit(750000000, 1000000000) // → "0.72 GB / 0.95 GB"
 */
export function formatStorageUsageSameUnit(
  used: number | null | undefined,
  total: number | null | undefined,
  decimals: number = 2,
  locale?: string,
): string {
  if (used === null || used === undefined) used = 0;
  if (total === null || total === undefined) total = 0;

  // Determinar la mejor unidad basándose en el total
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = total === 0 ? 0 : Math.floor(Math.log(Math.abs(total)) / Math.log(k));
  const unit = sizes[i];
  const divisor = Math.pow(k, i);

  const usedValue = used / divisor;
  const totalValue = total / divisor;

  const currentLocale = locale || document.documentElement.lang || 'es-ES';

  const usedFormatted = new Intl.NumberFormat(currentLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(usedValue);

  const totalFormatted = new Intl.NumberFormat(currentLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(totalValue);

  return `${usedFormatted} ${unit} / ${totalFormatted} ${unit}`;
}

/**
 * Obtiene el color apropiado según el porcentaje de uso
 * Útil para indicadores visuales
 * 
 * @param percentage - Porcentaje de uso (0-100)
 * @returns Clase de color de Tailwind
 * 
 * @example
 * getStorageColorClass(30) // → "text-green-600"
 * getStorageColorClass(75) // → "text-yellow-600"
 * getStorageColorClass(95) // → "text-red-600"
 */
export function getStorageColorClass(percentage: number): string {
  if (percentage >= 90) return 'text-red-600 dark:text-red-400';
  if (percentage >= 75) return 'text-orange-600 dark:text-orange-400';
  if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-green-600 dark:text-green-400';
}

/**
 * Obtiene el color de fondo apropiado según el porcentaje de uso
 * 
 * @param percentage - Porcentaje de uso (0-100)
 * @returns Clase de color de fondo de Tailwind
 */
export function getStorageBgColorClass(percentage: number): string {
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 75) return 'bg-orange-500';
  if (percentage >= 50) return 'bg-yellow-500';
  return 'bg-green-500';
}

/**
 * Parsea un string de almacenamiento a bytes
 * Útil para convertir valores del backend
 * 
 * @param storageString - String como "1.5 GB", "500 MB", etc.
 * @returns Cantidad en bytes
 * 
 * @example
 * parseStorageString("1.5 GB") // → 1610612736
 * parseStorageString("500 MB") // → 524288000
 * parseStorageString("1 TB") // → 1099511627776
 */
export function parseStorageString(storageString: string): number {
  const match = storageString.match(/^([\d,.]+)\s*([A-Za-z]+)$/);
  if (!match) return 0;

  const value = parseFloat(match[1].replace(/,/g, ''));
  const unit = match[2].toUpperCase();

  const multipliers: Record<string, number> = {
    B: STORAGE_UNITS.BYTE,
    BYTES: STORAGE_UNITS.BYTE,
    KB: STORAGE_UNITS.KB,
    MB: STORAGE_UNITS.MB,
    GB: STORAGE_UNITS.GB,
    TB: STORAGE_UNITS.TB,
    PB: STORAGE_UNITS.PB,
  };

  return value * (multipliers[unit] || 1);
}
