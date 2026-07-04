import { useTheme } from '@/Hooks/Layout/useTheme';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import Skeleton from '@/Components/common/ui/Skeleton';

interface FormatData {
  format: string;
  engagement: number;
  reach: number;
  color: string;
}

interface ContentFormatPerformanceProps {
  data: FormatData[];
}

export default function ContentFormatPerformance({ data }: ContentFormatPerformanceProps) {
  const { t } = useTranslation();
  const { actualTheme: theme } = useTheme();
  const isDark = theme === 'dark';

  if (!data || data.length === 0) {
    return <Skeleton className="h-75 w-full rounded-lg" />;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`rounded-lg p-3 shadow-lg ${
            isDark ? 'border border-gray-700 bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
          }`}
        >
          <p className="font-semibold">{payload[0].payload.format}</p>
          <p className="text-sm">
            Engagement: <span className="font-medium">{payload[0].value.toLocaleString()}</span>
          </p>
          <p className="text-sm">
            Reach: <span className="font-medium">{payload[0].payload.reach.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-87.5 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="engagement"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry, index) => (
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
