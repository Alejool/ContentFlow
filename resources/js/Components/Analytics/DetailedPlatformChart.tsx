import { SeededRandom } from '@/Utils/stableMock';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const mockPlatforms: PlatformData[] = [
    {
      id: 201,
      platform: 'youtube',
      account_name: 'Intellipost Channel',
      current_followers: 12500,
      total_engagement: 4500,
      avg_engagement_rate: 6.5,
      total_reach: 89000,
      follower_growth: 450,
      daily_metrics: [
        {
          date: '01/03',
          followers: 12050,
          reach: 12000,
          engagement: 600,
          engagement_rate: 5.0,
          followers_gained: 50,
          followers_lost: 10,
        },
        {
          date: '02/03',
          followers: 12100,
          reach: 13500,
          engagement: 800,
          engagement_rate: 5.9,
          followers_gained: 60,
          followers_lost: 5,
        },
        {
          date: '03/03',
          followers: 12250,
          reach: 15000,
          engagement: 1100,
          engagement_rate: 7.3,
          followers_gained: 160,
          followers_lost: 10,
        },
        {
          date: '04/03',
          followers: 12300,
          reach: 11000,
          engagement: 500,
          engagement_rate: 4.5,
          followers_gained: 70,
          followers_lost: 20,
        },
        {
          date: '05/03',
          followers: 12500,
          reach: 18000,
          engagement: 1500,
          engagement_rate: 8.3,
          followers_gained: 210,
          followers_lost: 10,
        },
      ],
    },
    {
      id: 202,
      platform: 'instagram',
      account_name: 'contentflow_app',
      current_followers: 45200,
      total_engagement: 12400,
      avg_engagement_rate: 4.2,
      total_reach: 120000,
      follower_growth: 890,
      daily_metrics: [
        {
          date: '01/03',
          followers: 44310,
          reach: 18000,
          engagement: 1800,
          engagement_rate: 4.0,
          followers_gained: 150,
          followers_lost: 30,
        },
        {
          date: '02/03',
          followers: 44500,
          reach: 22000,
          engagement: 2100,
          engagement_rate: 4.7,
          followers_gained: 220,
          followers_lost: 40,
        },
        {
          date: '03/03',
          followers: 44800,
          reach: 25000,
          engagement: 2500,
          engagement_rate: 5.5,
          followers_gained: 340,
          followers_lost: 20,
        },
        {
          date: '04/03',
          followers: 44950,
          reach: 19000,
          engagement: 1600,
          engagement_rate: 3.5,
          followers_gained: 180,
          followers_lost: 50,
        },
        {
          date: '05/03',
          followers: 45200,
          reach: 28000,
          engagement: 3100,
          engagement_rate: 6.8,
          followers_gained: 300,
          followers_lost: 25,
        },
      ],
    },
  ];

  const displayPlatforms =
    platforms.length > 0
      ? [...platforms, ...(platforms.length <= 1 ? mockPlatforms : [])]
      : mockPlatforms;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth > 1024 ? 800 : window.innerWidth;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const ensureMetrics = (platform: PlatformData) => {
    if (platform.daily_metrics && platform.daily_metrics.length > 0) {
      return platform.daily_metrics;
    }

    // Usar SeededRandom para que los datos no cambien al recargar/cambiar tema
    const rng = new SeededRandom(platform.id || platform.account_name);

    const defaultMetrics = [];
    let baseFollowers = platform.current_followers || rng.nextInt(1000, 6000);

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const dailyEarned = rng.nextInt(5, 55);
      const dailyLost = rng.nextInt(0, 20);
      baseFollowers = baseFollowers + dailyEarned - dailyLost;

      defaultMetrics.push({
        date: d.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
        }),
        followers: baseFollowers,
        reach: rng.nextInt(500, 3500),
        engagement: rng.nextInt(100, 900),
        engagement_rate: +rng.nextFloat(1, 6).toFixed(1),
        followers_gained: dailyEarned,
        followers_lost: dailyLost,
      });
    }
    return defaultMetrics;
  };

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
    <div className="group relative">
      {platforms.length === 0 && (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-800/50 dark:bg-orange-900/20 dark:text-orange-300">
          <strong>Modo de demostración:</strong> No hay datos reales de plataformas. Se están
          mostrando métricas de prueba.
        </div>
      )}

      {/* Navigation Buttons */}
      {displayPlatforms.length > 1 && (
        <>
          <button
            onClick={() => scroll('left')}
            className={`absolute left-0 top-1/2 z-10 -ml-4 -translate-y-1/2 rounded-full p-2 opacity-0 shadow-lg transition-all disabled:opacity-0 group-hover:opacity-100 ${
              isDark
                ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                : 'bg-white text-gray-800 hover:bg-gray-50'
            }`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => scroll('right')}
            className={`absolute right-0 top-1/2 z-10 -mr-4 -translate-y-1/2 rounded-full p-2 opacity-0 shadow-lg transition-all disabled:opacity-0 group-hover:opacity-100 ${
              isDark
                ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                : 'bg-white text-gray-800 hover:bg-gray-50'
            }`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div
        ref={scrollContainerRef}
        className={`hide-scrollbars flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {' '}
        {displayPlatforms.map((platform) => (
          <div
            key={platform.id}
            className={`w-full shrink-0 snap-center rounded-lg p-6 lg:w-[800px] ${
              isDark
                ? 'border border-neutral-700/50 bg-neutral-800/50'
                : 'border border-gray-100 bg-white shadow-sm'
            }`}
          >
            <div className="mb-6 flex items-center justify-between">
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
                  <p
                    className={`font-bold ${platform.follower_growth >= 0 ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {platform.follower_growth >= 0 ? '+' : ''}
                    {platform.follower_growth}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4
                  className={`mb-3 text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Seguidores y Alcance
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={ensureMetrics(platform)}>
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
                <h4
                  className={`mb-3 text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Engagement Diario
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ensureMetrics(platform)}>
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
    </div>
  );
}
