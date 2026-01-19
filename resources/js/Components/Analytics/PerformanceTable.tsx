import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import { useTheme } from "@/Hooks/useTheme";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Layers,
  MousePointer2,
  Search,
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
  externalSearchTerm?: string;
  onSearchChange?: (val: string) => void;
  hideSearch?: boolean;
}

type SortField = "title" | "total_views" | "total_clicks" | "total_engagement";
type SortDirection = "asc" | "desc";

export default function PerformanceTable({
  campaigns,
  externalSearchTerm,
  onSearchChange,
  hideSearch = false,
}: PerformanceTableProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [sortField, setSortField] = useState<SortField>("total_engagement");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const searchTerm = externalSearchTerm ?? internalSearchTerm;
  const setSearchTerm = onSearchChange ?? setInternalSearchTerm;

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

  const filteredCampaigns = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return campaigns
      .map((campaign) => {
        const campaignTitle = (
          campaign.id === 0
            ? t("analytics.drilldown.standalone")
            : campaign.title
        ).toLowerCase();

        // Check if campaign title matches
        const matchesCampaign = campaignTitle.includes(term);

        // Filter publications that match the search term
        const matchingPublications = campaign.publications.filter((pub) =>
          pub.title.toLowerCase().includes(term),
        );

        // If campaign matches OR any publication matches, keep the campaign
        if (matchesCampaign || matchingPublications.length > 0) {
          return {
            ...campaign,
            // If the campaign itself doesn't match, only show the matching publications
            // Otherwise, show all publications of the campaign (as before)
            // But user said "busca por nombre de cmapaña o publicaciones"
            // Let's refine it: show campaign if it matches, and within it, show all publications?
            // Or only show publications that match if any do?
            // Usually, user expects to see the "path" to the result.
            publications: matchesCampaign
              ? campaign.publications
              : matchingPublications,
          };
        }
        return null;
      })
      .filter((c): c is CampaignStat => c !== null);
  }, [campaigns, searchTerm, t]);

  const sortedCampaigns = useMemo(() => {
    return [...filteredCampaigns].sort((a, b) => {
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
  }, [filteredCampaigns, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedCampaigns.length / itemsPerPage);
  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedCampaigns.slice(start, start + itemsPerPage);
  }, [sortedCampaigns, currentPage]);

  return (
    <div className="space-y-4">
      {/* Search Filter */}
      {!hideSearch && (
        <div className="flex justify-end p-2">
          <div className="w-full md:w-64">
            <Input
              id="search"
              placeholder={t("common.search") || "Buscar..."}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              icon={Search}
              className="h-10"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-neutral-800 shadow-sm">
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
                  <MousePointer2 className="w-3 h-3" />
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
            {paginatedCampaigns.map((campaign) => (
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

            {paginatedCampaigns.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  {searchTerm
                    ? t("common.noResults")
                    : t("analytics.emptyState.title")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 dark:bg-neutral-900/30 border-t border-gray-100 dark:border-neutral-800">
          <div className="text-xs font-medium text-gray-500">
            {t("common.showing") || "Mostrando"}{" "}
            <span className="font-bold">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            -{" "}
            <span className="font-bold">
              {Math.min(currentPage * itemsPerPage, sortedCampaigns.length)}
            </span>{" "}
            {t("common.of") || "de"}{" "}
            <span className="font-bold">{sortedCampaigns.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 min-w-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    currentPage === i + 1
                      ? "bg-primary-600 text-white"
                      : "text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 min-w-0"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
