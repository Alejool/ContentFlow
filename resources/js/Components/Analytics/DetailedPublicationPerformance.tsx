import { SeededRandom } from "@/Utils/stableMock";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  MousePointer2,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
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
} from "recharts";

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
  theme?: "light" | "dark";
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  twitter: "#1DA1F2",
  x: "#000000",
  youtube: "#FF0000",
  tiktok: "#000000",
};

interface StatCardProps {
  icon: any;
  label: string;
  value: number | string;
  color: string;
  isDark: boolean;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
  isDark,
}: StatCardProps) => (
  <div
    className={`p-3 rounded-lg ${isDark ? "bg-neutral-700/50" : "bg-gray-50"}`}
  >
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        {label}
      </span>
    </div>
    <p
      className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
    >
      {typeof value === "number" ? value.toLocaleString() : value}
    </p>
  </div>
);

export default function DetailedPublicationPerformance({
  publications,
  theme = "light",
}: Props) {
  const isDark = theme === "dark";
  const [searchTerm, setSearchTerm] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredPublications = useMemo(() => {
    if (!searchTerm) return publications;
    return publications.filter((pub) =>
      pub.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [publications, searchTerm]);

  const mockPublications: Publication[] = [
    {
      id: 301,
      title: "Campaña de Verano - Lanzamiento",
      published_at: "hace 2 días",
      total_views: 12500,
      total_clicks: 850,
      total_conversions: 120,
      total_engagement: 1450,
      total_reach: 45000,
      avg_engagement_rate: 3.2,
      platform_breakdown: [
        {
          platform: "instagram",
          views: 5000,
          clicks: 400,
          conversions: 50,
          reach: 18000,
          engagement: 800,
          avg_engagement_rate: 4.4,
        },
        {
          platform: "facebook",
          views: 7500,
          clicks: 450,
          conversions: 70,
          reach: 27000,
          engagement: 650,
          avg_engagement_rate: 2.4,
        },
      ],
      daily_performance: [
        {
          date: "Día 1",
          views: 4000,
          clicks: 300,
          engagement: 500,
          reach: 15000,
        },
        {
          date: "Día 2",
          views: 8500,
          clicks: 550,
          engagement: 950,
          reach: 30000,
        },
      ],
    },
    {
      id: 302,
      title: "Tutorial de Producto: Nuevas Funciones",
      published_at: "hace 5 días",
      total_views: 8900,
      total_clicks: 1200,
      total_conversions: 450,
      total_engagement: 2100,
      total_reach: 25000,
      avg_engagement_rate: 8.4,
      platform_breakdown: [
        {
          platform: "youtube",
          views: 6000,
          clicks: 900,
          conversions: 350,
          reach: 15000,
          engagement: 1500,
          avg_engagement_rate: 10.0,
        },
        {
          platform: "x",
          views: 2900,
          clicks: 300,
          conversions: 100,
          reach: 10000,
          engagement: 600,
          avg_engagement_rate: 6.0,
        },
      ],
      daily_performance: [
        {
          date: "Día 1",
          views: 2000,
          clicks: 200,
          engagement: 400,
          reach: 5000,
        },
        {
          date: "Día 2",
          views: 3500,
          clicks: 400,
          engagement: 800,
          reach: 10000,
        },
        {
          date: "Día 3",
          views: 1500,
          clicks: 300,
          engagement: 400,
          reach: 5000,
        },
        {
          date: "Día 4",
          views: 1000,
          clicks: 150,
          engagement: 300,
          reach: 3000,
        },
        {
          date: "Día 5",
          views: 900,
          clicks: 150,
          engagement: 200,
          reach: 2000,
        },
      ],
    },
  ];

  const displayPublications =
    filteredPublications.length > 0 || searchTerm
      ? filteredPublications
      : mockPublications;

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth > 1024 ? 800 : window.innerWidth;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const ensureDailyPerformance = (pub: Publication) => {
    if (pub.daily_performance && pub.daily_performance.length > 0) {
      return pub.daily_performance;
    }

    const rng = new SeededRandom(pub.id);
    const defaultMetrics = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      defaultMetrics.push({
        date: d.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
        }),
        views: rng.nextInt(500, 2000),
        clicks: rng.nextInt(50, 300),
        engagement: rng.nextInt(30, 150),
        reach: rng.nextInt(1000, 5000),
      });
    }
    return defaultMetrics;
  };

  const ensurePlatformBreakdown = (pub: Publication) => {
    if (pub.platform_breakdown && pub.platform_breakdown.length > 0) {
      return pub.platform_breakdown;
    }

    return [
      {
        platform: "general",
        views: pub.total_views || 0,
        clicks: pub.total_clicks || 0,
        conversions: pub.total_conversions || 0,
        reach: pub.total_reach || 0,
        engagement: pub.total_engagement || 0,
        avg_engagement_rate: pub.avg_engagement_rate || 0,
      },
    ];
  };

  return (
    <div className={`space-y-6 ${isDark ? "text-gray-100" : "text-gray-900"}`}>
      <div className="flex items-center gap-3 w-full max-w-md mb-6">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search
              className={`w-5 h-5 ${isDark ? "text-gray-500" : "text-gray-400"}`}
            />
          </div>
          <input
            type="text"
            className={`block w-full pl-10 pr-3 py-2 border rounded-lg leading-5 transition-colors duration-150 focus:outline-none sm:text-sm ${
              isDark
                ? "bg-neutral-800/50 border-neutral-700 text-gray-200 focus:border-primary-500 focus:ring-primary-500 placeholder-gray-500"
                : "bg-white border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-primary-500 placeholder-gray-400"
            }`}
            placeholder="Buscar publicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {publications.length === 0 && !searchTerm && (
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg text-sm dark:bg-orange-900/20 dark:border-orange-800/50 dark:text-orange-300">
          <strong>Modo de demostración:</strong> No tienes publicaciones con
          análisis aún. Se están mostrando métricas de prueba.
        </div>
      )}

      <div className="relative group">
        {/* Navigation Buttons */}
        {displayPublications.length > 1 && (
          <>
            <button
              onClick={() => scroll("left")}
              className={`absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 ${
                isDark
                  ? "bg-neutral-800 text-white hover:bg-neutral-700"
                  : "bg-white text-gray-800 hover:bg-gray-50"
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scroll("right")}
              className={`absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 ${
                isDark
                  ? "bg-neutral-800 text-white hover:bg-neutral-700"
                  : "bg-white text-gray-800 hover:bg-gray-50"
              }`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory hide-scrollbars"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {displayPublications.map((pub) => (
            <div
              key={pub.id}
              className={`shrink-0 w-full lg:w-[800px] snap-center rounded-lg p-6 ${
                isDark
                  ? "bg-neutral-800/50 border border-neutral-700/50"
                  : "bg-white border border-gray-100 shadow-sm"
              }`}
            >
              <div className="mb-6">
                <h3
                  className={`text-xl font-bold mb-1 truncate ${isDark ? "text-white" : "text-gray-900"}`}
                  title={pub.title}
                >
                  {pub.title}
                </h3>
                <p
                  className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  Publicado: {pub.published_at}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <StatCard
                  icon={Eye}
                  label="Vistas"
                  value={pub.total_views}
                  color="text-blue-500"
                  isDark={isDark}
                />
                <StatCard
                  icon={MousePointer2}
                  label="Clicks"
                  value={pub.total_clicks}
                  color="text-purple-500"
                  isDark={isDark}
                />
                <StatCard
                  icon={Heart}
                  label="Engagement"
                  value={pub.total_engagement}
                  color="text-pink-500"
                  isDark={isDark}
                />
                <StatCard
                  icon={Users}
                  label="Alcance"
                  value={pub.total_reach}
                  color="text-green-500"
                  isDark={isDark}
                />
                <StatCard
                  icon={TrendingUp}
                  label="Tasa"
                  value={`${pub.avg_engagement_rate}%`}
                  color="text-orange-500"
                  isDark={isDark}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4
                    className={`text-sm font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Rendimiento por Plataforma
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={ensurePlatformBreakdown(pub)}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? "#374151" : "#e5e7eb"}
                      />
                      <XAxis
                        dataKey="platform"
                        stroke={isDark ? "#9ca3af" : "#6b7280"}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        stroke={isDark ? "#9ca3af" : "#6b7280"}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? "#1f2937" : "#ffffff",
                          border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: isDark ? "#f3f4f6" : "#111827" }}
                      />
                      <Legend />
                      <Bar dataKey="views" fill="#3b82f6" name="Vistas" />
                      <Bar
                        dataKey="engagement"
                        fill="#8b5cf6"
                        name="Engagement"
                      />
                      <Bar dataKey="reach" fill="#10b981" name="Alcance" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-4 space-y-2">
                    {ensurePlatformBreakdown(pub).map((platform) => (
                      <div
                        key={platform.platform}
                        className={`flex items-center justify-between p-2 rounded ${
                          isDark ? "bg-neutral-700/30" : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                PLATFORM_COLORS[platform.platform] || "#6366f1",
                            }}
                          />
                          <span className="text-sm font-medium capitalize">
                            {platform.platform}
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs">
                          <span>{platform.views} vistas</span>
                          <span>{platform.engagement} eng.</span>
                          <span className="font-semibold">
                            {platform.avg_engagement_rate}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4
                    className={`text-sm font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Rendimiento Diario
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={ensureDailyPerformance(pub)}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? "#374151" : "#e5e7eb"}
                      />
                      <XAxis
                        dataKey="date"
                        stroke={isDark ? "#9ca3af" : "#6b7280"}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        stroke={isDark ? "#9ca3af" : "#6b7280"}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? "#1f2937" : "#ffffff",
                          border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: isDark ? "#f3f4f6" : "#111827" }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Vistas"
                      />
                      <Line
                        type="monotone"
                        dataKey="engagement"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="Engagement"
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
              </div>
            </div>
          ))}
          {displayPublications.length === 0 && (
            <div
              className={`w-full text-center py-12 ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              {t("publications.table.emptyState.searchEmpty")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
