import React from "react";
import { useTranslation } from "react-i18next";
import BarChart from "@/Components/Statistics/BarChart";

interface Campaign {
  title: string;
  total_engagement: number;
  total_views: number;
  total_clicks: number;
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
      className={`rounded-2xl p-6 mb-8 transition-colors duration-300
            ${
              theme === "dark"
                ? "bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50"
                : "bg-white shadow-lg border border-gray-100"
            }`}
    >
      <h2
        className={`text-xl font-bold mb-4
                ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}
      >
        {t("analytics.charts.topCampaignPerformance")}
      </h2>
      <BarChart
        data={campaignData}
        bars={barColors}
        xAxisKey="name"
        height={350}
        theme={theme}
      />
    </div>
  );
}
