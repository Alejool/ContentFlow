/**
 * Color utilities for calendar events
 */

export interface ColorOption {
  value: string;
  name: string;
  darkValue: string;
}

/**
 * Tailwind color palette for calendar events
 */
export const CALENDAR_COLORS: ColorOption[] = [
  { value: '#3B82F6', name: 'Azul', darkValue: '#1D4ED8' },
  { value: '#EF4444', name: 'Rojo', darkValue: '#DC2626' },
  { value: '#10B981', name: 'Verde', darkValue: '#059669' },
  { value: '#F59E0B', name: 'Ámbar', darkValue: '#D97706' },
  { value: '#8B5CF6', name: 'Violeta', darkValue: '#7C3AED' },
  { value: '#EC4899', name: 'Rosa', darkValue: '#DB2777' },
  { value: '#6366F1', name: 'Índigo', darkValue: '#4F46E5' },
  { value: '#14B8A6', name: 'Verde azulado', darkValue: '#0D9488' },
  { value: '#F97316', name: 'Naranja', darkValue: '#EA580C' },
  { value: '#84CC16', name: 'Lima', darkValue: '#65A30D' },
];

/**
 * Get color with opacity
 * @param hex - Hex color code
 * @param opacity - Opacity value (0-1)
 * @returns Hex color with opacity
 */
export function getColorWithOpacity(hex: string, opacity: number = 0.1): string {
  return `${hex}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0')}`;
}

/**
 * Find color option by value
 * @param colorValue - Hex color value
 * @returns Color option or default
 */
export function findColorOption(colorValue: string): ColorOption {
  return CALENDAR_COLORS.find((c) => c.value === colorValue) || CALENDAR_COLORS[0];
}

/**
 * Generate gradient background style
 * @param color - Hex color code
 * @returns CSS style object
 */
export function getGradientStyle(color: string) {
  return {
    background: `linear-gradient(135deg, ${color}25, ${color}10)`,
    borderColor: `${color}50`,
  };
}

/**
 * Generate color box shadow
 * @param color - Hex color code
 * @param opacity - Shadow opacity
 * @returns Box shadow CSS value
 */
export function getColorShadow(color: string, opacity: number = 0.2): string {
  return `0 4px 12px ${color}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0')}`;
}
