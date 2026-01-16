import BarChart from "@/Components/Statistics/BarChart";
import { TrendingUp } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import PerformanceDetailModal from "./PerformanceDetailModal";

interface Publication {
  id: number;
  title: string;
  views: number;
  clicks: number;
  engagement: number;
  avg_engagement_rate: number;
}

interface Campaign {
  id: number;
  title: string;
  status: string;
  total_engagement: number;
  total_views: number;
  total_clicks: number;
  publications: Publication[];
}

interface CampaignPerformanceProps {
  campaigns: Campaign[];
  theme?: "light" | "dark";
}

export default function CampaignPerformance({
  campaigns,
  theme = "light",
}: CampaignPerformanceProps) {
  const { t } = useTranslation();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const campaignData = campaigns.map((campaign) => ({
    name:
      campaign.title.length > 20
        ? campaign.title.substring(0, 20) + "..."
        : campaign.title,
    engagement: campaign.total_engagement,
    views: campaign.total_views,
    clicks: campaign.total_clicks,
  }));

  const barColors =
    theme === "dark"
      ? [
          {
            dataKey: "views",
            name: t("analytics.charts.views"),
            color: "#60a5fa",
          },
          {
            dataKey: "clicks",
            name: t("analytics.charts.clicks"),
            color: "#34d399",
          },
          {
            dataKey: "engagement",
            name: t("analytics.charts.engagement"),
            color: "#a78bfa",
          },
        ]
      : [
          {
            dataKey: "views",
            name: t("analytics.charts.views"),
            color: "#3b82f6",
          },
          {
            dataKey: "clicks",
            name: t("analytics.charts.clicks"),
            color: "#10b981",
          },
          {
            dataKey: "engagement",
            name: t("analytics.charts.engagement"),
            color: "#8b5cf6",
          },
        ];

  return (
    <div
      className={`rounded-xl p-6 mb-8 transition-colors duration-300
            ${
              theme === "dark"
                ? "bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50"
                : "bg-white shadow-xl border border-gray-100"
            }`}
    >
      <div className="flex items-center justify-between mb-6">
        <h2
          className={`text-xl font-bold flex items-center gap-2
                  ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}
        >
          <TrendingUp className="w-5 h-5 text-primary-500" />
          {t("analytics.charts.topCampaignPerformance")}
        </h2>
        <button
          onClick={() => setIsDetailModalOpen(true)}
          className={`text-sm font-bold px-4 py-2 rounded-lg transition-all active:scale-95
              ${
                theme === "dark"
                  ? "bg-primary-900/30 text-primary-400 hover:bg-primary-900/50"
                  : "bg-primary-50 text-primary-600 hover:bg-primary-100"
              }`}
        >
          {t("common.viewAll") || "Ver todo"}
        </button>
      </div>

      <BarChart
        data={campaignData}
        bars={barColors}
        xAxisKey="name"
        height={350}
        theme={theme}
      />

      <PerformanceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        campaigns={campaigns}
      />
    </div>
  );
}
