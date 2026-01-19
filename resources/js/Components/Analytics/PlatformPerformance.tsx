import BarChart from "@/Components/Statistics/BarChart";
import { LayoutPanelLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PlatformPerformanceProps {
  data: {
    platform: string;
    total_engagement: number;
    avg_engagement_rate: number;
    total_reach: number;
    follower_growth: number;
  }[];
  theme?: "light" | "dark";
}

export default function PlatformPerformance({
  data,
  theme = "light",
}: PlatformPerformanceProps) {
  const { t } = useTranslation();

  const chartData = data.map((item) => ({
    name: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
    engagement: item.total_engagement,
    growth: item.follower_growth,
  }));

  const bars = [
    {
      dataKey: "engagement",
      name: t("analytics.platform.engagement") || "Engagement Total",
      color: theme === "dark" ? "#818cf8" : "#4f46e5",
    },
    {
      dataKey: "growth",
      name: t("analytics.platform.growth") || "Crecimiento",
      color: theme === "dark" ? "#34d399" : "#10b981",
    },
  ];

  const getCardBg = () => {
    return theme === "dark"
      ? "bg-neutral-800/70 backdrop-blur-sm border border-neutral-700/50"
      : "bg-white/60 backdrop-blur-lg border border-gray-100 shadow-sm";
  };

  const getTextColor = (type: "primary" | "title" = "primary") => {
    if (theme === "dark") {
      return type === "title" ? "text-white" : "text-gray-400";
    }
    return type === "title" ? "text-gray-900" : "text-gray-600";
  };

  return (
    <div
      className={`rounded-lg p-6 transition-all duration-300 ${getCardBg()}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h2
          className={`text-xl font-bold flex items-center gap-2 ${getTextColor(
            "title",
          )}`}
        >
          <div
            className={`p-2 rounded-lg ${
              theme === "dark" ? "bg-indigo-900/20" : "bg-indigo-100"
            }`}
          >
            <LayoutPanelLeft
              className={`w-5 h-5 ${
                theme === "dark" ? "text-indigo-400" : "text-indigo-600"
              }`}
            />
          </div>
          {t("dashboard.platformPerformance") ||
            "Rendimiento Global por Plataforma"}
        </h2>
      </div>

      <div className="mt-4">
        <BarChart
          data={chartData}
          bars={bars}
          xAxisKey="name"
          height={300}
          theme={theme}
        />
      </div>
    </div>
  );
}
