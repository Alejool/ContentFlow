import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: number;
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'primary';
}

const COLOR_MAP = {
  blue: {
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-100 dark:border-blue-900/40',
  },
  purple: {
    iconBg: 'bg-violet-50 dark:bg-violet-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-100 dark:border-violet-900/40',
  },
  green: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-900/40',
  },
  orange: {
    iconBg: 'bg-orange-50 dark:bg-orange-500/10',
    iconColor: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-100 dark:border-orange-900/40',
  },
  primary: {
    iconBg: 'bg-primary-50 dark:bg-primary-500/10',
    iconColor: 'text-primary-600 dark:text-primary-400',
    border: 'border-primary-100 dark:border-primary-900/40',
  },
} as const;

export default function StatCard({ icon: Icon, label, value, color = 'blue' }: StatCardProps) {
  const c = COLOR_MAP[color];

  return (
    <div
      className={`flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${c.border} dark:bg-neutral-900`}
    >
      {/* Icon */}
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${c.iconBg}`}>
        <Icon className={`h-5 w-5 ${c.iconColor}`} />
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-500 dark:text-neutral-400">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}
