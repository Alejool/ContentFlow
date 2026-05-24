import { useTheme } from '@/Hooks/Layout/useTheme';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip as RechartsTooltip,
} from 'recharts';
import Skeleton from '@/Components/common/ui/Skeleton';
import EmptyState from '@/Components/common/ui/EmptyState';

interface HeatmapData {
  day: string;
  [hour: string]: string | number;
}

interface BestTimeToPostHeatmapProps {
  data: HeatmapData[];
}

export default function BestTimeToPostHeatmap({ data }: BestTimeToPostHeatmapProps) {
  const { t } = useTranslation();
  const { actualTheme: theme } = useTheme();
  const isDark = theme === 'dark';

  if (!data || data.length === 0 || data.every(d => Object.keys(d).length <= 1)) {
    return (
      <EmptyState
        title={t('analytics.bestTimeToPost.emptyTitle', 'Recopilando tendencias...')}
        description={t('analytics.bestTimeToPost.emptyDesc', 'Aún no hay suficientes datos históricos. Sigue publicando para identificar el mejor momento.')}
        className="h-[400px] border-dashed bg-gray-50/50"
      />
    );
  }

  // Transform data for Recharts ScatterChart to act like a Heatmap
  const scatterData: any[] = [];
  data.forEach((dayData, dayIndex) => {
    for (let hour = 0; hour < 24; hour++) {
      if (dayData[hour] !== undefined) {
        scatterData.push({
          dayIndex,
          day: dayData.day,
          hour,
          value: dayData[hour],
        });
      }
    }
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`rounded-lg p-3 shadow-lg ${isDark ? 'bg-gray-800 text-gray-200 border border-gray-700' : 'bg-white text-gray-800 border border-gray-100'}`}>
          <p className="font-semibold">{data.day} a las {data.hour}:00</p>
          <p className="text-sm">
            Nivel de Interacción: <span className="font-medium text-primary-500">{data.value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <div className="w-full">
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            }}
          >
            <XAxis 
              type="number" 
              dataKey="hour" 
              name="Hora" 
              unit=":00" 
              domain={[0, 23]}
              tickCount={24}
              stroke={isDark ? '#4b5563' : '#9ca3af'}
            />
            <YAxis 
              type="number" 
              dataKey="dayIndex" 
              name="Día"
              domain={[0, 6]}
              tickCount={7}
              tickFormatter={(val) => days[val]?.substring(0, 3) || ''}
              stroke={isDark ? '#4b5563' : '#9ca3af'}
            />
            <ZAxis type="number" dataKey="value" range={[20, 400]} name="Interacción" />
            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
            <Scatter 
              name="Best Time" 
              data={scatterData} 
              fill={isDark ? '#818cf8' : '#4f46e5'} 
              shape="circle" 
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className={`mt-4 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Las burbujas más grandes indican mayor nivel histórico de engagement.
      </div>
    </div>
  );
}
