import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DailyMetric {
  date: string;
  followers: number;
  reach: number;
  engagement: number;
  engagement_rate: number;
  followers_gained: number;
  followers_lost: number;
}

interface PlatformData {
  id: number;
  platform: string;
  account_name: string;
  current_followers: number;
  total_engagement: number;
  avg_engagement_rate: number;
  total_reach: number;
  follower_growth: number;
  daily_metrics: DailyMetric[];
}

interface Props {
  platforms: PlatformData[];
  theme?: 'light' | 'dark';
}

export default function DetailedPlatformChart({ platforms, theme = 'light' }: Props) {
  const isDark = theme === 'dark';

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      facebook: '#1877F2',
      instagram: '#E4405F',
      twitter: '#1DA1F2',
      x: '#000000',
      youtube: '#FF0000',
      tiktok: '#000000',
    };
    return colors[platform.toLowerCase()] || '#6366f1';
  };

  return (
    <div className={`space-y-6 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      {platforms.map((platform) => (
        <div
          key={platform.id}
          className={`rounded-lg p-6 ${
            isDark
              ? 'bg-neutral-800/50 border border-neutral-700/50'
              : 'bg-white border border-gray-100 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {platform.platform.toUpperCase()} - {platform.account_name}
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {platform.current_followers.toLocaleString()} seguidores
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Engagement</p>
                <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {platform.total_engagement.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Tasa</p>
                <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {platform.avg_engagement_rate}%
                </p>
              </div>
              <div className="text-center">
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Crecimiento</p>
                <p className={`font-bold ${platform.follower_growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {platform.follower_growth >= 0 ? '+' : ''}{platform.follower_growth}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Seguidores y Alcance
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={platform.daily_metrics}>
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
                  <Line 
                    type="monotone" 
                    dataKey="followers" 
                    stroke={getPlatformColor(platform.platform)} 
                    strokeWidth={2}
                    name="Seguidores"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="reach" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Alcance"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Engagement Diario
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={platform.daily_metrics}>
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
                  <Bar dataKey="engagement" fill="#8b5cf6" name="Engagement" />
                  <Bar dataKey="followers_gained" fill="#10b981" name="Ganados" />
                  <Bar dataKey="followers_lost" fill="#ef4444" name="Perdidos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
