import CampaignTable from "@/Components/ManageContent/Campaign/CampaignTable";
import PublicationTable from "@/Components/ManageContent/Publication/PublicationTable";
import FilterSection from "@/Components/ManageContent/common/FilterSection";
import HeaderSection from "@/Components/ManageContent/common/HeaderSection";
import Pagination from "@/Components/ManageContent/common/Pagination";
import { useTheme } from "@/Hooks/useTheme";
import { CampaignListProps } from "@/types/CampaignListProps";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

const CampaignList = memo(
  ({
    items,
    mode,
    onEdit,
    onDelete,
    onAdd,
    onPublish,
    onViewDetails,
    isLoading,
    onFilterChange,
    onRefresh,
    pagination,
    onPageChange,
    onEditRequest,
    connectedAccounts = [],
  }: CampaignListProps) => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [platformFilter, setPlatformFilter] = useState("all");
    const [dateStart, setDateStart] = useState("");
    const [dateEnd, setDateEnd] = useState("");
    const [expandedCampaigns, setExpandedCampaigns] = useState<number[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    const toggleExpand = (id: number) => {
      setExpandedCampaigns((prev) =>
        prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id],
      );
    };

    const handleFilterChange = (key: string, value: string) => {
      if (key === "status") setStatusFilter(value);
      if (key === "platform") setPlatformFilter(value);
      if (key === "date_start") setDateStart(value);
      if (key === "date_end") setDateEnd(value);

      if (onFilterChange) {
        onFilterChange({
          status: key === "status" ? value : statusFilter,
          platform: key === "platform" ? value : platformFilter,
          date_start: key === "date_start" ? value : dateStart,
          date_end: key === "date_end" ? value : dateEnd,
        });
      }
    };

    return (
      <div className="overflow-hidden shadow-lg border transition-all duration-300 backdrop-blur-lg bg-white/95 border-gray-100/95 text-gray-900 dark:bg-black/95 dark:border-black/95 dark:text-white">
        <HeaderSection
          mode={mode}
          t={t}
          onAdd={onAdd}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          onRefresh={onRefresh}
        />

        {showFilters && (
          <FilterSection
            mode={mode}
            t={t}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            platformFilter={platformFilter}
            dateStart={dateStart}
            dateEnd={dateEnd}
            handleFilterChange={handleFilterChange}
          />
        )}

        {mode === "campaigns" ? (
          <CampaignTable
            items={items as any}
            key={items.length}
            t={t}
            isLoading={isLoading}
            expandedCampaigns={expandedCampaigns}
            toggleExpand={toggleExpand}
            onEdit={onEdit}
            onDelete={onDelete}
            onEditRequest={onEditRequest}
            onViewDetails={onViewDetails}
          />
        ) : (
          <PublicationTable
            items={items as any}
            t={t}
            isLoading={isLoading}
            connectedAccounts={connectedAccounts}
            onEdit={onEdit}
            onDelete={onDelete}
            onPublish={onPublish}
            onEditRequest={onEditRequest}
          />
        )}

        {pagination && (
          <Pagination
            pagination={pagination}
            onPageChange={onPageChange}
            t={t}
          />
        )}
      </div>
    );
  },
);

export default CampaignList;
