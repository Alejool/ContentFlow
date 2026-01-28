import CampaignMobileRowSkeleton from "@/Components/ManageContent/Campaign/CampaignMobileRowSkeleton";
import CampaignMobileTable from "@/Components/ManageContent/Campaign/CampaignMobileTable";
import CampaignPublications from "@/Components/ManageContent/Campaign/CampaignPublications";
import CampaignRow from "@/Components/ManageContent/Campaign/CampaignRow";
import CampaignRowSkeleton from "@/Components/ManageContent/Campaign/CampaignRowSkeleton";
import { TableHeader } from "@/Components/ManageContent/Publication/TableHeader";
import AdvancedPagination from "@/Components/common/ui/AdvancedPagination";
import EmptyState from "@/Components/common/ui/EmptyState";
import TableContainer from "@/Components/common/ui/TableContainer";
import { Campaign } from "@/types/Campaign";
import React, { Fragment, memo } from "react";

interface CampaignTableProps {
  items: Campaign[];
  t: (key: string) => string;
  expandedCampaigns: number[];
  toggleExpand: (id: number) => void;
  onEdit: (item: Campaign) => void;
  onDelete: (id: number) => void;
  onEditRequest?: (item: Campaign) => void;
  onViewDetails: (item: Campaign) => void;
  isLoading?: boolean;
  pagination?: any;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}

const CampaignTable = memo(
  ({
    items,
    t,
    expandedCampaigns,
    toggleExpand,
    onEdit,
    onDelete,
    onEditRequest,
    onViewDetails,
    isLoading,
    pagination,
    onPageChange,
    onPerPageChange,
  }: CampaignTableProps) => {
    const [smoothLoading, setSmoothLoading] = React.useState(isLoading);

    React.useEffect(() => {
      if (isLoading) {
        setSmoothLoading(true);
      } else {
        const timer = setTimeout(() => {
          setSmoothLoading(false);
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [isLoading]);
    const getStatusColor = (status?: string) => {
      switch (status) {
        case "active":
          return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
        case "inactive":
          return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
        case "completed":
          return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
        case "deleted":
          return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
        case "paused":
          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      }
    };

    return (
      <TableContainer
        className="w-full"
        title={t("campaigns.title") || "Campañas"}
        subtitle={
          t("campaigns.subtitle") ||
          "Gestiona tus agrupaciones de publicaciones"
        }
      >
        <div className="hidden lg:block overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
          <div className="grid grid-cols-1 grid-rows-1">
            {/* Data Table */}
            <div
              className={`col-start-1 row-start-1 transition-all duration-500 ${smoothLoading ? "invisible opacity-0" : "visible opacity-100"}`}
            >
              <table className="w-full text-left border-collapse z-0 whitespace-nowrap">
                {items.length > 0 && (
                  <thead className="bg-gray-50/50 border-gray-100 dark:bg-neutral-900/50 dark:border-neutral-700">
                    <tr className="text-[10px] uppercase tracking-wider border-b text-gray-500 dark:text-gray-400">
                      <TableHeader mode="campaigns" t={t} />
                    </tr>
                  </thead>
                )}
                <tbody className="divide-y divide-gray-50 dark:divide-neutral-700/50">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={100} className="p-0">
                        <EmptyState
                          title={t("campaigns.table.emptyState.title")}
                          description={
                            t("campaigns.table.emptyState.description") ||
                            "No se encontraron campañas."
                          }
                          className="border-none shadow-none bg-transparent"
                        />
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <Fragment key={item.id}>
                        <CampaignRow
                          item={item}
                          expandedCampaigns={expandedCampaigns}
                          toggleExpand={toggleExpand}
                          getStatusColor={getStatusColor}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onEditRequest={onEditRequest}
                          onViewDetails={onViewDetails}
                        />
                        {expandedCampaigns.includes(item.id) && (
                          <CampaignPublications
                            campaign={item}
                            getStatusColor={getStatusColor}
                          />
                        )}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Skeleton Layer */}
            {smoothLoading && (
              <div className="col-start-1 row-start-1 bg-white/50 dark:bg-neutral-900/50 animate-out fade-out duration-500 fill-mode-forwards z-20">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-gray-50 border-gray-100 dark:bg-neutral-900 dark:border-neutral-700">
                    <tr className="text-[10px] uppercase tracking-wider border-b">
                      <TableHeader mode="campaigns" t={t} />
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(5)].map((_, i) => (
                      <CampaignRowSkeleton key={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="lg:hidden relative">
          {!smoothLoading && items.length === 0 ? (
            <EmptyState
              title={t("campaigns.table.emptyState.title")}
              description={
                t("campaigns.table.emptyState.description") ||
                "No se encontraron campañas."
              }
              imageSize="sm"
            />
          ) : (
            <div className="grid grid-cols-1 grid-rows-1">
              {/* Data Layer */}
              <div
                className={`col-start-1 row-start-1 transition-all duration-500 ${smoothLoading ? "invisible opacity-0" : "visible opacity-100"}`}
              >
                <CampaignMobileTable
                  items={items}
                  t={t}
                  expandedCampaigns={expandedCampaigns}
                  toggleExpand={toggleExpand}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onEditRequest={onEditRequest}
                  onViewDetails={onViewDetails}
                  getStatusColor={getStatusColor}
                />
              </div>

              {/* Skeleton Layer */}
              {smoothLoading && (
                <div className="col-start-1 row-start-1 bg-white dark:bg-neutral-900 animate-out fade-out duration-500 fill-mode-forwards space-y-3 z-20">
                  {[...Array(3)].map((_, i) => (
                    <CampaignMobileRowSkeleton key={i} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {pagination && (
          <AdvancedPagination
            currentPage={pagination.current_page}
            lastPage={pagination.last_page}
            total={pagination.total}
            perPage={pagination.per_page || 10}
            onPageChange={onPageChange || (() => {})}
            onPerPageChange={onPerPageChange || (() => {})}
            t={t}
            isLoading={isLoading}
          />
        )}
      </TableContainer>
    );
  },
);

export default CampaignTable;
