import Input from "@/Components/common/Modern/Input";
import AdvancedPagination from "@/Components/common/ui/AdvancedPagination";
import { useTheme } from "@/Hooks/useTheme";
import {
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
  const [itemsPerPage, setItemsPerPage] = useState(5);

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
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-gray-400 opacity-50" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-3 w-3 text-primary-600" />
    ) : (
      <ChevronDown className="h-3 w-3 text-primary-600" />
    );
  };

  const filteredCampaigns = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return campaigns
      .map((campaign) => {
        const campaignTitle = (
          campaign.id === 0 ? t("analytics.drilldown.standalone") : campaign.title
        ).toLowerCase();

        const matchesCampaign = campaignTitle.includes(term);

        const matchingPublications = campaign.publications.filter((pub) =>
          pub.title.toLowerCase().includes(term),
        );

        if (matchesCampaign || matchingPublications.length > 0) {
          return {
            ...campaign,
            publications: matchesCampaign ? campaign.publications : matchingPublications,
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

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortDirection === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
  }, [filteredCampaigns, sortField, sortDirection]);

  const allPublications = useMemo(() => {
    const items: { publication: PublicationStat; campaign: CampaignStat }[] = [];
    sortedCampaigns.forEach((campaign) => {
      campaign.publications.forEach((pub) => {
        items.push({ publication: pub, campaign });
      });
    });
    return items;
  }, [sortedCampaigns]);

  const totalPages = Math.ceil(allPublications.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return allPublications.slice(start, start + itemsPerPage);
  }, [allPublications, currentPage, itemsPerPage]);

  return (
    <div className="space-y-4">
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

      <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-sm dark:border-neutral-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-800">
          <thead className={theme === "dark" ? "bg-neutral-900/50" : "bg-gray-50"}>
            <tr>
              <th
                onClick={() => handleSort("title")}
                className="group cursor-pointer px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
              >
                <div className="flex items-center gap-2">
                  {t("common.item") || "Elemento"}
                  {getSortIcon("title")}
                </div>
              </th>
              <th
                onClick={() => handleSort("total_views")}
                className="cursor-pointer px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
              >
                <div className="flex items-center justify-center gap-1">
                  <Eye className="h-3 w-3" />
                  {t("analytics.vistas") || "Vistas"}
                  {getSortIcon("total_views")}
                </div>
              </th>
              <th
                onClick={() => handleSort("total_clicks")}
                className="cursor-pointer px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
              >
                <div className="flex items-center justify-center gap-1">
                  <MousePointer2 className="h-3 w-3" />
                  {t("analytics.clics") || "Clics"}
                  {getSortIcon("total_clicks")}
                </div>
              </th>
              <th
                onClick={() => handleSort("total_engagement")}
                className="cursor-pointer px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-purple-600 transition-colors hover:bg-gray-100 dark:text-purple-400 dark:hover:bg-neutral-800"
              >
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {t("analytics.engagement") || "Engagement"}
                  {getSortIcon("total_engagement")}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
            {paginatedItems.map((item, index) => {
              const showCampaignHeader =
                index === 0 || item.campaign.id !== paginatedItems[index - 1].campaign.id;

              return (
                <React.Fragment key={`${item.campaign.id}-${item.publication.id}`}>
                  {showCampaignHeader && (
                    <tr className={theme === "dark" ? "bg-neutral-800/30" : "bg-primary-50/10"}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-primary-100 dark:bg-primary-900/30">
                            <Layers className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {item.campaign.id === 0
                                ? t("analytics.drilldown.standalone")
                                : item.campaign.title}
                            </div>
                            <div className="text-[10px] font-bold tracking-tight text-gray-500">
                              {item.campaign.id !== 0 && (
                                <>
                                  <span className="uppercase">
                                    {t(`common.status.${item.campaign.status}`) ||
                                      item.campaign.status}
                                  </span>
                                  <span className="mx-1">•</span>
                                </>
                              )}
                              {item.campaign.publications.length}{" "}
                              {t("common.publications") || "Publicaciones"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {item.campaign.total_views.toLocaleString()}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {item.campaign.total_clicks.toLocaleString()}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                          {item.campaign.total_engagement.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  )}

                  <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                    <td className="whitespace-nowrap px-6 py-3">
                      <div className="flex items-center gap-2 pl-8">
                        <FileText className="h-3.5 w-3.5 text-gray-400" />
                        <span className="max-w-[250px] truncate text-sm text-gray-600 dark:text-gray-300">
                          {item.publication.title}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.publication.views.toLocaleString()}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.publication.clicks.toLocaleString()}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-center">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                        {item.publication.engagement.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}

            {paginatedItems.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm ? t("common.noResults") : t("analytics.emptyState.title")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <AdvancedPagination
          currentPage={currentPage}
          lastPage={totalPages}
          total={allPublications.length}
          perPage={itemsPerPage || 12}
          onPageChange={setCurrentPage}
          onPerPageChange={(newPerPage: number) => {
            setItemsPerPage(newPerPage);
            setCurrentPage(1);
          }}
          t={t}
        />
      )}
    </div>
  );
}
