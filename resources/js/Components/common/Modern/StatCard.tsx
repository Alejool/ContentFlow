import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon | React.ElementType;
  label: string;
  value: string | React.ReactNode;
  sub?: string | React.ReactNode;
  trend?: number;
  color?:
    | 'blue'
    | 'purple'
    | 'green'
    | 'orange'
    | 'primary'
    | 'teal'
    | 'pink'
    | 'indigo'
    | 'yellow'
    | 'gray'
    | 'red'
    | 'rose';
}

const COLOR_MAP = {
  blue: {
    iconBg: 'bg-blue-100 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    border: 'border-gray-200 dark:border-neutral-700',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  purple: {
    iconBg: 'bg-violet-100 dark:bg-violet-500/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
    border: 'border-gray-200 dark:border-neutral-700',
    accent: 'text-violet-600 dark:text-violet-400',
  },
  green: {
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-gray-200 dark:border-neutral-700',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  orange: {
    iconBg: 'bg-orange-100 dark:bg-orange-500/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
    border: 'border-gray-200 dark:border-neutral-700',
    accent: 'text-orange-600 dark:text-orange-400',
  },
  primary: {
    iconBg: 'bg-primary-100 dark:bg-primary-500/20',
    iconColor: 'text-primary-600 dark:text-primary-400',
    border: 'border-gray-200 dark:border-neutral-700',
    accent: 'text-primary-600 dark:text-primary-400',
  },
  teal: {
    iconBg: 'bg-teal-100 dark:bg-teal-500/20',
    iconColor: 'text-teal-600 dark:text-teal-400',
    border: 'border-gray-200 dark:border-neutral-700',
    accent: 'text-teal-600 dark:text-teal-400',
  },
  pink: {
    iconBg: 'bg-pink-100 dark:bg-pink-500/20',
    iconColor: 'text-pink-600 dark:text-pink-400',
    border: 'border-gray-200 dark:border-neutral-700',
    accent: 'text-pink-600 dark:text-pink-400',
  },
  indigo: {
    iconBg: 'bg-indigo-100 dark:bg-indigo-500/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-gray-200 dark:border-neutral-700',
    accent: 'text-indigo-600 dark:text-indigo-400',
  },
  yellow: {
    iconBg: 'bg-yellow-100 dark:bg-yellow-500/20',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-gray-200 dark:border-neutral-700',
    accent: 'text-yellow-600 dark:text-yellow-400',
  },
  gray: {
    iconBg: 'bg-gray-100 dark:bg-gray-500/20',
    iconColor: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-neutral-700',
    accent: 'text-gray-600 dark:text-gray-400',
  },
  red: {
    iconBg: 'bg-red-100 dark:bg-red-500/20',
    iconColor: 'text-red-600 dark:text-red-400',
    border: 'border-gray-200 dark:border-neutral-700',
    accent: 'text-red-600 dark:text-red-400',
  },
  rose: {
    iconBg: 'bg-rose-100 dark:bg-rose-500/20',
    iconColor: 'text-rose-600 dark:text-rose-400',
    border: 'border-gray-200 dark:border-neutral-700',
    accent: 'text-rose-600 dark:text-rose-400',
  },
} as const;

export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color = 'blue',
}: StatCardProps) {
  const c = COLOR_MAP[color];

  return (
    <div
      className={`shadow-xs group relative flex items-center gap-4 rounded-lg border bg-white px-5 py-4 transition-all hover:shadow-md dark:bg-neutral-900/80 dark:backdrop-blur-sm ${c.border}`}
    >
      {/* Icon Container */}
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${c.iconBg}`}
      >
        <Icon className={`h-5 w-5 ${c.iconColor}`} />
      </div>

      {/* Content */}
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

      {/* Subtle accent line */}
      <div
        className={`absolute bottom-0 left-6 right-6 h-0.5 rounded-full bg-gradient-to-r from-transparent via-current to-transparent opacity-0 transition-opacity group-hover:opacity-20 ${c.iconColor}`}
      />
    </div>
  );
}
