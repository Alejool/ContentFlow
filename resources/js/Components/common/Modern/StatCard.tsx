import { STAT_CARD_COLORS, type StatCardColor } from '@/lib/common/designTokens';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon | React.ElementType;
  label: string;
  value: string | React.ReactNode;
  sub?: string | React.ReactNode;
  trend?: number;
  /**
   * Semantic color token.
   * primary = default UI color
   * success = green (positive metric)
   * warning = yellow (attention needed)
   * error   = red (critical metric)
   * neutral = gray (inactive / NA)
   *
   * Old values (blue, purple, green, orange, teal, pink, indigo, rose) are
   * mapped to the closest semantic token for backwards compatibility.
   */
  color?: StatCardColor | 'blue' | 'purple' | 'green' | 'orange' | 'teal'
    | 'pink' | 'indigo' | 'yellow' | 'gray' | 'red' | 'rose';
}

// Map legacy color names to semantic tokens
function resolveColor(color: StatCardProps['color']): StatCardColor {
  const map: Record<string, StatCardColor> = {
    primary: 'primary',
    blue:    'primary',   // blue → primary (design rule)
    indigo:  'primary',
    teal:    'primary',
    purple:  'primary',
    pink:    'primary',
    green:   'success',
    orange:  'warning',
    yellow:  'warning',
    red:     'error',
    rose:    'error',
    gray:    'neutral',
    neutral: 'neutral',
    success: 'success',
    warning: 'warning',
    error:   'error',
  };
  return map[color ?? 'primary'] ?? 'primary';
}

const BORDER = 'border-gray-200 dark:border-neutral-700';

export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color = 'primary',
}: StatCardProps) {
  const c = STAT_CARD_COLORS[resolveColor(color)];

  return (
    <div
      className={`shadow-xs group relative flex items-center gap-4 rounded-lg border bg-white px-5 py-4 transition-all hover:shadow-md dark:bg-theme-bg-secondary dark:backdrop-blur-sm ${BORDER}`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${c.iconBg}`}
      >
        <Icon className={`h-5 w-5 ${c.iconColor}`} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {value}
          </p>
          {trend !== undefined && (
            <span
              className={`text-sm font-semibold ${
                trend >= 0 ? c.accent : 'text-red-600 dark:text-red-400'
              }`}
            >
              {trend >= 0 ? '+' : ''}
              {trend}%
            </span>
          )}
        </div>
        {sub && <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{sub}</p>}
      </div>

      <div
        className={`absolute bottom-0 left-6 right-6 h-0.5 rounded-full bg-gradient-to-r from-transparent via-current to-transparent opacity-0 transition-opacity group-hover:opacity-20 ${c.iconColor}`}
      />
    </div>
  );
}
