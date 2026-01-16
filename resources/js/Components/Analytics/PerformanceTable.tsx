import { useTheme } from "@/Hooks/useTheme";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Layers,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface PublicationStat {
  id: number;
  title: string;
  views: number;
  clicks: number;
  engagement: number;
  avg_engagement_rate?: number;
}

export interface CampaignStat {
  id: number;
  title: string;
  status: string;
  total_views: number;
  total_clicks: number;
  total_engagement: number;
  publications: PublicationStat[];
}

interface PerformanceTableProps {
  campaigns: CampaignStat[];
}

type SortField = "title" | "total_views" | "total_clicks" | "total_engagement";
type SortDirection = "asc" | "desc";

export default function PerformanceTable({ campaigns }: PerformanceTableProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [sortField, setSortField] = useState<SortField>("total_engagement");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-3 h-3 text-gray-400 opacity-50" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3 h-3 text-primary-600" />
    ) : (
      <ChevronDown className="w-3 h-3 text-primary-600" />
    );
  };

  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle numeric comparisons
      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortDirection === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
  }, [campaigns, sortField, sortDirection]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-800">
        <thead
          className={theme === "dark" ? "bg-neutral-900/50" : "bg-gray-50"}
        >
          <tr>
            <th
              onClick={() => handleSort("title")}
              className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors group"
            >
              <div className="flex items-center gap-2">
                {t("common.item") || "Elemento"}
                {getSortIcon("title")}
              </div>
            </th>
            <th
              onClick={() => handleSort("total_views")}
              className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center justify-center gap-1">
                <Eye className="w-3 h-3" />
                {t("analytics.vistas") || "Vistas"}
                {getSortIcon("total_views")}
              </div>
            </th>
            <th
              onClick={() => handleSort("total_clicks")}
              className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center justify-center gap-1">
                <MousePointerClick className="w-3 h-3" />
                {t("analytics.clics") || "Clics"}
                {getSortIcon("total_clicks")}
              </div>
            </th>
            <th
              onClick={() => handleSort("total_engagement")}
              className="px-6 py-3 text-center text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {t("analytics.engagement") || "Engagement"}
                {getSortIcon("total_engagement")}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
          {sortedCampaigns.map((campaign) => (
            <React.Fragment key={campaign.id}>
              {/* Campaign Row */}
              <tr
                className={
                  theme === "dark" ? "bg-neutral-800/30" : "bg-primary-50/10"
                }
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Layers className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {campaign.id === 0
                          ? t("analytics.drilldown.standalone")
                          : campaign.title}
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold tracking-tight">
                        {campaign.id !== 0 && (
                          <>
                            <span className="uppercase">
                              {t(`common.status.${campaign.status}`) ||
                                campaign.status}
                            </span>
                            <span className="mx-1">•</span>
                          </>
                        )}
                        {campaign.publications.length}{" "}
                        {t("common.publications") || "Publicaciones"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {campaign.total_views.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {campaign.total_clicks.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    {campaign.total_engagement.toLocaleString()}
                  </span>
                </td>
              </tr>

              {/* Individual Publication Rows */}
              {campaign.publications.map((pub) => (
                <tr
                  key={pub.id}
                  className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2 pl-8">
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[250px]">
                        {pub.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center whitespace-nowrap">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {pub.views.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center whitespace-nowrap">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {pub.clicks.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center whitespace-nowrap">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                      {pub.engagement.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}

          {campaigns.length === 0 && (
            <tr>
              <td
                colSpan={4}
                className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
              >
                No se encontraron datos de rendimiento.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
