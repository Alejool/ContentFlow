import { useTheme } from '@/Hooks/Layout/useTheme';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Users, MapPin } from 'lucide-react';
import Skeleton from '@/Components/common/ui/Skeleton';
import EmptyState from '@/Components/common/ui/EmptyState';

interface DemographicData {
  age: { name: string; value: number }[];
  gender: { name: string; value: number }[];
  top_locations: { name: string; value: number }[];
}

interface AudienceDemographicsProps {
  data: DemographicData;
}

const GENDER_COLORS = ['#ec4899', '#3b82f6', '#9ca3af'];
const AGE_COLORS = ['#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'];

export default function AudienceDemographics({ data }: AudienceDemographicsProps) {
  const { t } = useTranslation();
  const { actualTheme: theme } = useTheme();
  const isDark = theme === 'dark';

  if (!data || (!data.age?.length && !data.gender?.length && !data.top_locations?.length)) {
    return (
      <EmptyState
        title={t('analytics.demographics.emptyTitle', 'Sin datos demográficos')}
        description={t('analytics.demographics.emptyDesc', 'Se necesita más interacción de tu audiencia para generar este reporte.')}
        className="h-1 border-dashed bg-gray-50/50"
      />
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`rounded-lg p-3 shadow-lg ${isDark ? 'bg-gray-800 text-gray-200 border border-gray-700' : 'bg-white text-gray-800 border border-gray-100'}`}>
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm">
            {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Gender Distribution */}
      <div className={`rounded-lg p-5 border ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50/50'}`}>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Distribución por Género
        </h3>
        <div className="h-62.5 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.gender}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.gender.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Age Distribution */}
      <div className={`rounded-lg p-5 border ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50/50'}`}>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Rango de Edad
        </h3>
        <div className="h-62.5 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.age}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.age.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Locations */}
      <div className={`rounded-lg p-5 border ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50/50'}`}>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Top Ciudades
        </h3>
        <div className="flex flex-col gap-3 mt-4">
          {data.top_locations.map((loc, idx) => {
            const maxVal = Math.max(...data.top_locations.map(l => l.value));
            const percentage = (loc.value / maxVal) * 100;
            return (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{loc.name}</span>
                  <span className="font-semibold text-primary-600">{loc.value.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
