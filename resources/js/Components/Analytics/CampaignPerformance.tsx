import BarChart from "@/Components/Statistics/BarChart";
import Input from "@/Components/common/Modern/Input";
import Button from "@/Components/common/Modern/Button";
import { Search, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PerformanceDetailModal from "./PerformanceDetailModal";
import { CampaignStat } from "./PerformanceTable";

interface CampaignPerformanceProps {
  campaigns: CampaignStat[];
  theme?: "light" | "dark";
  title?: string;
  subtitle?: string;
}

export default function CampaignPerformance({
  campaigns,
  theme = "light",
  title,
  subtitle,
}: CampaignPerformanceProps) {
  const { t } = useTranslation();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCampaigns = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return campaigns.filter((campaign) => {
      const campaignTitle = (
        campaign.id === 0 ? t("analytics.drilldown.standalone") : campaign.title
      ).toLowerCase();

      // Check if campaign title matches
      const matchesCampaign = campaignTitle.includes(term);

      // Check if any publication matches the search term
      const matchesPublications = campaign.publications.some((pub) =>
        pub.title.toLowerCase().includes(term),
      );

      return matchesCampaign || matchesPublications;
    });
  }, [campaigns, searchTerm, t]);

  // Sort by engagement and limit to top 5 for the chart
  const topCampaigns = useMemo(() => {
    return [...filteredCampaigns]
      .sort((a, b) => b.total_engagement - a.total_engagement)
      .slice(0, 5);
  }, [filteredCampaigns]);

  const campaignData = topCampaigns.map((campaign) => ({
    name:
      campaign.title.length > 15
        ? campaign.title.substring(0, 15) + "..."
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
      className={`rounded-lg p-6 mb-8 transition-colors duration-300
            ${
              theme === "dark"
                ? "bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50"
                : "bg-white shadow-xl border border-gray-100"
            }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2
            className={`text-xl font-bold flex items-center gap-2
                    text-gray-900 dark:text-gray-100`}
          >
            <TrendingUp className="w-5 h-5 text-primary-500" />
            {title || t("analytics.charts.topCampaignPerformance")}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="w-full md:w-64">
            <Input
              id="campaign-search"
              placeholder={t("common.search") || "Buscar campañas..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              className="h-10"
            />
          </div>
          <Button
            onClick={() => setIsDetailModalOpen(true)}
            variant="primary"
            buttonStyle="solid"
            size="sm"
            className={`!text-sm !font-bold !shrink-0
                ${
                  theme === "dark"
                    ? "!bg-primary-900/30 !text-primary-400 hover:!bg-primary-900/50"
                    : "!bg-primary-50 !text-primary-600 hover:!bg-primary-100"
                }`}
          >
            {t("common.viewAll") || "Ver todo"}
          </Button>
        </div>
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
