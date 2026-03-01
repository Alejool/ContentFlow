import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Eye, MousePointer2, Users, Heart } from 'lucide-react';

interface PlatformBreakdown {
  platform: string;
  views: number;
  clicks: number;
  conversions: number;
  reach: number;
  engagement: number;
  avg_engagement_rate: number;
}

interface DailyPerformance {
  date: string;
  views: number;
  clicks: number;
  engagement: number;
  reach: number;
}

interface Publication {
  id: number;
  title: string;
  published_at: string;
  total_views: number;
  total_clicks: number;
  total_conversions: number;
  total_engagement: number;
  total_reach: number;
  avg_engagement_rate: number;
  platform_breakdown: PlatformBreakdown[];
  daily_performance: DailyPerformance[];
}

interface Props {
  publications: Publication[];
  theme?: 'light' | 'dark';
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  twitter: '#1DA1F2',
  x: '#000000',
  youtube: '#FF0000',
  tiktok: '#000000',
};

interface StatCardProps {
  icon: any;
  label: string;
  value: number | string;
  color: string;
  isDark: boolean;
}

const StatCard = ({ icon: Icon, label, value, color, isDark }: StatCardProps) => (
  <div className={`p-3 rounded-lg ${isDark ? 'bg-neutral-700/50' : 'bg-gray-50'}`}>
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
    </div>
    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </p>
  </div>
);

export default function DetailedPublicationPerformance({ publications, theme = 'light' }: Props) {
  const isDark = theme === 'dark';

  return (
    <div className={`space-y-6 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      {publications.map((pub) => (
        <div
          key={pub.id}
          className={`rounded-lg p-6 ${
            isDark
              ? 'bg-neutral-800/50 border border-neutral-700/50'
              : 'bg-white border border-gray-100 shadow-sm'
          }`}
        >
          <div className="mb-6">
            <h3 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {pub.title}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Publicado: {pub.published_at}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <StatCard icon={Eye} label="Vistas" value={pub.total_views} color="text-blue-500" isDark={isDark} />
            <StatCard icon={MousePointer2} label="Clicks" value={pub.total_clicks} color="text-purple-500" isDark={isDark} />
            <StatCard icon={Heart} label="Engagement" value={pub.total_engagement} color="text-pink-500" isDark={isDark} />
            <StatCard icon={Users} label="Alcance" value={pub.total_reach} color="text-green-500" isDark={isDark} />
            <StatCard icon={TrendingUp} label="Tasa" value={`${pub.avg_engagement_rate}%`} color="text-orange-500" isDark={isDark} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Rendimiento por Plataforma
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={pub.platform_breakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="platform" 
                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: isDark ? '#f3f4f6' : '#111827' }}
                  />
                  <Legend />
                  <Bar dataKey="views" fill="#3b82f6" name="Vistas" />
                  <Bar dataKey="engagement" fill="#8b5cf6" name="Engagement" />
                  <Bar dataKey="reach" fill="#10b981" name="Alcance" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-4 space-y-2">
                {pub.platform_breakdown.map((platform) => (
                  <div
                    key={platform.platform}
                    className={`flex items-center justify-between p-2 rounded ${
                      isDark ? 'bg-neutral-700/30' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: PLATFORM_COLORS[platform.platform] || '#6366f1' }}
                      />
                      <span className="text-sm font-medium capitalize">{platform.platform}</span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span>{platform.views} vistas</span>
                      <span>{platform.engagement} eng.</span>
                      <span className="font-semibold">{platform.avg_engagement_rate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Rendimiento Diario
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={pub.daily_performance}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="date" 
                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: isDark ? '#f3f4f6' : '#111827' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} name="Vistas" />
                  <Line type="monotone" dataKey="engagement" stroke="#8b5cf6" strokeWidth={2} name="Engagement" />
                  <Line type="monotone" dataKey="reach" stroke="#10b981" strokeWidth={2} name="Alcance" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
