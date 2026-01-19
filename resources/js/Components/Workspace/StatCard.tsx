interface StatCardProps {
  icon: any;
  label: string;
  value: string | number;
  trend?: number;
  color?: "blue" | "purple" | "green" | "orange";
}

const colorClasses = {
  blue: "from-blue-500 to-cyan-500",
  purple: "from-purple-500 to-pink-500",
  green: "from-emerald-500 to-green-500",
  orange: "from-amber-500 to-orange-500",
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color = "blue",
}: StatCardProps) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:border-gray-300 dark:hover:border-neutral-700">
      <div className="flex items-start justify-between">
        <div>
          <div
            className={`h-10 w-10 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center mb-3`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <p className="text-sm text-gray-500 dark:text-neutral-500 font-medium">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
