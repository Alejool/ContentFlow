import { useTheme } from '@/Hooks/useTheme';

interface StatCardProps {
  icon: any;
  label: string;
  value: string | number;
  trend?: number;
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'primary';
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color = 'blue',
}: StatCardProps) {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  const colorMap = {
    blue: {
      gradient: isDark ? 'from-blue-600 to-blue-800' : 'from-blue-500 to-blue-600',
      iconBg: isDark ? 'bg-blue-500/20' : 'bg-blue-50',
      border: isDark ? 'border-blue-700/50' : 'border-blue-200',
      text: isDark ? 'text-blue-300' : 'text-blue-600',
      glow: 'from-blue-600/20',
    },
    purple: {
      gradient: isDark ? 'from-purple-600 to-purple-800' : 'from-purple-500 to-purple-600',
      iconBg: isDark ? 'bg-purple-500/20' : 'bg-purple-50',
      border: isDark ? 'border-purple-700/50' : 'border-purple-200',
      text: isDark ? 'text-purple-300' : 'text-purple-600',
      glow: 'from-purple-600/20',
    },
    green: {
      gradient: isDark ? 'from-emerald-600 to-emerald-800' : 'from-emerald-500 to-emerald-600',
      iconBg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-50',
      border: isDark ? 'border-emerald-700/50' : 'border-emerald-200',
      text: isDark ? 'text-emerald-300' : 'text-emerald-600',
      glow: 'from-emerald-600/20',
    },
    orange: {
      gradient: isDark ? 'from-orange-600 to-orange-800' : 'from-orange-500 to-orange-600',
      iconBg: isDark ? 'bg-orange-500/20' : 'bg-orange-50',
      border: isDark ? 'border-orange-700/50' : 'border-orange-200',
      text: isDark ? 'text-orange-300' : 'text-orange-600',
      glow: 'from-orange-600/20',
    },
    primary: {
      gradient: isDark ? 'from-primary-600 to-primary-800' : 'from-primary-500 to-primary-600',
      iconBg: isDark ? 'bg-primary-500/20' : 'bg-primary-50',
      border: isDark ? 'border-primary-700/50' : 'border-primary-200',
      text: isDark ? 'text-primary-300' : 'text-primary-600',
      glow: 'from-primary-600/20',
    },
  };

  const colors = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`group relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg ${
        isDark
          ? `border bg-neutral-800/40 backdrop-blur-md ${colors.border} hover:bg-neutral-800/60`
          : `border bg-white ${colors.border} hover:shadow-xl`
      }`}
    >
      {/* Background Glow Effect */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div
          className={`absolute -inset-1 bg-gradient-to-r ${colors.glow} opacity-20 blur-xl`}
        ></div>
      </div>

      <div className="relative z-10 p-5">
        <div className="flex items-start justify-between">
          <div>
            <div
              className={`h-12 w-12 rounded-lg bg-gradient-to-br ${colors.gradient} mb-4 flex items-center justify-center shadow-lg shadow-black/5 ring-1 ring-black/5`}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-neutral-400">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {value}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
